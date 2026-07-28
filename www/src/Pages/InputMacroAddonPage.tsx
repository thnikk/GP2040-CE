import React, { useContext, useEffect, useState } from 'react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Col from '../components/ui/Col';
import Form from '../components/ui/Form';
import Row from '../components/ui/Row';
import Table from '../components/ui/Table';
import { Formik, useFormikContext } from 'formik';
import * as yup from 'yup';
import { Trans, useTranslation } from 'react-i18next';
import omit from 'lodash/omit';

import CustomSelect from '../components/form/CustomSelect';
import { AppContext } from '../Contexts/AppContext';
import { useToast } from '../Contexts/ToastContext';
import Section from '../components/shared/Section';
import WebApi from '../Services/WebApi';
import Lightning from '../Icons/Lightning';
import {
	getButtonLabels,
	BUTTONS,
	BUTTON_MASKS_OPTIONS,
} from '../Data/Buttons';

const MACRO_TYPES = [
	{ label: 'InputMacroAddon:input-macro-type.press', value: 1 },
	{ label: 'InputMacroAddon:input-macro-type.hold-repeat', value: 2 },
	{ label: 'InputMacroAddon:input-macro-type.toggle', value: 3 },
];

const schema = yup.object().shape({
	macroList: yup.array().of(
		yup.object().shape({
			macroType: yup.number(),
			macroLabel: yup.string(),
			enabled: yup.number(),
			exclusive: yup.number(),
			interruptible: yup.number(),
			showFrames: yup.number(),
			useMacroTriggerButton: yup.number(),
			macroTriggerButton: yup.number(),
			macroInputs: yup.array().of(
				yup.object().shape({
					buttonMask: yup.number(),
					duration: yup.number(),
					waitDuration: yup.number(),
				}),
			),
		}),
	),
	macroBoardLedEnabled: yup.number(),
});

const MACRO_INPUTS_MAX = 30;

const MACRO_LIMIT = 6;

const defaultMacroInput = {
	buttonMask: 0,
	duration: 16666,
	waitDuration: 0,
};

const defaultValues = {
	macroList: Array(MACRO_LIMIT).fill({
		macroType: 1,
		macroLabel: '',
		enabled: 0,
		exclusive: 1,
		interruptible: 1,
		showFrames: 1,
		useMacroTriggerButton: 0,
		macroTriggerButton: 0,
		macroInputs: [defaultMacroInput],
	}),
	macroBoardLedEnabled: 0,
};

const ONE_FRAME_US = 16666;

const FormContext = () => {
	const { setValues } = useFormikContext();
	const { setLoading } = useContext(AppContext);

	useEffect(() => {
		async function fetchData() {
			const options = await WebApi.getMacroAddonOptions(setLoading);
			setValues(options);
		}
		fetchData();
	}, [setValues]);

	return null;
};

const ButtonMasksComponent = (props) => {
	const {
		id: key,
		value,
		onChange,
		error,
		isInvalid,
		buttonLabelType,
		buttonMasks,
	} = props;
	return (
		<Form.Select
			size="sm"
			name={`${key}.buttonMask`}
			value={value}
			error={error}
			isInvalid={isInvalid}
			onChange={onChange}
		>
			{buttonMasks.map((o, i2) => (
				<option key={`${key}.mask[${i2}]`} value={o.value}>
					{(buttonLabelType && BUTTONS[buttonLabelType][o.label]) || o.label}
				</option>
			))}
		</Form.Select>
	);
};

