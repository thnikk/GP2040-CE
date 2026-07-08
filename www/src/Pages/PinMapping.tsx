import React, {
	memo,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
	Alert,
	Button,
	Col,
	Collapse,
	Form,
	FormCheck,
	Nav,
	Overlay,
	OverlayTrigger,
	Popover,
	Row,
	Tab,
	Tooltip,
} from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import invert from 'lodash/invert';
import omit from 'lodash/omit';

import { AppContext } from '../Contexts/AppContext';
import useProfilesStore, { MAX_PROFILES } from '../Store/useProfilesStore';

import Section from '../Components/Section';
import CustomSelect from '../Components/CustomSelect';
import CaptureButton from '../Components/CaptureButton';
import BoardSVG from '../Components/BoardSVG';
import PinActionModal from '../Components/PinActionModal';

import { BUTTONS, BUTTON_MASKS, DPAD_MASKS, getButtonLabels } from '../Data/Buttons';
import { BUTTON_ACTIONS, PinActionValues } from '../Data/Pins';
import { useBoardSVG } from '../hooks/useBoardSVG';
import WebApi from '../Services/WebApi';
import './PinMapping.scss';
import { MultiValue, SingleValue } from 'react-select';
import InfoCircle from '../Icons/InfoCircle';
import { SketchPicker } from '@hello-pangea/color-picker';
import LEDColors from '../Data/LEDColors';

type OptionType = {
	label: string;
	value: PinActionValues;
	type: string;
	customButtonMask: number;
	customDpadMask: number;
};

const disabledOptions = [
	BUTTON_ACTIONS.RESERVED,
	BUTTON_ACTIONS.ASSIGNED_TO_ADDON,
];

const getMask = (maskArr, key) =>
	maskArr.find(
		({ label }) => label?.toUpperCase() === key.split('BUTTON_PRESS_')?.pop(),
	);

const isNonSelectable = (action) =>
	[
		BUTTON_ACTIONS.NONE,
		BUTTON_ACTIONS.CUSTOM_BUTTON_COMBO,
		...disabledOptions,
	].includes(action);

const isDisabled = (action) => disabledOptions.includes(action);

const options = Object.entries(BUTTON_ACTIONS)
	.filter(([, value]) => !isNonSelectable(value))
	.map(([key, value]) => {
		const buttonMask = getMask(BUTTON_MASKS, key);
		const dpadMask = getMask(DPAD_MASKS, key);

		return {
			label: key,
			value,
			type: buttonMask
				? 'customButtonMask'
				: dpadMask
					? 'customDpadMask'
					: 'action',
			customButtonMask: buttonMask?.value || 0,
			customDpadMask: dpadMask?.value || 0,
		};
	});

const groupedOptions = [
	{
		label: 'Buttons',
		options: options.filter(({ type }) => type !== 'action'),
	},
	{
		label: 'Actions',
		options: options.filter(({ type }) => type === 'action'),
	},
];

const getMultiValue = (pinData) => {
	if (pinData.action === BUTTON_ACTIONS.NONE) return;
	if (isDisabled(pinData.action)) {
		const actionKey = invert(BUTTON_ACTIONS)[pinData.action];
		return [{ label: actionKey, ...pinData }];
	}

	return pinData.action === BUTTON_ACTIONS.CUSTOM_BUTTON_COMBO
		? options.filter(
				({ type, customButtonMask, customDpadMask }) =>
					(pinData.customButtonMask & customButtonMask &&
						type === 'customButtonMask') ||
					(pinData.customDpadMask & customDpadMask &&
						type === 'customDpadMask'),
			)
		: options.filter((option) => option.value === pinData.action);
};

