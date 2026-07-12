import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Button, Col, Form, Modal, Overlay, Popover, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import invert from 'lodash/invert';
import omit from 'lodash/omit';
import { useContext } from 'react';
import { SketchPicker } from '@hello-pangea/color-picker';
import CustomSelect from './CustomSelect';
import { AppContext } from '../Contexts/AppContext';
import { BUTTON_ACTIONS, PinActionValues } from '../Data/Pins';
import { BUTTON_MASKS, DPAD_MASKS, getButtonLabels } from '../Data/Buttons';
import { KEY_CODES } from '../Data/Keyboard';
import LEDColors from '../Data/LEDColors';
import { MultiValue, SingleValue } from 'react-select';

const MODIFIER_MIN = 0xe0;
const MODIFIER_MAX = 0xe7;

const isModifierKey = (value: number) => value >= MODIFIER_MIN && value <= MODIFIER_MAX;

type OptionType = {
	label: string;
	value: PinActionValues;
	type: string;
	customButtonMask: number;
	customDpadMask: number;
};

type PinActionModalProps = {
	show: boolean;
	pinNumber: number | null;
	currentAction: PinActionValues;
	currentCustomButtonMask: number;
	currentCustomDpadMask: number;
	currentKeyboardKeycode: number;
	currentKeyboardModifierMask: number;
	onClose: () => void;
	onAssign: (
		pinNumber: number,
		action: PinActionValues,
		customButtonMask: number,
		customDpadMask: number,
		keyboardKeycode: number,
		keyboardModifierMask: number,
	) => void;
	customTheme?: Record<string, { normal: string; pressed: string }>;
	hasCustomTheme?: boolean;
	onLedColorChange?: (buttonName: string, colors: { normal: string; pressed: string }) => void;
	onSaveColor?: () => void;
	ledButtonMap?: Record<string, number | null>;
	inputMode?: number;
};

const disabledOptions = [
	BUTTON_ACTIONS.RESERVED,
	BUTTON_ACTIONS.ASSIGNED_TO_ADDON,
];

const isNonSelectable = (action: PinActionValues) =>
	[BUTTON_ACTIONS.NONE, BUTTON_ACTIONS.CUSTOM_BUTTON_COMBO, ...disabledOptions].includes(action);

const getMask = (maskArr: { label: string; value: number }[], key: string) =>
	maskArr.find(
		({ label }) => label?.toUpperCase() === key.split('BUTTON_PRESS_')?.pop(),
	);

const buildOptions = () =>
	Object.entries(BUTTON_ACTIONS)
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

const getButtonNameFromAction = (action: PinActionValues): string | null => {
	const actionKey = invert(BUTTON_ACTIONS)[action];
	const btnKey = actionKey?.split('BUTTON_PRESS_')?.pop();
	if (!btnKey) return null;
	return btnKey.charAt(0).toUpperCase() + btnKey.slice(1).toLowerCase();
};