const MacroInputComponent = (props) => {
	const {
		value: { duration, buttonMask, waitDuration },
		showFrames,
		errors,
		id: key,
		deleteMacroInput,
		setFieldValue,
	} = props;

	return (
		<Row className="align-items-center gx-2 pb-2 flex-nowrap">
			<Col xs="auto" style={{ width: 140 }}>
				<Form.Control
					className="text-center"
					type="number"
					name={`${key}.duration`}
					value={duration / (showFrames ? ONE_FRAME_US : 1000)}
					step="any"
					error={errors?.duration}
					isInvalid={errors?.duration}
					onChange={(e) => {
						setFieldValue(
							`${key}.duration`,
							e.target.value * (showFrames ? ONE_FRAME_US : 1000),
						);
					}}
					min={0}
				/>
			</Col>
			<Col xs="auto" style={{ flex: '1 1 auto', minWidth: 200 }}>
				<CustomSelect
					isMulti
					isClearable
					options={BUTTON_MASKS_OPTIONS.filter((o) => o.value !== 0)}
					value={BUTTON_MASKS_OPTIONS.filter(
						(o) => o.value !== 0 && buttonMask & o.value,
					)}
					onChange={(selected) => {
						const mask = selected
							? selected.reduce((acc, opt) => acc | opt.value, 0)
							: 0;
						setFieldValue(`${key}.buttonMask`, mask);
					}}
				/>
			</Col>
			<Col xs="auto" style={{ width: 140 }}>
				<Form.Control
					className="text-center"
					type="number"
					name={`${key}.waitDuration`}
					value={waitDuration / (showFrames ? ONE_FRAME_US : 1000)}
					step="any"
					error={errors?.waitDuration}
					isInvalid={errors?.waitDuration}
					onChange={(e) => {
						setFieldValue(
							`${key}.waitDuration`,
							e.target.value * (showFrames ? ONE_FRAME_US : 1000),
						);
					}}
					min={0}
				/>
			</Col>
			<Col xs="auto">
				<Button size="sm" onClick={deleteMacroInput}>
					{'✕'}
				</Button>
			</Col>
		</Row>
	);
};

const MacroComponent = (props) => {
	const {
		value: {
			macroLabel,
			macroType,
			macroInputs,
			enabled,
			exclusive,
			interruptible,
			showFrames,
			useMacroTriggerButton,
			macroTriggerButton,
		},
		errors,
		handleChange,
		id: key,
		translation: t,
		index,
		buttonLabelType,
		deleteMacroInput,
		setFieldValue,
		macroList,
	} = props;

	return (
		<div key={key}>
			<div className="card-section">
				<Row className="align-items-center">
					<Col sm={'auto'}>{t('InputMacroAddon:macro-name')}:</Col>
					<Col sm={'auto'}>
						<Form.Control
							size="sm"
							type="text"
							placeholder={t('InputMacroAddon:input-macro-macro-label-label')}
							name={`${key}.macroLabel`}
							value={macroLabel}
							error={errors?.macroLabel}
							isInvalid={errors?.macroLabel}
							onChange={handleChange}
							maxLength={256}
						/>
					</Col>
					<Col sm={'auto'}>
						<Form.Check
							name={`${key}.enabled`}
							label={t('InputMacroAddon:input-macro-macro-enabled')}
							type="switch"
							className="form-select-sm"
							checked={enabled}
							onChange={(e) => {
								setFieldValue(`${key}.enabled`, e.target.checked ? 1 : 0);
							}}
							isInvalid={false}
						/>
					</Col>
				</Row>
				<Row className="my-2">
					<Col sm={'auto'} mb={2}>
						{t('InputMacroAddon:macro-activation-type')}:
					</Col>
					<Col sm={'auto'}>
						<Form.Select
							name={`${key}.macroType`}
							className="form-select-sm sm-1"
							value={macroType}
							onChange={(e) => {
								setFieldValue(`${key}.macroType`, parseInt(e.target.value));
							}}
						>
							{MACRO_TYPES.map((o, i2) => (
								<option key={`${key}-macroType${i2}`} value={o.value}>
									{t(o.label)}
								</option>
							))}
						</Form.Select>
					</Col>
				</Row>
			</div>
			<div className="card-section">
				<Row>
					<Col sm={'auto'}>
						<Form.Check
							name={`${key}.interruptible`}
							label={t('InputMacroAddon:input-macro-macro-interruptible')}
							type="switch"
							className="form-select-sm"
							checked={interruptible}
							onChange={(e) => {
								setFieldValue(`${key}.interruptible`, e.target.checked ? 1 : 0);
							}}
							isInvalid={false}
						/>
					</Col>
				</Row>
				<Row>
					<Col sm={'auto'}>
						<Form.Check
							name={`${key}.exclusive`}
							label={t('InputMacroAddon:input-macro-macro-exclusive')}
							type="switch"
							className="form-select-sm"
							disabled={interruptible}
							checked={exclusive}
							onChange={(e) => {
								setFieldValue(`${key}.exclusive`, e.target.checked ? 1 : 0);
							}}
							isInvalid={false}
						/>
					</Col>
				</Row>
				<Row mt={2} className="align-items-center">
					<Col sm={'auto'}>
						<Form.Check
							name={`${key}.useMacroTriggerButton`}
							label={t('InputMacroAddon:input-macro-macro-uses-buttons')}
							type="switch"
							className="form-select-sm"
							checked={useMacroTriggerButton}
							onChange={(e) => {
								setFieldValue(
									`${key}.useMacroTriggerButton`,
									e.target.checked ? 1 : 0,
								);
							}}
							isInvalid={false}
						/>
					</Col>
					{useMacroTriggerButton == true && (
						<Row>
							<Col sm={'auto'}>
								{t('InputMacroAddon:input-macro-macro-button-pin-plus')}
							</Col>
							<Col sm={'auto'}>
								<ButtonMasksComponent
									className="col-sm-auto"
									value={macroTriggerButton}
									onChange={(e) => {
										setFieldValue(
											`${key}.macroTriggerButton`,
											parseInt(e.target.value),
										);
									}}
									buttonLabelType={buttonLabelType}
									translation={t}
									buttonMasks={BUTTON_MASKS_OPTIONS.filter(
										(b, i) =>
											macroList.find(
												(m, macroIdx) =>
													index != macroIdx &&
													m.useMacroTriggerButton &&
													m.macroTriggerButton === b.value,
											) === undefined,
									)}
								/>
							</Col>
						</Row>
					)}
				</Row>
				<Row>
					<Col sm={'auto'}>
						<Form.Check
							name={`${key}.showFrames`}
							label={t('InputMacroAddon:input-macro-macro-show-frames')}
							type="switch"
							className="form-select-sm"
							checked={showFrames}
							onChange={(e) => {
								setFieldValue(`${key}.showFrames`, e.target.checked ? 1 : 0);
							}}
							isInvalid={false}
						/>
					</Col>
				</Row>
			</div>
			<div className="card-section">
				<Row className="pb-1 fw-semibold flex-nowrap">
					<Col xs="auto" style={{ width: 140 }}>
						{t('InputMacroAddon:input-macro-duration-label')}
					</Col>
					<Col xs="auto" style={{ flex: '1 1 auto', minWidth: 200 }}>
						{t('InputMacroAddon:table-thread-button')}
					</Col>
					<Col xs="auto" style={{ width: 140 }}>
						{t('InputMacroAddon:input-macro-release-and-wait-label')}
					</Col>
					<Col xs="auto" />
				</Row>
				{macroInputs.map((macroInput, a) => (
					<MacroInputComponent
						key={`${key}.macroInputs[${a}]`}
						id={`${key}.macroInputs[${a}]`}
						value={macroInput}
						errors={errors?.macroInputs?.at(a)}
						showFrames={showFrames}
						deleteMacroInput={() => deleteMacroInput(a)}
						setFieldValue={setFieldValue}
					/>
				))}
				<Row>
					<Col sm={3}>
						{macroInputs.length < MACRO_INPUTS_MAX ? (
							<Button
								type="button"
								variant="success"
								className="col px-2"
								size="sm"
								onClick={() => {
									setFieldValue(`${key}.macroInputs[${macroInputs.length}]`, {
										...defaultMacroInput,
									});
								}}
							>
								<Trans
									ns="InputMacroAddon"
									i18nKey="input-macro-add-input-label"
								/>
							</Button>
						) : (
							<></>
						)}
					</Col>
				</Row>
			</div>
		</div>
	);
};