const ProfileLabel = memo(function ProfileLabel({
	profileIndex,
}: {
	profileIndex: number;
}) {
	const { t } = useTranslation('');
	const setProfileLabel = useProfilesStore((state) => state.setProfileLabel);
	const profileLabel = useProfilesStore(
		(state) => state.profiles[profileIndex].profileLabel,
	);
	const onLabelChange = useCallback(
		(event) =>
			setProfileLabel(
				profileIndex,
				event.target.value.replace(/[^a-zA-Z0-9\s]/g, ''),
			),
		[],
	);

	return (
		<div className="pin-grid">
			<Form.Label>{t('PinMapping:profile-label-title')}</Form.Label>
			<Form.Control
				type="text"
				value={profileLabel}
				placeholder={t('PinMapping:profile-label-default', {
					profileNumber: profileIndex + 1,
				})}
				onChange={onLabelChange}
				maxLength={16}
				pattern="[a-zA-Z0-9\s]+"
			/>
			<Form.Text muted>{t('PinMapping:profile-label-description')}</Form.Text>
		</div>
	);
});

const PinSelectList = memo(function PinSelectList({
	profileIndex,
	excludePins,
}: {
	profileIndex: number;
	excludePins?: Set<number>;
}) {
	const setProfilePin = useProfilesStore((state) => state.setProfilePin);

	const pins = useProfilesStore(
		useShallow((state) =>
			omit(state.profiles[profileIndex], ['profileLabel', 'enabled']),
		),
	);
	const { t } = useTranslation('');
	const { buttonLabels } = useContext(AppContext);
	const { buttonLabelType, swapTpShareLabels } = buttonLabels;
	const CURRENT_BUTTONS = getButtonLabels(buttonLabelType, swapTpShareLabels);
	const buttonNames = omit(CURRENT_BUTTONS, ['label', 'value']);

	const onChange = useCallback(
		(pin: string) =>
			(selected: MultiValue<OptionType> | SingleValue<OptionType>) => {
				if (!selected || (Array.isArray(selected) && !selected.length)) {
					setProfilePin(profileIndex, pin, {
						action: BUTTON_ACTIONS.NONE,
						customButtonMask: 0,
						customDpadMask: 0,
					});
				} else if (Array.isArray(selected) && selected.length > 1) {
					const lastSelected = selected[selected.length - 1];
					if (lastSelected.type === 'action') {
						setProfilePin(profileIndex, pin, {
							action: lastSelected.value,
							customButtonMask: 0,
							customDpadMask: 0,
						});
					} else {
						setProfilePin(
							profileIndex,
							pin,
							selected.reduce(
								(masks, option) => ({
									...masks,
									customButtonMask:
										option.type === 'customButtonMask'
											? masks.customButtonMask ^ option.customButtonMask
											: masks.customButtonMask,
									customDpadMask:
										option.type === 'customDpadMask'
											? masks.customDpadMask ^ option.customDpadMask
											: masks.customDpadMask,
								}),
								{
									action: BUTTON_ACTIONS.CUSTOM_BUTTON_COMBO,
									customButtonMask: 0,
									customDpadMask: 0,
								},
							),
						);
					}
				} else {
					setProfilePin(profileIndex, pin, {
						action: selected[0].value,
						customButtonMask: 0,
						customDpadMask: 0,
					});
				}
			},
		[],
	);

	const getOptionLabel = useCallback(
		(option: OptionType) => {
			const labelKey = option.label?.split('BUTTON_PRESS_')?.pop();
			return (
				(labelKey && buttonNames[labelKey]) ||
				t(`PinMapping:actions.${option.label}`)
			);
		},
		[buttonNames],
	);
	const pinEntries = Object.entries(pins).filter(([pin]) => {
		if (!excludePins) return true;
		const num = parseInt(pin.replace('pin', ''), 10);
		return !excludePins.has(num);
	});

	return pinEntries.map(([pin, pinData], index) => (
		<div key={`select-${index}`} className="d-flex align-items-center">
			<div className="d-flex flex-shrink-0" style={{ width: '4rem' }}>
				<label>{pin.toUpperCase()}</label>
			</div>
			<CustomSelect
				isClearable
				isMulti={!isDisabled(pinData.action)}
				options={groupedOptions}
				isDisabled={isDisabled(pinData.action)}
				getOptionLabel={getOptionLabel}
				onChange={onChange(pin)}
				value={getMultiValue(pinData)}
			/>
		</div>
	));
});



const ANIMATION_MODES = [
	{ value: 0, labelKey: 'animation-mode-0' },
	{ value: 1, labelKey: 'animation-mode-1' },
	{ value: 2, labelKey: 'animation-mode-2' },
	{ value: 3, labelKey: 'animation-mode-3' },
	{ value: 4, labelKey: 'animation-mode-4' },
];

