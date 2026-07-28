import React, { useEffect, useState, useRef, useContext } from 'react';
import { AppContext } from '../Contexts/AppContext';
import Button from '../components/ui/Button';
import Form from '../components/ui/Form';
import { useTranslation } from 'react-i18next';
import { useToast } from '../Contexts/ToastContext';

import Section from '../components/shared/Section';
import Upload from '../Icons/Upload';
import Download from '../Icons/Download';
import WebApi from '../Services/WebApi';

const FILE_EXTENSION = '.gp2040';
const FILENAME = 'gp2040ce_backup_{DATE}' + FILE_EXTENSION;

const API_BINDING = {
	display: {
		label: 'Display',
		get: WebApi.getDisplayOptions,
		set: WebApi.setDisplayOptions,
	},
	splash: {
		label: 'Splash Image',
		get: WebApi.getSplashImage,
		set: WebApi.setSplashImage,
	},
	gamepad: {
		label: 'Gamepad',
		get: WebApi.getGamepadOptions,
		set: WebApi.setGamepadOptions,
	},
	led: { label: 'LED', get: WebApi.getLedOptions, set: WebApi.setLedOptions },
	ledTheme: {
		label: 'Custom LED Theme',
		get: WebApi.getCustomTheme,
		set: WebApi.setCustomTheme,
	},
	macros: {
		label: 'Macro Mappings',
		get: WebApi.getMacroAddonOptions,
		set: WebApi.setMacroAddonOptions,
	},
	pins: {
		label: 'Pin Mappings',
		get: WebApi.getPinMappings,
		set: WebApi.setPinMappings,
	},
	profiles: {
		label: 'Profile Mappings',
		get: WebApi.getProfileOptions,
		set: WebApi.setProfileOptions,
	},
	addons: {
		label: 'Add-Ons',
		get: WebApi.getAddonsOptions,
		set: WebApi.setAddonsOptions,
	},
};