export default function MacrosPage() {
	const { buttonLabels, usedPins } = useContext(AppContext);
	const { showToast } = useToast();

	const saveSettings = async (values) => {
		const success = await WebApi.setMacroAddonOptions(values);
		showToast(
			success
				? t('Common:saved-success-message')
				: t('Common:saved-error-message'),
			success ? 'success' : 'error',
		);
	};

	const onSuccess = async (values) => await saveSettings(values);

	const { buttonLabelType, swapTpShareLabels } = buttonLabels;
	const CURRENT_BUTTONS = getButtonLabels(buttonLabelType, swapTpShareLabels);
	const buttonNames = omit(CURRENT_BUTTONS, ['label', 'value']);

	const { t } = useTranslation('');

	const handleCheckbox = async (name, values) => {
		values[name] = values[name] === 1 ? 0 : 1;
	};

	const [macroSubTab, setMacroSubTab] = useState('macro-0');

	return (
		<Formik
			validationSchema={schema}
			onSubmit={onSuccess}
			initialValues={defaultValues}
		>
			{({
				handleSubmit,
				handleChange,
				values,
				errors,
				setFieldValue,
				setValues,
			}) => (
				<div>
					<Form noValidate onSubmit={handleSubmit}>
						<Section
							heading
							icon={<Lightning />}
							title={t('InputMacroAddon:input-macro-header-text')}
						>
							<div className="card-section">
								<Row>
									<Col>
										<Table
											striped
											bordered
											hover
											className="text-center"
										>
											<thead>
												<tr>
													<th>#</th>
													<th>
														{t('InputMacroAddon:table-thread-label')}
													</th>
													<th>
														{t('InputMacroAddon:table-thread-type')}
													</th>
													<th>
														{t(
															'InputMacroAddon:table-thread-assigned-to',
														)}
													</th>
													<th>
														{t('InputMacroAddon:table-thread-button')}
													</th>
													<th>
														{t('InputMacroAddon:table-thread-actions')}
													</th>
													<th>
														{t('InputMacroAddon:table-thread-status')}
													</th>
												</tr>
											</thead>
											<tbody>
												{values.macroList.map((macro, i) => (
													<tr key={`macro-list-item-${i}`}>
														<td>{i + 1}</td>
														<td>
															{macro.macroLabel.length == 0 && (
																<em>None</em>
															)}
															{macro.macroLabel.length > 0 &&
																macro.macroLabel.slice(0, 32)}
															{macro.macroLabel.length > 32 && '...'}
														</td>
														<td>
															{t(
																MACRO_TYPES.find(
																	(m) => m.value === macro.macroType,
																).label,
															)}
														</td>
														<td>
															{macro.useMacroTriggerButton == 1
																? t(
																		'InputMacroAddon:input-macro-macro-trigger-type-button',
																	)
																: t(
																		'InputMacroAddon:input-macro-macro-trigger-type-pin',
																	)}
														</td>
														{macro.useMacroTriggerButton == 0 ? (
															<td>
																<em>---</em>
															</td>
														) : (
															<td>{`${
																BUTTON_MASKS_OPTIONS.find(
																	(b) =>
																		b.value == macro.macroTriggerButton,
																).label
															}`}</td>
														)}
														<td>{macro.macroInputs.length}</td>
														<td>
															{macro.enabled == true ? (
																<Badge bg="success">
																	{t(
																		'InputMacroAddon:input-macro-macro-enabled-badge',
																	)}
																</Badge>
															) : (
																<Badge bg="danger">
																	{t(
																		'InputMacroAddon:input-macro-macro-disabled-badge',
																	)}
																</Badge>
															)}
														</td>
													</tr>
												))}
											</tbody>
										</Table>
									</Col>
								</Row>
							</div>
							<div className="alert alert-info">
								{t('InputMacroAddon:input-macro-sub-header')}
							</div>
							<div className="card-section">
								<Row>
									<Col sm={10}>
										<Form.Check
											label={t(
												'InputMacroAddon:input-macro-board-led-enabled',
											)}
											type="switch"
											id="InputMacroAddonBoardLed"
											isInvalid={false}
											checked={Boolean(values.macroBoardLedEnabled)}
											onChange={(e) => {
												handleCheckbox('macroBoardLedEnabled', values);
												handleChange(e);
											}}
										/>
									</Col>
								</Row>
							</div>
							<div className="card-section">
								<div className="profile-tabs">
									{values.macroList.map((macro, i) => (
										<button
											key={`macro-tab-${i}`}
											type="button"
											className={`profile-tab${macroSubTab === `macro-${i}` ? ' active' : ''}`}
											onClick={() => setMacroSubTab(`macro-${i}`)}
										>
											{macro.macroLabel.length == 0
												? t('InputMacroAddon:input-macro-macro-list-txt', {
														macroNumber: i + 1,
													})
												: macro.macroLabel.length > 24
													? macro.macroLabel.substr(0, 24) + '...'
													: macro.macroLabel}
										</button>
									))}
								</div>
							</div>
							{macroSubTab !== 'overview' && (() => {
								const macroIndex = parseInt(macroSubTab.split('-')[1]);
								return (
									<MacroComponent
										key={`macroList[${macroIndex}]`}
										id={`macroList[${macroIndex}]`}
										value={values.macroList?.at(macroIndex)}
										errors={errors?.macroList?.at(macroIndex)}
										translation={t}
										buttonLabelType={buttonLabelType}
										handleChange={handleChange}
										index={macroIndex}
										setFieldValue={setFieldValue}
										deleteMacroInput={(i) => {
											values.macroList[macroIndex].macroInputs.splice(i, 1);
											setValues(values);
										}}
										buttonNames={buttonNames}
										macroList={values.macroList}
									/>
								);
							})()}
							<div className="d-flex justify-content-end">
								<Button type="submit">
									{t('Common:button-save-label')}
								</Button>
							</div>
						</Section>
						<FormContext />
					</Form>
				</div>
			)}
		</Formik>
	);
}