const STATIC_THEMES = [
	'static-rainbow', 'xbox', 'xbox-all',
	'super-famicom', 'super-famicom-all',
	'playstation', 'playstation-all',
	'neo-geo', 'neo-geo-curved', 'neo-geo-modern',
	'six-button-fighter', 'six-button-fighter-plus',
	'street-fighter-2', 'tekken',
	'guilty-gear-type-a', 'guilty-gear-type-b', 'guilty-gear-type-c',
	'guilty-gear-type-d', 'guilty-gear-type-e',
	'fightboard', 'springboard',
];

const themeLabelKey = (index: number) => `CustomTheme:static-theme-${STATIC_THEMES[index]}`;

const PinSection = memo(function PinSection({
	profileIndex,
	pressedPin,
	customTheme,
	animationMode,
	themeIndex,
	hasCustomTheme,
	onLedColorChange,
	onSavePinColors,
	staticColorNormal,
}: {
	profileIndex: number;
	pressedPin?: number | null;
	customTheme?: Record<string, { normal: string; pressed: string }>;
	animationMode?: number;
	themeIndex?: number;
	hasCustomTheme?: boolean;
	onLedColorChange?: (buttonName: string, colors: { normal: string; pressed: string }) => void;
	onSavePinColors?: () => Promise<boolean>;
	staticColorNormal?: string;
}) {
	const { t } = useTranslation('');
	const copyBaseProfile = useProfilesStore((state) => state.copyBaseProfile);
	const setProfilePin = useProfilesStore((state) => state.setProfilePin);
	const saveProfiles = useProfilesStore((state) => state.saveProfiles);
	const toggleProfileEnabled = useProfilesStore(
		(state) => state.toggleProfileEnabled,
	);
	const enabled = useProfilesStore(
		(state) => state.profiles[profileIndex].enabled,
	);
	const profileLabel =
		useProfilesStore((state) => state.profiles[profileIndex].profileLabel) ||
		t('PinMapping:profile-label-default', {
			profileNumber: profileIndex + 1,
		});

	const { updateUsedPins, buttonLabels } = useContext(AppContext);
	const { buttonLabelType, swapTpShareLabels } = buttonLabels;
	const CURRENT_BUTTONS = getButtonLabels(buttonLabelType, swapTpShareLabels);
	const buttonNames = omit(CURRENT_BUTTONS, ['label', 'value']);

	const [saveMessage, setSaveMessage] = useState('');

	const handleSubmit = useCallback(async (e) => {
		e.preventDefault();
		e.stopPropagation();
		try {
			await saveProfiles();
			if (onSavePinColors) await onSavePinColors();
			updateUsedPins();
			setSaveMessage(t('Common:saved-success-message'));
		} catch (error) {
			setSaveMessage(t('Common:saved-error-message'));
		}
	}, [saveProfiles, onSavePinColors, updateUsedPins, t]);

	const { svgContent, pinElements, loading, svgMode } = useBoardSVG();
	const svgPinSet = useMemo(
		() => new Set(pinElements.map((p) => p.pinNumber)),
		[pinElements],
	);
	const [modalPin, setModalPin] = useState<number | null>(null);
	const [extraPinsOpen, setExtraPinsOpen] = useState(false);

	const profilePins = useProfilesStore(
		useShallow((state) => {
			const p = state.profiles[profileIndex];
			return p ? omit(p, ['profileLabel', 'enabled']) : {};
		}),
	);
	const savedProfiles = useProfilesStore((state) => state.savedProfiles);
	const dirtyPins = useMemo(() => {
		const saved = savedProfiles[profileIndex];
		if (!saved) return new Set<number>();
		const dirty = new Set<number>();
		for (let i = 0; i < 30; i++) {
			const key = `pin${i.toString().padStart(2, '0')}`;
			if (JSON.stringify(saved[key]) !== JSON.stringify(profilePins[key])) {
				dirty.add(i);
			}
		}
		return dirty;
	}, [savedProfiles, profilePins]);

	const handlePinClick = useCallback((pinNumber: number) => {
		setModalPin(pinNumber);
	}, []);

	const handleModalClose = useCallback(() => {
		setModalPin(null);
	}, []);

	const handlePinAssign = useCallback(
		(pinNumber: number, action: PinActionValues, customButtonMask: number, customDpadMask: number) => {
			const pinKey = pinNumber < 10 ? `pin0${pinNumber}` : `pin${pinNumber}`;
			setProfilePin(profileIndex, pinKey, { action, customButtonMask, customDpadMask });
		},
		[profileIndex],
	);

	const currentPinData = modalPin !== null
		? profilePins[`pin${modalPin.toString().padStart(2, '0')}`]
		: null;

	return (
		<>
			<Section
				title={t('PinMapping:profile-pin-mapping-title', {
					profileLabel,
				})}
			>
				<Form onSubmit={handleSubmit}>
					<div className="d-flex justify-content-between">
						<ProfileLabel profileIndex={profileIndex} />
						{profileIndex > 0 && (
							<div className="d-flex">
								<FormCheck
									size={3}
									label={
										<OverlayTrigger
											overlay={
												<Tooltip>
													{t('PinMapping:profile-enabled-tooltip')}
												</Tooltip>
											}
										>
											<div className="d-flex gap-1">
												<label>{t('Common:switch-enabled')} </label>
												<InfoCircle />
											</div>
										</OverlayTrigger>
									}
									type="switch"
									reverse
									checked={enabled}
									onChange={() => {
										toggleProfileEnabled(profileIndex);
									}}
								/>
							</div>
						)}
					</div>
					<hr />

					{svgMode ? (
						<div className="board-svg-wrapper">
							{loading ? (
								<div className="d-flex justify-content-center p-5">
									<span className="spinner-border" />
								</div>
							) : svgContent ? (
						<BoardSVG
								svgContent={svgContent}
								pinElements={pinElements}
								profileIndex={profileIndex}
								onPinClick={handlePinClick}
								highlightedPin={pressedPin}
								dirtyPins={dirtyPins}
								customTheme={customTheme}
								animationMode={animationMode}
								themeIndex={themeIndex}
								staticColorNormal={staticColorNormal}
							/>
							) : (
								<div className="alert alert-info">
									{t('PinMapping:no-svg-available')}
								</div>
							)}

							<PinActionModal
								show={modalPin !== null}
								pinNumber={modalPin}
								currentAction={currentPinData?.action ?? BUTTON_ACTIONS.NONE}
								currentCustomButtonMask={currentPinData?.customButtonMask ?? 0}
								currentCustomDpadMask={currentPinData?.customDpadMask ?? 0}
								onClose={handleModalClose}
								onAssign={handlePinAssign}
								customTheme={customTheme}
								hasCustomTheme={hasCustomTheme}
								onLedColorChange={onLedColorChange}
								onSaveColor={onSavePinColors}
							/>

							{pinElements.length > 0 && pinElements.length < 30 && (
								<>
									<hr />
									<div
										className="collapsible-heading"
										onClick={() => setExtraPinsOpen(!extraPinsOpen)}
										role="button"
										tabIndex={0}
										onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExtraPinsOpen(!extraPinsOpen); }}
										aria-controls="extra-pins-collapse"
										aria-expanded={extraPinsOpen}
									>
										<span>{extraPinsOpen ? '▲' : '▼'}</span>
										{t('PinMapping:unmapped-pins-title')}
									</div>
									<Collapse in={extraPinsOpen}>
										<div id="extra-pins-collapse">
											<div className="pin-grid gap-3 mt-3">
												<PinSelectList
													profileIndex={profileIndex}
													excludePins={svgPinSet}
												/>
											</div>
										</div>
									</Collapse>
								</>
							)}
						</div>
					) : (
						<div className="pin-grid gap-3 mt-3">
							<PinSelectList profileIndex={profileIndex} />
						</div>
					)}

					<div className="d-flex gap-3 my-3 align-items-center">
						<CaptureButton
							labels={Object.values(buttonNames)}
							onChange={(label, pin) =>
								setProfilePin(
									profileIndex,
									pin < 10 ? `pin0${pin}` : `pin${pin}`,
									{
										action:
											BUTTON_ACTIONS[
												`BUTTON_PRESS_${invert(buttonNames)[
													label
												].toUpperCase()}`
											],
										customButtonMask: 0,
										customDpadMask: 0,
									},
								)
							}
						/>
						{profileIndex > 0 && (
							<Button onClick={() => copyBaseProfile(profileIndex)}>
								{t(`PinMapping:profile-copy-base`)}
							</Button>
						)}
						<Button type="submit" className="ms-auto">{t('Common:button-save-label')}</Button>
					</div>
					{saveMessage && <Alert variant="info">{saveMessage}</Alert>}
				</Form>
			</Section>
		</>
	);
});

