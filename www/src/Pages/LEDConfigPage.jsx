import React, { useContext, useEffect, useState, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import { useShallow } from 'zustand/react/shallow';
import omit from 'lodash/omit';

import { Formik, useFormikContext } from 'formik';
import * as yup from 'yup';
import { Trans, useTranslation } from 'react-i18next';

import { AppContext } from '../Contexts/AppContext';
import ColorPicker from '../Components/ColorPicker';
import Section from '../Components/Section';
import FormControl from '../Components/FormControl';
import FormSelect from '../Components/FormSelect';
import { BUTTON_ACTIONS } from '../Data/Pins';
import LEDColors from '../Data/LEDColors';
import { hexToInt } from '../Services/Utilities';
import WebApi from '../Services/WebApi';
import useProfilesStore from '../Store/useProfilesStore';

const LED_FORMATS = [
	{ label: 'GRB', value: 0 },
	{ label: 'RGB', value: 1 },
	{ label: 'GRBW', value: 2 },
	{ label: 'RGBW', value: 3 },
];

const PLED_LABELS = [
	{ 0: 'PLED #1 Pin', 1: 'PLED #1 Index' },
	{ 0: 'PLED #2 Pin', 1: 'PLED #2 Index' },
	{ 0: 'PLED #3 Pin', 1: 'PLED #3 Index' },
	{ 0: 'PLED #4 Pin', 1: 'PLED #4 Index' },
];

const ACTION_LABELS = {
	[BUTTON_ACTIONS.BUTTON_PRESS_UP]: 'Up',
	[BUTTON_ACTIONS.BUTTON_PRESS_DOWN]: 'Down',
	[BUTTON_ACTIONS.BUTTON_PRESS_LEFT]: 'Left',
	[BUTTON_ACTIONS.BUTTON_PRESS_RIGHT]: 'Right',
	[BUTTON_ACTIONS.BUTTON_PRESS_B1]: 'B1',
	[BUTTON_ACTIONS.BUTTON_PRESS_B2]: 'B2',
	[BUTTON_ACTIONS.BUTTON_PRESS_B3]: 'B3',
	[BUTTON_ACTIONS.BUTTON_PRESS_B4]: 'B4',
	[BUTTON_ACTIONS.BUTTON_PRESS_L1]: 'L1',
	[BUTTON_ACTIONS.BUTTON_PRESS_R1]: 'R1',
	[BUTTON_ACTIONS.BUTTON_PRESS_L2]: 'L2',
	[BUTTON_ACTIONS.BUTTON_PRESS_R2]: 'R2',
	[BUTTON_ACTIONS.BUTTON_PRESS_S1]: 'S1',
	[BUTTON_ACTIONS.BUTTON_PRESS_S2]: 'S2',
	[BUTTON_ACTIONS.BUTTON_PRESS_L3]: 'L3',
	[BUTTON_ACTIONS.BUTTON_PRESS_R3]: 'R3',
	[BUTTON_ACTIONS.BUTTON_PRESS_A1]: 'A1',
	[BUTTON_ACTIONS.BUTTON_PRESS_A2]: 'A2',
};

const DEFAULT_PIN_LED_INDICES = {};
for (let i = 0; i < 30; i++) {
	DEFAULT_PIN_LED_INDICES[String(i)] = -1;
}

const defaultValue = {
	brightnessMaximum: 255,
	brightnessSteps: 5,
	dataPin: -1,
	ledFormat: 0,
	ledLayout: 0,
	ledsPerButton: 2,
	pledType: -1,
	pledPin1: -1,
	pledPin2: -1,
	pledPin3: -1,
	pledPin4: -1,
	pledIndex1: -1,
	pledIndex2: -1,
	pledIndex3: -1,
	pledIndex4: -1,
	pledColor: '#00ff00',
    caseRGBType: 0,
    caseRGBIndex: -1,
    caseRGBCount: 0,
    caseRGBColor: '#00ff00',
	pinLedIndices: { ...DEFAULT_PIN_LED_INDICES },
};

const schema = yup.object().shape({
	brightnessMaximum: yup
		.number()
		.required()
		.positive()
		.integer()
		.min(0)
		.max(255)
		.label('Max Brightness'),
	brightnessSteps: yup
		.number()
		.required()
		.positive()
		.integer()
		.min(1)
		.max(10)
		.label('Brightness Steps'),
	dataPin: yup.number().required().checkUsedPins(),
	ledFormat: yup
		.number()
		.required()
		.positive()
		.integer()
		.min(0)
		.max(3)
		.label('LED Format'),
	ledLayout: yup
		.number()
		.required()
		.integer()
		.min(0)
		.max(33)
		.label('LED Layout'),
	ledsPerButton: yup
		.number()
		.required()
		.positive()
		.integer()
		.min(1)
		.label('LEDs Per Pixel'),
	pledType: yup.number().required().label('Player LED Type'),
	pledColor: yup.string().label('RGB Player LEDs').validateColor(),
	pledPin1: yup
		.number()
		.label('PLED 1')
		.validatePinWhenEqualTo('pledPins1', 'pledType', 0),
	pledPin2: yup
		.number()
		.label('PLED 2')
		.validatePinWhenEqualTo('pledPins2', 'pledType', 0),
	pledPin3: yup
		.number()
		.label('PLED 3')
		.validatePinWhenEqualTo('pledPins3', 'pledType', 0),
	pledPin4: yup
		.number()
		.label('PLED 4')
		.validatePinWhenEqualTo('pledPins4', 'pledType', 0),
	pledIndex1: yup
		.number()
		.label('PLED Index 1')
		.validateMinWhenEqualTo('pledType', 1, 0),
	pledIndex2: yup
		.number()
		.label('PLED Index 2')
		.validateMinWhenEqualTo('pledType', 1, 0),
	pledIndex3: yup
		.number()
		.label('PLED Index 3')
		.validateMinWhenEqualTo('pledType', 1, 0),
	pledIndex4: yup
		.number()
		.label('PLED Index 4')
		.validateMinWhenEqualTo('pledType', 1, 0),
	turnOffWhenSuspended: yup.number().label('Turn Off When Suspended'),
	caseRGBType: yup.number().required().label('Case RGB Type'),
	caseRGBColor: yup.string().label('Case RGB LEDs').validateColor(),
    caseRGBCount: yup
        .number()
        .required()
        .positive()
        .integer()
        .min(0)
        .max(100)
        .label('Case RGB Count'),
    caseRGBIndex: yup
		.number()
		.label('Case RGB Index')
        .min(-1)
        .max(100),
	pinLedIndices: yup.object(),
});

const PIN_ACTIONS = [
	BUTTON_ACTIONS.BUTTON_PRESS_UP,
	BUTTON_ACTIONS.BUTTON_PRESS_DOWN,
	BUTTON_ACTIONS.BUTTON_PRESS_LEFT,
	BUTTON_ACTIONS.BUTTON_PRESS_RIGHT,
	BUTTON_ACTIONS.BUTTON_PRESS_B1,
	BUTTON_ACTIONS.BUTTON_PRESS_B2,
	BUTTON_ACTIONS.BUTTON_PRESS_B3,
	BUTTON_ACTIONS.BUTTON_PRESS_B4,
	BUTTON_ACTIONS.BUTTON_PRESS_L1,
	BUTTON_ACTIONS.BUTTON_PRESS_R1,
	BUTTON_ACTIONS.BUTTON_PRESS_L2,
	BUTTON_ACTIONS.BUTTON_PRESS_R2,
	BUTTON_ACTIONS.BUTTON_PRESS_S1,
	BUTTON_ACTIONS.BUTTON_PRESS_S2,
	BUTTON_ACTIONS.BUTTON_PRESS_L3,
	BUTTON_ACTIONS.BUTTON_PRESS_R3,
	BUTTON_ACTIONS.BUTTON_PRESS_A1,
	BUTTON_ACTIONS.BUTTON_PRESS_A2,
];

const PIN_LABELS = {};
for (let i = 0; i < 30; i++) {
	PIN_LABELS[i] = `GP${i}`;
}

const FormContext = () => {
	const { setValues } = useFormikContext();
	const { setLoading } = useContext(AppContext);

	useEffect(() => {
		async function fetchData() {
			const data = await WebApi.getLedOptions(setLoading);
			if (!data.pinLedIndices) {
				data.pinLedIndices = {};
				for (let i = 0; i < 30; i++) data.pinLedIndices[String(i)] = -1;
			}
			setValues(data);
		}

		fetchData();
	}, []);

	return null;
};

export default function LEDConfigPage() {
	const { buttonLabels, updateUsedPins } = useContext(AppContext);
	const [saveMessage, setSaveMessage] = useState('');
	const [colorPickerTarget, setColorPickerTarget] = useState(null);
	const [showPicker, setShowPicker] = useState(false);
	const [boardLedFormat, setBoardLedFormat] = useState(0);
	const [boardLedBrightness, setBoardLedBrightness] = useState(128);
	const [boardLedEnabled, setBoardLedEnabled] = useState(false);
	const [boardLedSaveMessage, setBoardLedSaveMessage] = useState('');
	const [boardLedLoaded, setBoardLedLoaded] = useState(false);

	const { buttonLabelType, swapTpShareLabels } = buttonLabels;

	const { t } = useTranslation('');

	const pins = useProfilesStore(
		useShallow((state) => {
			const p = state.profiles[0];
			if (!p) return {};
			return omit(p, ['profileLabel', 'enabled']);
		}),
	);

	const pinActions = useMemo(() => {
		const actions = {};
		for (let pin = 0; pin < 30; pin++) {
			const pinData = pins[`pin${String(pin).padStart(2, '0')}`];
			const action = pinData?.action ?? BUTTON_ACTIONS.NONE;
			actions[pin] = PIN_ACTIONS.includes(action)
				? ACTION_LABELS[action] || ''
				: '';
		}
		return actions;
	}, [pins]);

	// Translate PLED labels
	PLED_LABELS.map((p, n) => {
		p[0] = t(`LedConfig:pled-pin-label`, { pin: ++n });
		p[1] = t(`LedConfig:pled-index-label`, { index: n });
	});

	// Fetch board LED options
	useEffect(() => {
		async function fetchBoardLed() {
			const data = await WebApi.getBoardLedOptions(() => {});
			if (data) {
				setBoardLedFormat(data.boardLedFormat);
				setBoardLedBrightness(data.boardLedBrightness);
				setBoardLedEnabled(data.boardLedEnabled);
				setBoardLedLoaded(true);
			}
		}
		fetchBoardLed();
	}, []);

	const onBoardLedSave = async () => {
		const success = await WebApi.setBoardLedOptions({
			boardLedFormat,
			boardLedBrightness,
		});
		setBoardLedSaveMessage(
			success
				? t('Common:saved-success-message')
				: t('Common:saved-error-message'),
		);
		if (success) {
			setTimeout(() => setBoardLedSaveMessage(''), 3000);
		}
	};

	const toggleRgbPledPicker = (e) => {
		e.stopPropagation();
		setColorPickerTarget(e.target);
		setShowPicker(!showPicker);
	};

	const onSuccess = async (values) => {
		const data = {
			...values,
			pledColor: hexToInt(values.pledColor || '#000000'),
            caseRGBColor: hexToInt(values.caseRGBColor || '#000000'),
		};

		const success = await WebApi.setLedOptions(data);
		if (success) updateUsedPins();

		setSaveMessage(
			success
				? t('Common:saved-success-message')
				: t('Common:saved-error-message'),
		);
	};

	const onSubmit = (e, handleSubmit) => {
		e.preventDefault();
		setSaveMessage('');
		handleSubmit();
	};

	return (
		<Formik
			validationSchema={schema}
			onSubmit={onSuccess}
			initialValues={defaultValue}
		>
			{({
				handleSubmit,
				handleChange,
				handleBlur,
				values,
				errors,
				setFieldValue,
			}) => (
				<Form noValidate onSubmit={(e) => onSubmit(e, handleSubmit)}>
					<Section title={t('LedConfig:rgb.header-text')}>
						<Row>
							<FormControl
								type="number"
								label={t('LedConfig:rgb.data-pin-label')}
								name="dataPin"
								className="form-control-sm"
								groupClassName="col-sm-4"
								value={values.dataPin}
								error={errors.dataPin}
								isInvalid={errors.dataPin}
								onChange={handleChange}
								min={-1}
								max={29}
							/>
							<FormSelect
								label={t('LedConfig:rgb.led-format-label')}
								name="ledFormat"
								className="form-select-sm"
								groupClassName="col-sm-4"
								value={values.ledFormat}
								error={errors.ledFormat}
								isInvalid={errors.ledFormat}
								onChange={(e) =>
									setFieldValue('ledFormat', parseInt(e.target.value))
								}
							>
								{LED_FORMATS.map((o, i) => (
									<option key={`ledFormat-option-${i}`} value={o.value}>
										{o.label}
									</option>
								))}
							</FormSelect>
							<input
								type="hidden"
								name="ledLayout"
								value={values.ledLayout}
							/>
						</Row>
						<Row>
							<FormControl
								type="number"
								label={t('LedConfig:rgb.leds-per-button-label')}
								name="ledsPerButton"
								className="form-control-sm"
								groupClassName="col-sm-4"
								value={values.ledsPerButton}
								error={errors.ledsPerButton}
								isInvalid={errors.ledsPerButton}
								onChange={handleChange}
								min={1}
							/>
							<FormControl
								type="number"
								label={t('LedConfig:rgb.led-brightness-maximum-label')}
								name="brightnessMaximum"
								className="form-control-sm"
								groupClassName="col-sm-4"
								value={values.brightnessMaximum}
								error={errors.brightnessMaximum}
								isInvalid={errors.brightnessMaximum}
								onChange={handleChange}
								min={0}
								max={255}
							/>
							<FormControl
								type="number"
								label={t('LedConfig:rgb.led-brightness-steps-label')}
								name="brightnessSteps"
								className="form-control-sm"
								groupClassName="col-sm-4"
								value={values.brightnessSteps}
								error={errors.brightnessSteps}
								isInvalid={errors.brightnessSteps}
								onChange={handleChange}
								min={1}
								max={10}
							/>
							<div className="col-sm-3">
								<Form.Check
									label={t('LedConfig:turn-off-when-suspended')}
									type="switch"
									name="turnOffWhenSuspended"
									isInvalid={false}
									checked={Boolean(values.turnOffWhenSuspended)}
									onChange={(e) => {
										setFieldValue(
											'turnOffWhenSuspended',
											e.target.checked ? 1 : 0,
										);
									}}
								/>
							</div>
						</Row>
					</Section>
					{boardLedLoaded && boardLedEnabled ? (
						<Section title={t('LedConfig:board-led.header-text')}>
							<Row>
								<FormSelect
									label={t('LedConfig:board-led.format-label')}
									className="form-select-sm"
									groupClassName="col-sm-4"
									value={boardLedFormat}
									onChange={(e) =>
										setBoardLedFormat(parseInt(e.target.value))
									}
								>
									{LED_FORMATS.map((o, i) => (
										<option key={`boardLedFormat-option-${i}`} value={o.value}>
											{o.label}
										</option>
									))}
								</FormSelect>
								<FormControl
									type="number"
									label={t('LedConfig:board-led.brightness-label')}
									className="form-control-sm"
									groupClassName="col-sm-4"
									value={boardLedBrightness}
									onChange={(e) =>
										setBoardLedBrightness(parseInt(e.target.value))
									}
									min={0}
									max={255}
								/>
							</Row>
							<Row>
								<Col>
									<Button onClick={onBoardLedSave} type="button" size="sm" variant="secondary">
										{t('Common:button-save-label')}
									</Button>
									{boardLedSaveMessage ? <span className="alert alert-info ms-2">{boardLedSaveMessage}</span> : null}
								</Col>
							</Row>
						</Section>
					) : null}
					<Section title={t('LedConfig:pin-led.header-text')}>
						<p className="card-text">
							{t('LedConfig:pin-led.sub-header-text')}
						</p>
						<Table striped bordered hover size="sm">
							<thead>
								<tr>
									<th>{t('LedConfig:pin-led.pin-header')}</th>
									<th>{t('LedConfig:pin-led.action-header')}</th>
									<th>{t('LedConfig:pin-led.led-index-header')}</th>
								</tr>
							</thead>
							<tbody>
								{Array.from({ length: 30 }, (_, pin) => {
									const pinStr = String(pin);
									const pinValue = values.pinLedIndices?.[pinStr] ?? -1;
									const hasAction = pinActions[pin] !== '';
									return (
										<tr key={pin} className={pinValue >= 0 ? 'table-active' : ''}>
											<td className="align-middle">{PIN_LABELS[pin]}</td>
											<td className="align-middle">
												{hasAction ? (
													<span className="badge bg-secondary">{pinActions[pin]}</span>
												) : (
													<span className="text-muted small">—</span>
												)}
											</td>
											<td>
												<Form.Control
													type="number"
													size="sm"
													name={`pinLedIndices.${pinStr}`}
													value={pinValue}
													onChange={(e) => {
														const newVal = parseInt(e.target.value, 10);
														setFieldValue(`pinLedIndices.${pinStr}`, isNaN(newVal) ? -1 : newVal);
													}}
													min={-1}
													max={255}
													className={`pin-led-input ${pinValue >= 0 ? 'has-led' : ''}`}
													style={{ width: '80px' }}
												/>
											</td>
										</tr>
									);
								})}
							</tbody>
						</Table>
					</Section>
					<Section title={t('LedConfig:player.header-text')}>
						<Form.Group as={Col}>
							<Row>
								<FormSelect
									label={t('LedConfig:player.pled-type-label')}
									name="pledType"
									className="form-select-sm"
									groupClassName="col-sm-2"
									value={values.pledType}
									error={errors.pledType}
									isInvalid={errors.pledType}
									onChange={(e) =>
										setFieldValue('pledType', parseInt(e.target.value))
									}
								>
									<option value="-1" defaultValue={true}>
										{t('LedConfig:player.pled-type-off')}
									</option>
									<option value="0">
										{t('LedConfig:player.pled-type-pwm')}
									</option>
									<option value="1">
										{t('LedConfig:player.pled-type-rgb')}
									</option>
								</FormSelect>
								<FormControl
									type="number"
									name="pledPin1"
									hidden={parseInt(values.pledType) !== 0}
									label={PLED_LABELS[0][values.pledType]}
									className="form-control-sm"
									groupClassName="col-sm-2"
									value={values.pledPin1}
									error={errors.pledPin1}
									isInvalid={errors.pledPin1}
									onChange={(e) =>
										setFieldValue('pledPin1', parseInt(e.target.value))
									}
									min={0}
								/>
								<FormControl
									type="number"
									name="pledPin2"
									hidden={parseInt(values.pledType) !== 0}
									label={PLED_LABELS[1][values.pledType]}
									className="form-control-sm"
									groupClassName="col-sm-2"
									value={values.pledPin2}
									error={errors.pledPin2}
									isInvalid={errors.pledPin2}
									onChange={(e) =>
										setFieldValue('pledPin2', parseInt(e.target.value))
									}
									min={0}
								/>
								<FormControl
									type="number"
									name="pledPin3"
									hidden={parseInt(values.pledType) !== 0}
									label={PLED_LABELS[2][values.pledType]}
									className="form-control-sm"
									groupClassName="col-sm-2"
									value={values.pledPin3}
									error={errors.pledPin3}
									isInvalid={errors.pledPin3}
									onChange={(e) =>
										setFieldValue('pledPin3', parseInt(e.target.value))
									}
									min={0}
								/>
								<FormControl
									type="number"
									name="pledPin4"
									hidden={parseInt(values.pledType) !== 0}
									label={PLED_LABELS[3][values.pledType]}
									className="form-control-sm"
									groupClassName="col-sm-2"
									value={values.pledPin4}
									error={errors.pledPin4}
									isInvalid={errors.pledPin4}
									onChange={(e) =>
										setFieldValue('pledPin4', parseInt(e.target.value))
									}
									min={0}
								/>
								<FormControl
									type="number"
									name="pledIndex1"
									hidden={parseInt(values.pledType) !== 1}
									label={PLED_LABELS[0][values.pledType]}
									className="form-control-sm"
									groupClassName="col-sm-2"
									value={values.pledIndex1}
									error={errors.pledIndex1}
									isInvalid={errors.pledIndex1}
									onChange={(e) =>
										setFieldValue('pledIndex1', parseInt(e.target.value))
									}
									min={0}
								/>
								<FormControl
									type="number"
									name="pledIndex2"
									hidden={parseInt(values.pledType) !== 1}
									label={PLED_LABELS[1][values.pledType]}
									className="form-control-sm"
									groupClassName="col-sm-2"
									value={values.pledIndex2}
									error={errors.pledIndex2}
									isInvalid={errors.pledIndex2}
									onChange={(e) =>
										setFieldValue('pledIndex2', parseInt(e.target.value))
									}
									min={0}
								/>
								<FormControl
									type="number"
									name="pledIndex3"
									hidden={parseInt(values.pledType) !== 1}
									label={PLED_LABELS[2][values.pledType]}
									className="form-control-sm"
									groupClassName="col-sm-2"
									value={values.pledIndex3}
									error={errors.pledIndex3}
									isInvalid={errors.pledIndex3}
									onChange={(e) =>
										setFieldValue('pledIndex3', parseInt(e.target.value))
									}
									min={0}
								/>
								<FormControl
									type="number"
									name="pledIndex4"
									hidden={parseInt(values.pledType) !== 1}
									label={PLED_LABELS[3][values.pledType]}
									className="form-control-sm"
									groupClassName="col-sm-2"
									value={values.pledIndex4}
									error={errors.pledIndex4}
									isInvalid={errors.pledIndex4}
									onChange={(e) =>
										setFieldValue('pledIndex4', parseInt(e.target.value))
									}
									min={0}
								/>
								<FormControl
									label={t('LedConfig:player.pled-color-label')}
									hidden={parseInt(values.pledType) !== 1}
									name="pledColor"
									className="form-control-sm"
									groupClassName="col-sm-2"
									value={values.pledColor}
									error={errors.pledColor}
									isInvalid={errors.pledColor}
									onBlur={handleBlur}
									onClick={toggleRgbPledPicker}
									onChange={(e) => {
										handleChange(e);
										setShowPicker(false);
									}}
								/>
								<ColorPicker
									name="pledColor"
									types={[{ value: values.pledColor }]}
									onChange={(c) => setFieldValue('pledColor', c)}
									onDismiss={() => setShowPicker(false)}
									placement="top"
									presetColors={LEDColors.map((c) => ({
										title: c.name,
										color: c.value,
									}))}
									show={showPicker}
									target={colorPickerTarget}
								></ColorPicker>
								<div className="col-sm-3">
									<Form.Check
										label={t('LedConfig:turn-off-when-suspended')}
										type="switch"
										name="turnOffWhenSuspended"
										isInvalid={false}
										checked={Boolean(values.turnOffWhenSuspended)}
										onChange={(e) => {
											setFieldValue(
												'turnOffWhenSuspended',
												e.target.checked ? 1 : 0,
											);
										}}
									/>
								</div>
							</Row>
							<p hidden={parseInt(values.pledType) !== 0}>
								{t('LedConfig:player.pwm-sub-header-text')}
							</p>
							<p hidden={parseInt(values.pledType) !== 1}>
								<Trans
									ns="LedConfig"
									i18nKey="player.rgb-sub-header-text"
								>
									Set the NeoPixel LED index for each player LED.
								</Trans>
							</p>
						</Form.Group>
					</Section>
                    <Section title={t('LedConfig:case.header-text')}>
						<Form.Group as={Col}>
							<Row>
								<FormSelect
									label={t('LedConfig:case.case-type-label')}
									name="caseRGBType"
									className="form-select-sm"
									groupClassName="col-sm-2"
									value={values.caseRGBType}
									error={errors.caseRGBType}
									isInvalid={errors.caseRGBType}
									onChange={(e) =>
										setFieldValue('caseRGBType', parseInt(e.target.value))
									}
								>
									<option value="-1" defaultValue={true}>
										{t('LedConfig:case.case-type-off')}
									</option>
									<option value="0">
										{t('LedConfig:case.case-type-static')}
									</option>
								</FormSelect>
                                <FormControl
									type="number"
									name="caseRGBIndex"
                                    hidden={parseInt(values.caseRGBType) === -1}
									label={t('LedConfig:case.case-index-label')}
									className="form-control-sm"
									groupClassName="col-sm-2"
									value={values.caseRGBIndex}
									error={errors.caseRGBIndex}
									isInvalid={errors.caseRGBIndex}
									onChange={(e) =>
										setFieldValue('caseRGBIndex', parseInt(e.target.value))
									}
									min={0}
								/>
                                <FormControl
									type="number"
									name="caseRGBCount"
                                    hidden={parseInt(values.caseRGBType) === -1}
									label={t('LedConfig:case.case-count-label')}
									className="form-control-sm"
									groupClassName="col-sm-2"
									value={values.caseRGBCount}
									error={errors.caseRGBCount}
									isInvalid={errors.caseRGBCount}
									onChange={(e) =>
										setFieldValue('caseRGBCount', parseInt(e.target.value))
									}
									min={0}
								/>
                                <FormControl
									label={t('LedConfig:case.case-color-label')}
									hidden={parseInt(values.caseRGBType) !== 0}
									name="caseRGBColor"
									className="form-control-sm"
									groupClassName="col-sm-2"
									value={values.caseRGBColor}
									error={errors.caseRGBColor}
									isInvalid={errors.caseRGBColor}
									onBlur={handleBlur}
									onClick={toggleRgbPledPicker}
									onChange={(e) => {
										handleChange(e);
										setShowPicker(false);
									}}
								/>
								<ColorPicker
									name="caseRGBColor"
									types={[{ value: values.caseRGBColor }]}
									onChange={(c) => setFieldValue('caseRGBColor', c)}
									onDismiss={() => setShowPicker(false)}
									placement="top"
									presetColors={LEDColors.map((c) => ({
										title: c.name,
										color: c.value,
									}))}
									show={showPicker}
									target={colorPickerTarget}
								></ColorPicker>
							</Row>
							<p >
								{t('LedConfig:case.sub-header-text')}
							</p>
						</Form.Group>
					</Section>
					<Button type="submit">{t('Common:button-save-label')}</Button>
					{saveMessage ? <span className="alert">{saveMessage}</span> : null}
					<FormContext />
				</Form>
			)}
		</Formik>
	);
}