export default function PinActionModal({
	show,
	pinNumber,
	currentAction,
	currentCustomButtonMask,
	currentCustomDpadMask,
	currentKeyboardKeycode,
	currentKeyboardModifierMask,
	onClose,
	onAssign,
	customTheme,
	hasCustomTheme,
	onLedColorChange,
	onSaveColor,
	ledButtonMap,
	inputMode,
}: PinActionModalProps) {
	const { t } = useTranslation('');
	const { buttonLabels, savedColors, setSavedColors } = useContext(AppContext);
	const { buttonLabelType, swapTpShareLabels } = buttonLabels;
	const CURRENT_BUTTONS = getButtonLabels(buttonLabelType, swapTpShareLabels);
	const buttonNames = omit(CURRENT_BUTTONS, ['label', 'value']);
	const isKeyboardMode = inputMode === 3;

	const options = useMemo(buildOptions, []);
	const groupedOptions = useMemo(
		() => [
			{
				label: 'Buttons',
				options: options.filter(({ type }) => type !== 'action'),
			},
			{
				label: 'Actions',
				options: options.filter(({ type }) => type === 'action'),
			},
		],
		[options],
	);

	const [pendingAction, setPendingAction] = useState<PinActionValues>(currentAction);
	const [pendingCustomButtonMask, setPendingCustomButtonMask] = useState(currentCustomButtonMask);
	const [pendingCustomDpadMask, setPendingCustomDpadMask] = useState(currentCustomDpadMask);
	const [pendingKeyboardKeycode, setPendingKeyboardKeycode] = useState(currentKeyboardKeycode);
	const [pendingKeyboardModifierMask, setPendingKeyboardModifierMask] = useState(currentKeyboardModifierMask);
	const [pickerVisible, setPickerVisible] = useState(false);
	const [pickerColorType, setPickerColorType] = useState<'normal' | 'pressed'>('normal');
	const [ledOverlayTarget, setLedOverlayTarget] = useState<HTMLElement | null>(null);

	useEffect(() => {
		if (show) {
			setPendingAction(currentAction);
			setPendingCustomButtonMask(currentCustomButtonMask);
			setPendingCustomDpadMask(currentCustomDpadMask);
			setPendingKeyboardKeycode(currentKeyboardKeycode);
			setPendingKeyboardModifierMask(currentKeyboardModifierMask);
			setPickerVisible(false);
		}
	}, [show, currentAction, currentCustomButtonMask, currentCustomDpadMask, currentKeyboardKeycode, currentKeyboardModifierMask]);

	const disabled = disabledOptions.includes(pendingAction);

	const buttonName = useMemo(() => {
		if (disabled) return null;
		return getButtonNameFromAction(pendingAction);
	}, [pendingAction, disabled]);

	const isButtonPress = !!buttonName;

	const currentLedColors = useMemo(() => {
		if (!isButtonPress || !customTheme || !buttonName) return null;
		return customTheme[buttonName] || { normal: '#000000', pressed: '#000000' };
	}, [isButtonPress, customTheme, buttonName]);

	const selectedColor = useMemo(() => {
		if (!currentLedColors) return '#000000';
		return pickerColorType === 'normal' ? currentLedColors.normal : currentLedColors.pressed;
	}, [currentLedColors, pickerColorType]);

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

	const getMultiValue = useCallback((): MultiValue<OptionType> | SingleValue<OptionType> => {
		if (pendingAction === BUTTON_ACTIONS.NONE) return null;
		if (disabledOptions.includes(pendingAction)) {
			const actionKey = invert(BUTTON_ACTIONS)[pendingAction];
			return [{ label: actionKey, value: pendingAction, type: 'action', customButtonMask: 0, customDpadMask: 0 }];
		}
		if (pendingAction === BUTTON_ACTIONS.CUSTOM_BUTTON_COMBO) {
			return options.filter(
				({ type, customButtonMask, customDpadMask }) =>
					(pendingCustomButtonMask & customButtonMask && type === 'customButtonMask') ||
					(pendingCustomDpadMask & customDpadMask && type === 'customDpadMask'),
			) as MultiValue<OptionType>;
		}
		return options.filter((option) => option.value === pendingAction) as MultiValue<OptionType>;
	}, [pendingAction, pendingCustomButtonMask, pendingCustomDpadMask, options]);

	const handleChange = useCallback(
		(selected: MultiValue<OptionType> | SingleValue<OptionType>) => {
			if (!selected || (Array.isArray(selected) && !selected.length)) {
				setPendingAction(BUTTON_ACTIONS.NONE);
				setPendingCustomButtonMask(0);
				setPendingCustomDpadMask(0);
				return;
			}
			if (Array.isArray(selected) && selected.length > 1) {
				const lastSelected = selected[selected.length - 1];
				if (lastSelected.type === 'action') {
					setPendingAction(lastSelected.value);
					setPendingCustomButtonMask(0);
					setPendingCustomDpadMask(0);
				} else {
					const masks = selected.reduce(
						(acc, opt) => ({
							customButtonMask:
								opt.type === 'customButtonMask'
									? acc.customButtonMask ^ opt.customButtonMask
									: acc.customButtonMask,
							customDpadMask:
								opt.type === 'customDpadMask'
									? acc.customDpadMask ^ opt.customDpadMask
									: acc.customDpadMask,
						}),
						{ customButtonMask: 0, customDpadMask: 0 },
					);
					setPendingAction(BUTTON_ACTIONS.CUSTOM_BUTTON_COMBO);
					setPendingCustomButtonMask(masks.customButtonMask);
					setPendingCustomDpadMask(masks.customDpadMask);
				}
			} else {
				const single = Array.isArray(selected) ? selected[0] : selected;
				setPendingAction(single.value);
				setPendingCustomButtonMask(0);
				setPendingCustomDpadMask(0);
			}
		},
		[],
	);

	const keyboardOptions = useMemo(() => {
		if (pendingKeyboardKeycode === 0 || isModifierKey(pendingKeyboardKeycode))
			return KEY_CODES;
		return KEY_CODES.filter(
			(k) => k.value === pendingKeyboardKeycode || isModifierKey(k.value),
		);
	}, [pendingKeyboardKeycode]);

	const keyboardValue = useMemo(() => {
		const selected = [];
		if (pendingKeyboardKeycode > 0)
			selected.push({
				label: KEY_CODES.find((k) => k.value === pendingKeyboardKeycode)?.label ?? 'None',
				value: pendingKeyboardKeycode,
			});
		for (let i = 0; i < 8; i++) {
			const modValue = MODIFIER_MIN + i;
			if (pendingKeyboardModifierMask & (1 << i)) {
				const mod = KEY_CODES.find((k) => k.value === modValue);
				if (mod) selected.push({ label: mod.label, value: modValue });
			}
		}
		return selected;
	}, [pendingKeyboardKeycode, pendingKeyboardModifierMask]);

	const handleKeyboardChange = useCallback(
		(selected: MultiValue<{ label: string; value: number }> | SingleValue<{ label: string; value: number }>) => {
			if (!selected || (Array.isArray(selected) && !selected.length)) {
				setPendingKeyboardKeycode(0);
				setPendingKeyboardModifierMask(0);
				return;
			}
			const items = Array.isArray(selected) ? selected : [selected];
			let keycode = 0;
			let modMask = 0;
			for (const item of items) {
				if (isModifierKey(item.value))
					modMask |= 1 << (item.value - MODIFIER_MIN);
				else
					keycode = item.value;
			}
			setPendingKeyboardKeycode(keycode);
			setPendingKeyboardModifierMask(modMask);
		},
		[],
	);

	const handleSave = useCallback(() => {
		onAssign(pinNumber!, pendingAction, pendingCustomButtonMask, pendingCustomDpadMask, pendingKeyboardKeycode, pendingKeyboardModifierMask);
		onSaveColor?.();
		onClose();
	}, [pinNumber, pendingAction, pendingCustomButtonMask, pendingCustomDpadMask, pendingKeyboardKeycode, pendingKeyboardModifierMask, onAssign, onSaveColor, onClose]);

	const isAssignable = pendingAction !== BUTTON_ACTIONS.NONE || currentAction !== BUTTON_ACTIONS.NONE;

	const handleColorSwatchClick = useCallback((e: React.MouseEvent<HTMLElement>, colorType: 'normal' | 'pressed') => {
		e.stopPropagation();
		setLedOverlayTarget(e.currentTarget);
		setPickerColorType(colorType);
		setPickerVisible((prev) => !prev);
	}, []);

	const handleColorChange = useCallback((c: { hex: string }) => {
		if (!onLedColorChange || !buttonName || !customTheme) return;
		const current = customTheme[buttonName] || { normal: '#000000', pressed: '#000000' };
		const newColors = { ...current, [pickerColorType]: c.hex };
		onLedColorChange(buttonName, newColors);
	}, [onLedColorChange, buttonName, customTheme, pickerColorType]);

	const handleColorPickerClose = useCallback(() => {
		setPickerVisible(false);
	}, []);

	const saveCurrentColor = useCallback(() => {
		if (!selectedColor || selectedColor === '#000000') return;
		if (savedColors.includes(selectedColor)) return;
		const newColors = [...savedColors, selectedColor];
		setSavedColors(newColors);
	}, [selectedColor, savedColors, setSavedColors]);

	const deleteCurrentColor = useCallback(() => {
		const colorIndex = savedColors.indexOf(selectedColor);
		if (colorIndex < 0) return;
		const newColors = [...savedColors];
		newColors.splice(colorIndex, 1);
		setSavedColors(newColors);
	}, [selectedColor, savedColors, setSavedColors]);

	const showLedSection = isButtonPress && !disabled && !!onLedColorChange && (!ledButtonMap || ledButtonMap[buttonName!] != null);

	const [activeTab, setActiveTab] = useState<'controller' | 'keyboard'>('controller');

	const controllerSvg = (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="18" height="18" fill="currentColor">
			<path d="M448 64c106 0 192 86 192 192S554 448 448 448l-256 0C86 448 0 362 0 256S86 64 192 64l256 0zM192 176c-13.3 0-24 10.7-24 24l0 32-32 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l32 0 0 32c0 13.3 10.7 24 24 24s24-10.7 24-24l0-32 32 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-32 0 0-32c0-13.3-10.7-24-24-24zm240 96a32 32 0 1 0 0 64 32 32 0 1 0 0-64zm64-96a32 32 0 1 0 0 64 32 32 0 1 0 0-64z"/>
		</svg>
	);

	const keyboardSvg = (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="18" height="18" fill="currentColor">
			<path d="M64 64C28.7 64 0 92.7 0 128L0 384c0 35.3 28.7 64 64 64l448 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64L64 64zm16 64l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16zM64 240c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zM176 128l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16zM160 240c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zm16 80l224 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-224 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16zm80-176c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zm16 80l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16zm80-80c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zm16 80l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16zm80-80c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zm16 80l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16z"/>
		</svg>
	);

	return (
		<Modal show={show} onHide={onClose} centered size="lg">
			<Modal.Header closeButton>
				<Modal.Title>
					{t('PinMapping:pin-header-label')} {pinNumber}
				</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<div className="d-flex gap-1 mb-3 border-bottom pb-2">
					<Button
						variant={activeTab === 'controller' ? 'primary' : 'outline-secondary'}
						size="sm"
						onClick={() => setActiveTab('controller')}
						className="d-flex align-items-center gap-1"
					>
						{controllerSvg}
						{t('PinMapping:controller-tab')}
					</Button>
					<Button
						variant={activeTab === 'keyboard' ? 'primary' : 'outline-secondary'}
						size="sm"
						onClick={() => setActiveTab('keyboard')}
						className="d-flex align-items-center gap-1"
					>
						{keyboardSvg}
						{t('PinMapping:keyboard-tab')}
					</Button>
				</div>
				{activeTab === 'controller' && (
					<>
						<CustomSelect
							isClearable
							isMulti={!disabled}
							options={groupedOptions}
							isDisabled={disabled}
							getOptionLabel={getOptionLabel}
							onChange={handleChange}
							value={getMultiValue()}
							autoFocus
						/>
						{hasCustomTheme && !disabled && !isButtonPress && pendingAction !== BUTTON_ACTIONS.CUSTOM_BUTTON_COMBO && (
							<div className="mt-3 text-muted small">
								{t('CustomTheme:no-led-for-action')}
							</div>
						)}
					</>
				)}
				{activeTab === 'keyboard' && (
					<div>
						<Form.Label className="fw-bold">
							{t('PinMapping:keyboard-key-label')}
							{!isKeyboardMode && (
								<small className="text-muted ms-2">
									({t('PinMapping:keyboard-mode-only')})
								</small>
							)}
						</Form.Label>
						<CustomSelect
							isMulti
							options={keyboardOptions}
							onChange={handleKeyboardChange}
							value={keyboardValue}
							getOptionLabel={(o: { label: string }) => o.label}
							autoFocus
						/>
					</div>
				)}
				{showLedSection && (
					<div className="mt-4 border-top pt-3">
						<Form.Label className="fw-bold">
							{t('CustomTheme:custom-theme-colors')}
						</Form.Label>
						<div className="d-flex gap-3">
							<div
								className="led-color-swatch"
								style={{ backgroundColor: currentLedColors?.normal || '#000000' }}
								onClick={(e) => handleColorSwatchClick(e, 'normal')}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => { if (e.key === 'Enter') handleColorSwatchClick(e as any, 'normal'); }}
							>
								<small className="swatch-label">{t('CustomTheme:normal-label')}</small>
							</div>
							<div
								className="led-color-swatch"
								style={{ backgroundColor: currentLedColors?.pressed || '#000000' }}
								onClick={(e) => handleColorSwatchClick(e, 'pressed')}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => { if (e.key === 'Enter') handleColorSwatchClick(e as any, 'pressed'); }}
							>
								<small className="swatch-label">{t('CustomTheme:pressed-label')}</small>
							</div>
						</div>

						<Overlay
							show={pickerVisible}
							target={ledOverlayTarget}
							placement="bottom"
							popperConfig={{
								strategy: 'fixed',
								modifiers: [{ name: 'offset', options: { offset: [0, 10] } }],
							}}
							rootClose
							onHide={handleColorPickerClose}
						>
							<Popover onClick={(e) => e.stopPropagation()} style={{ zIndex: 9999 }}>
								<Popover.Body>
									<SketchPicker
										color={selectedColor}
										onChange={(c) => handleColorChange(c)}
										disableAlpha={true}
										presetColors={[
											...LEDColors.map((c) => ({ title: c.name, color: c.value })),
											...savedColors.map((c) => ({ title: c, color: c })),
										]}
										width={180}
									/>
									<div className="d-flex justify-content-between mt-2">
										<Button size="sm" onClick={saveCurrentColor}>
											{t('Common:button-save-color-label')}
										</Button>
										<Button size="sm" variant="outline-danger" onClick={deleteCurrentColor}>
											{t('Common:button-delete-color-label')}
										</Button>
									</div>
								</Popover.Body>
							</Popover>
						</Overlay>
					</div>
				)}
			</Modal.Body>
			<Modal.Footer>
				<Button variant="secondary" onClick={onClose}>
					{t('Common:button-dismiss-label')}
				</Button>
				{isAssignable && (
					<Button variant="primary" onClick={handleSave}>
						{t('Common:button-save-label')}
					</Button>
				)}
			</Modal.Footer>
		</Modal>
	);
} 