const defaultCustomTheme = Object.keys(BUTTONS.gp2040)
	?.filter((p) => p !== 'label' && p !== 'value')
	.reduce((a, p) => {
		a[p] = { normal: '#000000', pressed: '#000000' };
		return a;
	}, {});

defaultCustomTheme['ALL'] = { normal: '#000000', pressed: '#000000' };
defaultCustomTheme['GRADIENT NORMAL'] = {
	normal: '#00ffff',
	pressed: '#ff00ff',
};
defaultCustomTheme['GRADIENT PRESSED'] = {
	normal: '#ff00ff',
	pressed: '#00ffff',
};

export default function PinMapping() {
	const fetchProfiles = useProfilesStore((state) => state.fetchProfiles);
	const addProfile = useProfilesStore((state) => state.addProfile);
	const profiles = useProfilesStore((state) => state.profiles);
	const loadingProfiles = useProfilesStore((state) => state.loadingProfiles);

	const [pressedPin, setPressedPin] = useState<number | null>(null);
	const { t } = useTranslation('');
	const { savedColors, setSavedColors } = useContext(AppContext);

	const [customTheme, setCustomTheme] = useState({ ...defaultCustomTheme });
	const [animationMode, setAnimationMode] = useState(0);
	const [themeIndex, setThemeIndex] = useState(0);
	const [staticColorNormal, setStaticColorNormal] = useState('#ff0000');
	const [staticColorPressed, setStaticColorPressed] = useState('#ffffff');
	const [staticColorPickerTarget, setStaticColorPickerTarget] = useState<HTMLElement | null>(null);
	const [staticColorPickerType, setStaticColorPickerType] = useState<'normal' | 'pressed'>('normal');
	const [themeSaveMessage, setThemeSaveMessage] = useState('');
	const [ledsEnabled, setLedsEnabled] = useState(false);

	const { setLoading } = useContext(AppContext);

	useEffect(() => {
		fetchProfiles();
		async function fetchTheme() {
			const data = await WebApi.getCustomTheme(setLoading);
			if (data) {
				setAnimationMode(data.animationMode);
				setThemeIndex(data.themeIndex);
				if (data.staticColorNormal) setStaticColorNormal(data.staticColorNormal);
				if (data.staticColorPressed) setStaticColorPressed(data.staticColorPressed);
				if (!data.customTheme['ALL'])
					data.customTheme['ALL'] = { normal: '#000000', pressed: '#000000' };
				if (!data.customTheme['GRADIENT NORMAL'])
					data.customTheme['GRADIENT NORMAL'] = {
						normal: '#00ffff',
						pressed: '#ff00ff',
					};
				if (!data.customTheme['GRADIENT PRESSED'])
					data.customTheme['GRADIENT PRESSED'] = {
						normal: '#00ffff',
						pressed: '#ff00ff',
					};
				setCustomTheme(data.customTheme);
			}
		}
		fetchTheme();
		async function fetchLedOptions() {
			const options = await WebApi.getLedOptions();
			setLedsEnabled(options.dataPin > -1);
		}
		fetchLedOptions();
	}, []);

	const handleLedColorChange = useCallback(
		(buttonName: string, colors: { normal: string; pressed: string }) => {
			setCustomTheme((prev) => ({ ...prev, [buttonName]: colors }));
		},
		[],
	);

	const handleAnimationModeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
		setAnimationMode(Number(e.target.value));
	}, []);

	const handleThemeIndexChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
		setThemeIndex(Number(e.target.value));
	}, []);

	const handleStaticColorSwatchClick = useCallback((e: React.MouseEvent<HTMLElement>, type: 'normal' | 'pressed') => {
		setStaticColorPickerTarget(e.currentTarget);
		setStaticColorPickerType(type);
	}, []);

	const handleStaticColorChange = useCallback((c: { hex: string }) => {
		if (staticColorPickerType === 'normal') {
			setStaticColorNormal(c.hex);
		} else {
			setStaticColorPressed(c.hex);
		}
	}, [staticColorPickerType]);

	const submitTheme = useCallback(async () => {
		const leds = { ...customTheme };
		delete leds['ALL'];
		delete leds['GRADIENT NORMAL'];
		delete leds['GRADIENT PRESSED'];
		const success = await WebApi.setCustomTheme({
			hasCustomTheme: animationMode === 4,
			customTheme: leds,
			animationMode,
			themeIndex,
			staticColorNormal,
			staticColorPressed,
		});
		return success;
	}, [customTheme, animationMode, themeIndex, staticColorNormal, staticColorPressed]);

	const handleThemeSave = useCallback(async () => {
		const success = await submitTheme();
		if (success) {
			setThemeSaveMessage(t('Common:saved-success-message'));
		} else {
			setThemeSaveMessage(t('Common:saved-error-message'));
		}
	}, [submitTheme, t]);

	const savePinColors = useCallback(async () => {
		const leds = { ...customTheme };
		delete leds['ALL'];
		delete leds['GRADIENT NORMAL'];
		delete leds['GRADIENT PRESSED'];
		return WebApi.setCustomTheme({ customTheme: leds });
	}, [customTheme]);

	const hasCustomTheme = animationMode === 4;

	return (
		<>
			{ledsEnabled && (
				<Section title={t('CustomTheme:header-text')}>
					<div className="d-flex align-items-center gap-3 flex-wrap">
						<div className="d-flex align-items-center gap-2">
							<Form.Label className="mb-0">{t('CustomTheme:animation-label')}</Form.Label>
							<Form.Select
								value={animationMode}
								onChange={handleAnimationModeChange}
								style={{ width: 'auto' }}
							>
								{ANIMATION_MODES.map(({ value, labelKey }) => (
									<option key={value} value={value}>
										{t(`CustomTheme:${labelKey}`)}
									</option>
								))}
							</Form.Select>
						</div>
						{animationMode === 3 && (
							<div className="d-flex align-items-center gap-2">
								<Form.Label className="mb-0">{t('CustomTheme:preset-label')}</Form.Label>
								<Form.Select
									value={themeIndex}
									onChange={handleThemeIndexChange}
									style={{ width: 'auto' }}
								>
									{STATIC_THEMES.map((_, index) => (
										<option key={index} value={index}>
											{t(themeLabelKey(index))}
										</option>
									))}
								</Form.Select>
							</div>
						)}
						{animationMode === 0 && (
							<div className="d-flex align-items-center gap-3">
								<div
									className="led-color-swatch"
									style={{ backgroundColor: staticColorNormal }}
									onClick={(e) => handleStaticColorSwatchClick(e, 'normal')}
									role="button"
									tabIndex={0}
									onKeyDown={(e) => { if (e.key === 'Enter') handleStaticColorSwatchClick(e as any, 'normal'); }}
								>
									<small className="swatch-label">{t('CustomTheme:normal-label')}</small>
								</div>
								<div
									className="led-color-swatch"
									style={{ backgroundColor: staticColorPressed }}
									onClick={(e) => handleStaticColorSwatchClick(e, 'pressed')}
									role="button"
									tabIndex={0}
									onKeyDown={(e) => { if (e.key === 'Enter') handleStaticColorSwatchClick(e as any, 'pressed'); }}
								>
									<small className="swatch-label">{t('CustomTheme:pressed-label')}</small>
								</div>
								<Overlay
									show={staticColorPickerTarget !== null}
									target={staticColorPickerTarget}
									placement="bottom"
									popperConfig={{
										strategy: 'fixed',
										modifiers: [{ name: 'offset', options: { offset: [0, 10] } }],
									}}
									rootClose
									onHide={() => setStaticColorPickerTarget(null)}
								>
									<Popover onClick={(e) => e.stopPropagation()} style={{ zIndex: 9999 }}>
										<Popover.Body>
											<SketchPicker
												color={staticColorPickerType === 'normal' ? staticColorNormal : staticColorPressed}
												onChange={(c) => handleStaticColorChange(c)}
												disableAlpha={true}
												presetColors={[
													...LEDColors.map((c) => ({ title: c.name, color: c.value })),
													...savedColors.map((c) => ({ title: c, color: c })),
												]}
												width={180}
											/>
											<div className="d-flex justify-content-between mt-2">
												<Button size="sm" onClick={() => {
													const color = staticColorPickerType === 'normal' ? staticColorNormal : staticColorPressed;
													if (color && color !== '#000000' && !savedColors.includes(color)) {
														setSavedColors([...savedColors, color]);
													}
												}}>
													{t('Common:button-save-color-label')}
												</Button>
												<Button size="sm" variant="outline-danger" onClick={() => {
													const color = staticColorPickerType === 'normal' ? staticColorNormal : staticColorPressed;
													const idx = savedColors.indexOf(color);
													if (idx >= 0) {
														const newColors = [...savedColors];
														newColors.splice(idx, 1);
														setSavedColors(newColors);
													}
												}}>
													{t('Common:button-delete-color-label')}
												</Button>
											</div>
										</Popover.Body>
									</Popover>
								</Overlay>
							</div>
						)}
						<div className="d-flex align-items-center gap-3 ms-auto">
							<Button onClick={handleThemeSave}>{t('Common:button-save-label')}</Button>
							{themeSaveMessage && <Alert variant="info" className="mb-0">{themeSaveMessage}</Alert>}
						</div>
					</div>
				</Section>
			)}
			<Tab.Container defaultActiveKey="profile-0">
				<Row>
					<Col md={3}>
						{loadingProfiles && (
							<div className="d-flex justify-content-center">
								<span className="spinner-border" />
							</div>
						)}
						<Nav variant="pills" className="flex-column">
							{profiles.map(({ profileLabel, enabled }, index) => (
								<Nav.Item key={`profile-${index}`}>
									<Nav.Link eventKey={`profile-${index}`}>
										{profileLabel ||
											t('PinMapping:profile-label-default', {
												profileNumber: index + 1,
											})}

										{!enabled && index > 0 && (
											<span>{t('PinMapping:profile-disabled')}</span>
										)}
									</Nav.Link>
								</Nav.Item>
							))}
							{profiles.length !== MAX_PROFILES && (
								<Button
									type="button"
									className="mt-1"
									variant="outline"
									onClick={addProfile}
								>
									{t('PinMapping:profile-add-button')}
								</Button>
							)}
						</Nav>
						<hr />
						<p className="text-center">{t('PinMapping:sub-header-text')}</p>
						<div className="d-flex justify-content-center pb-3">
							<CaptureButton
								buttonLabel={t('PinMapping:pin-viewer')}
								labels={['']}
								onChange={(_, pin) => setPressedPin(pin)}
							/>
						</div>
						{pressedPin !== null && (
							<div className="alert alert-info mt-3">
								<strong>{t('PinMapping:pin-pressed', { pressedPin })}</strong>
							</div>
						)}
					</Col>
					<Col md={9}>
						<Tab.Content>
							{profiles.map((_, index) => (
								<Tab.Pane key={`profile-${index}`} eventKey={`profile-${index}`}>
							<PinSection
								profileIndex={index}
								pressedPin={pressedPin}
								customTheme={ledsEnabled ? customTheme : undefined}
								animationMode={ledsEnabled ? animationMode : undefined}
								themeIndex={ledsEnabled ? themeIndex : undefined}
								hasCustomTheme={ledsEnabled ? hasCustomTheme : undefined}
								onLedColorChange={ledsEnabled ? handleLedColorChange : undefined}
								onSavePinColors={ledsEnabled ? savePinColors : undefined}
								staticColorNormal={ledsEnabled ? staticColorNormal : undefined}
							/>
								</Tab.Pane>
							))}
						</Tab.Content>
					</Col>
				</Row>
			</Tab.Container>
		</>
	);
}