export default function BackupPage() {
	const inputFileSelect = useRef();

	const [optionState, setOptionStateData] = useState({});
	const [checkValues, setCheckValues] = useState({});
	const { setLoading } = useContext(AppContext);
	const { showToast } = useToast();

	const { t } = useTranslation('');

	useEffect(() => {
		async function fetchData() {
			let exportData = {};
			for (const [key, func] of Object.entries(API_BINDING)) {
				exportData[key] = await func.get(setLoading);
			}
			setOptionStateData(exportData);
		}
		fetchData();

		function getDefaultValues() {
			let defaults = {};
			for (const [key] of Object.entries(API_BINDING)) {
				defaults[`export_${key}`] = true;
				defaults[`import_${key}`] = true;
			}
			return defaults;
		}
		setCheckValues(getDefaultValues());
	}, []);

	const validateValues = (data, nextData) => {
		if (typeof data != 'object' || typeof nextData != 'object') {
			return {};
		}

		let validated = Array.isArray(data) ? [] : {};
		const addValidated = (value, key) =>
			Array.isArray(validated)
				? validated.push(value)
				: (validated[key] = value);

		for (const [key, value] of Object.entries(data)) {
			const nextDataValue = nextData[key];
			if (
				nextDataValue !== null &&
				typeof nextDataValue !== 'undefined' &&
				typeof value == typeof nextDataValue
			) {
				if (typeof nextDataValue == 'object') {
					addValidated(validateValues(value, nextDataValue), key);
				} else {
					addValidated(nextDataValue, key);
				}
			}
		}

		return validated;
	};

	const setOptionsToAPIStorage = async (options) => {
		for (const [key, func] of Object.entries(API_BINDING)) {
			const values = options[key];
			if (values) {
				const result = await func.set(values);
				console.log(result);
			}
		}
	};

	const handleChange = (ev) => {
		const id = ev.nativeEvent.target.id;
		let nextCheckValue = {};
		nextCheckValue[id] = !checkValues[id];
		setCheckValues((checkValues) => ({ ...checkValues, ...nextCheckValue }));
	};

	const handleSave = async () => {
		let exportData = {};
		for (const [key, value] of Object.entries(checkValues)) {
			if (key.match('export_') && (value != null || value !== undefined)) {
				let skey = key.slice(7, key.length);
				if (optionState[skey] !== undefined || optionState[skey] != null) {
					exportData[skey] = optionState[skey];
				}
			}
		}

		const fileDate = new Date().toISOString().replace(/[^0-9]/g, '');
		const name = FILENAME.replace('{DATE}', fileDate);
		const json = JSON.stringify(exportData);
		const file = new Blob([json], { type: 'text/json;charset=utf-8' });

		let a = document.createElement('a');
		a.href = URL.createObjectURL(file);
		a.download = name;
		a.innerHTML = 'Save Backup';

		let container = document.getElementById('root');
		container.appendChild(a);

		a.click();
		a.remove();

		showToast(t('BackupPage:saved-success-message', { name }), 'success');
	};

	const handleFileSelect = (ev) => {
		const input = ev.target;
		if (!input) {
			showToast('Unknown browser error, missing event data!', 'error');
			return;
		}
		if (input.files.length === 0) {
			showToast('No files are loaded.', 'error');
			return;
		}

		const fileName = input.files[0].name;

		let reader = new FileReader();
		reader.onload = function () {
			let fileData = undefined;
			try {
				fileData = JSON.parse(reader.result);
			} catch (e) {
				showToast(`Failed to parse data for ${fileName}!`, 'error');
				return;
			}
			if (!fileData) {
				showToast(`No file data found for ${fileName}`, 'error');
				return;
			}
			let newData = {};
			for (const [key, value] of Object.entries(fileData)) {
				if (optionState[key]) {
					const result = validateValues(optionState[key], value);
					newData[key] = result;
				}
			}

			if (Object.entries(newData).length > 0) {
				let filteredData = {};
				for (const [key, value] of Object.entries(checkValues)) {
					if (key.match('import_') && (value != null || value !== undefined)) {
						let skey = key.slice(7, key.length);
						if (newData[skey] !== undefined || newData[skey] != null) {
							filteredData[skey] = newData[skey];
						}
					}
				}
				const nextOptions = { ...optionState, ...filteredData };
				setOptionStateData(nextOptions);

				setOptionsToAPIStorage(nextOptions);

				showToast(`Loaded ${fileName}`, 'success');
			}
		};
		reader.onerror = () => {
			showToast(`Error occured while reading ${fileName}.`, 'error');
		};
		reader.readAsText(input.files[0]);
	};

	return (
		<>
			<Section
				heading
				icon={<Download />}
				title={t('BackupPage:save-header-text')}
			>
				<div className="d-flex flex-column gap-1">
					<div className="d-flex flex-column gap-1">
						{Object.entries(API_BINDING).map((api) => (
							<Form.Check
								id={`export_${api[0]}`}
								key={`export_${api[0]}`}
								label={t('BackupPage:save-export-option-label', {
									api: t(`BackupPage:api-${api[0]}-text`),
								})}
								type={'checkbox'}
								checked={checkValues[`export_${api[0]}`] ?? false}
								onChange={handleChange}
							/>
						))}
					</div>
					<div className="d-flex gap-2 align-self-end">
						<Button type="submit" onClick={handleSave}>
							{t('Common:button-save-label')}
						</Button>
					</div>
				</div>
			</Section>
			<Section
				heading
				icon={<Upload />}
				title={t('BackupPage:load-header-text')}
			>
				<div className="alert alert-warning">
					{t('BackupPage:pin-version-warning-text')}
				</div>
				<div className="d-flex flex-column gap-1">
					<div className="d-flex flex-column gap-1">
						{Object.entries(API_BINDING).map((api) => (
							<Form.Check
								id={`import_${api[0]}`}
								key={`import_${api[0]}`}
								label={t('BackupPage:load-export-option-label', {
									api: t(`BackupPage:api-${api[0]}-text`),
								})}
								type={'checkbox'}
								checked={checkValues[`import_${api[0]}`] ?? false}
								onChange={handleChange}
							/>
						))}
					</div>
					<input
						ref={inputFileSelect}
						type={'file'}
						accept={FILE_EXTENSION}
						className="d-none"
						onChange={handleFileSelect.bind(this)}
					/>
					<div className="d-flex gap-2 align-self-end">
						<Button
							onClick={() => {
								inputFileSelect.current.click();
							}}
						>
							{t('Common:button-load-label')}
						</Button>
					</div>
				</div>
			</Section>
		</>
	);
}
