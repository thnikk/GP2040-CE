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
import LEDColors from '../Data/LEDColors';
import { MultiValue, SingleValue } from 'react-select';

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
	onClose: () => void;
	onAssign: (
		pinNumber: number,
		action: PinActionValues,
		customButtonMask: number,
		customDpadMask: number,
	) => void;
	customTheme?: Record<string, { normal: string; pressed: string }>;
	hasCustomTheme?: boolean;
	onLedColorChange?: (buttonName: string, colors: { normal: string; pressed: string }) => void;
	onSaveColor?: () => void;
	ledButtonMap?: Record<string, number | null>;
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
	return btnKey || null;
};

export default function PinActionModal({
	show,
	pinNumber,
	currentAction,
	currentCustomButtonMask,
	currentCustomDpadMask,
	onClose,
	onAssign,
	customTheme,
	hasCustomTheme,
	onLedColorChange,
	onSaveColor,
	ledButtonMap,
}: PinActionModalProps) {
	const { t } = useTranslation('');
	const { buttonLabels, savedColors, setSavedColors } = useContext(AppContext);
	const { buttonLabelType, swapTpShareLabels } = buttonLabels;
	const CURRENT_BUTTONS = getButtonLabels(buttonLabelType, swapTpShareLabels);
	const buttonNames = omit(CURRENT_BUTTONS, ['label', 'value']);

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
	const [pickerVisible, setPickerVisible] = useState(false);
	const [pickerColorType, setPickerColorType] = useState<'normal' | 'pressed'>('normal');
	const [ledOverlayTarget, setLedOverlayTarget] = useState<HTMLElement | null>(null);

	useEffect(() => {
		if (show) {
			setPendingAction(currentAction);
			setPendingCustomButtonMask(currentCustomButtonMask);
			setPendingCustomDpadMask(currentCustomDpadMask);
			setPickerVisible(false);
		}
	}, [show, currentAction, currentCustomButtonMask, currentCustomDpadMask]);

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

	const handleSave = useCallback(() => {
		onAssign(pinNumber!, pendingAction, pendingCustomButtonMask, pendingCustomDpadMask);
		onSaveColor?.();
		onClose();
	}, [pinNumber, pendingAction, pendingCustomButtonMask, pendingCustomDpadMask, onAssign, onSaveColor, onClose]);

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

	return (
		<Modal show={show} onHide={onClose} centered size="lg">
			<Modal.Header closeButton>
				<Modal.Title>
					{t('PinMapping:pin-header-label')} {pinNumber}
				</Modal.Title>
			</Modal.Header>
			<Modal.Body>
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
				{hasCustomTheme && !disabled && !isButtonPress && pendingAction !== BUTTON_ACTIONS.CUSTOM_BUTTON_COMBO && (
					<div className="mt-3 text-muted small">
						{t('CustomTheme:no-led-for-action')}
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