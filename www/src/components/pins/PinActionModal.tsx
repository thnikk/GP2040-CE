import React, { useCallback, useMemo, useState, useEffect } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { useTranslation } from 'react-i18next';
import invert from 'lodash/invert';
import omit from 'lodash/omit';
import { useContext } from 'react';
import CustomSelect from '../form/CustomSelect';
import { AppContext } from '../../Contexts/AppContext';
import { BUTTON_ACTIONS, PinActionValues } from '../../Data/Pins';
import { BUTTON_MASKS, DPAD_MASKS, getButtonLabels } from '../../Data/Buttons';
import { MultiValue, SingleValue } from 'react-select';
import { KEY_CODES } from '../../Data/Keyboard';
import KeyboardWidget from '../widgets/KeyboardWidget';
import ControllerWidget from '../widgets/ControllerWidget';
import PlusCircle from '../../Icons/PlusCircle';



const MODIFIER_MIN = 0xe0;
const isModifierKey = (value: number) => value >= MODIFIER_MIN && value <= 0xe7;
const WIDGET_BREAKPOINT = 799;
const WIDGET_HEIGHT_BREAKPOINT = 700;
const bitCount = (n: number) => {
	let c = 0;
	while (n) { c += n & 1; n >>>= 1; }
	return c;
};

const swapFaceButtonBits = (mask: number, swap: boolean) => {
	if (!swap) return mask;
	let result = mask;
	const b1 = (mask & 1) !== 0;
	const b2 = (mask & 2) !== 0;
	const b3 = (mask & 4) !== 0;
	const b4 = (mask & 8) !== 0;
	if (b1) result |= 2; else result &= ~2;
	if (b2) result |= 1; else result &= ~1;
	if (b3) result |= 8; else result &= ~8;
	if (b4) result |= 4; else result &= ~4;
	return result;
};

type OptionType = {
	label: string;
	value: PinActionValues;
	type: string;
	customButtonMask: number;
	customDpadMask: number;
};

const BUTTON_ORDER = ['Up', 'Down', 'Left', 'Right', 'B1', 'B2', 'B3', 'B4', 'R1', 'R2', 'L1', 'L2', 'S1', 'S2', 'L3', 'R3', 'A1', 'A2'];

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
	hasCustomTheme?: boolean;
	onSaveColor?: () => void;
	pinLedIndices?: Record<string, number>;
	ledButtonOrder?: (string | undefined)[];
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
	hasCustomTheme,
	onSaveColor,
	pinLedIndices,
	ledButtonOrder,
	inputMode,
}: PinActionModalProps) {
	const { t } = useTranslation('');
	const { buttonLabels, useNintendoLayout } = useContext(AppContext);
	const { buttonLabelType, swapTpShareLabels } = buttonLabels;
	const CURRENT_BUTTONS = getButtonLabels(buttonLabelType, swapTpShareLabels);
	const buttonNames = omit(CURRENT_BUTTONS, ['label', 'value']);
	const effectiveButtonNames = (buttonLabelType === 'switch' && !useNintendoLayout)
		? { ...buttonNames, B1: buttonNames.B2, B2: buttonNames.B1, B3: buttonNames.B4, B4: buttonNames.B3 }
		: buttonNames;
	const shouldSwap = buttonLabelType === 'switch' && !useNintendoLayout;
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

	useEffect(() => {
		if (show) {
			setPendingAction(currentAction);
			setPendingCustomButtonMask(currentCustomButtonMask);
			setPendingCustomDpadMask(currentCustomDpadMask);
			setPendingKeyboardKeycode(currentKeyboardKeycode);
			setPendingKeyboardModifierMask(currentKeyboardModifierMask);
			setActiveTab(inputMode === 3 ? 'keyboard' : 'controller');
		}
	}, [show, currentAction, currentCustomButtonMask, currentCustomDpadMask, currentKeyboardKeycode, currentKeyboardModifierMask, inputMode]);

	const disabled = disabledOptions.includes(pendingAction);

	const buttonName = useMemo(() => {
		if (disabled || pinNumber === null || !pinLedIndices) return null;
		const ledIndex = pinLedIndices[String(pinNumber)];
		if (ledIndex == null || ledIndex < 0) return null;
		return ledButtonOrder?.[ledIndex] || BUTTON_ORDER[ledIndex % BUTTON_ORDER.length] || null;
	}, [disabled, pinNumber, pinLedIndices, ledButtonOrder]);

	const isButtonPress = !!buttonName;

	const getOptionLabel = useCallback(
		(option: OptionType) => {
			const labelKey = option.label?.split('BUTTON_PRESS_')?.pop();
			return (
				(labelKey && effectiveButtonNames[labelKey]) ||
				t(`PinMapping:actions.${option.label}`)
			);
		},
		[effectiveButtonNames],
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

	const [useWidget, setUseWidget] = useState(
		window.innerWidth >= WIDGET_BREAKPOINT && window.innerHeight >= WIDGET_HEIGHT_BREAKPOINT,
	);

	useEffect(() => {
		const onResize = () =>
			setUseWidget(
				window.innerWidth >= WIDGET_BREAKPOINT && window.innerHeight >= WIDGET_HEIGHT_BREAKPOINT,
			);
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	const keyboardDropdownOptions = useMemo(() => {
		if (pendingKeyboardKeycode === 0 || isModifierKey(pendingKeyboardKeycode))
			return KEY_CODES;
		return KEY_CODES.filter(
			(k) => k.value === pendingKeyboardKeycode || isModifierKey(k.value),
		);
	}, [pendingKeyboardKeycode]);

	const keyboardDropdownValue = useMemo(() => {
		const selected: { label: string; value: number }[] = [];
		if (pendingKeyboardKeycode > 0) {
			const label = KEY_CODES.find((k) => k.value === pendingKeyboardKeycode)?.label ?? 'None';
			selected.push({ label, value: pendingKeyboardKeycode });
		}
		for (let i = 0; i < 8; i++) {
			const modValue = MODIFIER_MIN + i;
			if (pendingKeyboardModifierMask & (1 << i)) {
				const mod = KEY_CODES.find((k) => k.value === modValue);
				if (mod) selected.push({ label: mod.label, value: modValue });
			}
		}
		return selected;
	}, [pendingKeyboardKeycode, pendingKeyboardModifierMask]);

	const handleKeyboardDropdownChange = useCallback(
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
				else if (keycode === 0)
					keycode = item.value;
			}
			setPendingKeyboardKeycode(keycode);
			setPendingKeyboardModifierMask(modMask);
		},
		[],
	);

	const handleKeyboardChange = useCallback(
		(kc: number, modMask: number) => {
			setPendingKeyboardKeycode(kc);
			setPendingKeyboardModifierMask(modMask);
		},
		[],
	);

	const currentBtnMask = useMemo(() => {
		if (pendingAction === BUTTON_ACTIONS.CUSTOM_BUTTON_COMBO) return pendingCustomButtonMask;
		if (pendingAction === BUTTON_ACTIONS.NONE) return 0;
		const opt = options.find((o) => o.value === pendingAction);
		if (opt && opt.type === 'customButtonMask') return opt.customButtonMask;
		return 0;
	}, [pendingAction, pendingCustomButtonMask, options]);

	const currentDpadMask = useMemo(() => {
		if (pendingAction === BUTTON_ACTIONS.CUSTOM_BUTTON_COMBO) return pendingCustomDpadMask;
		if (pendingAction === BUTTON_ACTIONS.NONE) return 0;
		const opt = options.find((o) => o.value === pendingAction);
		if (opt && opt.type === 'customDpadMask') return opt.customDpadMask;
		return 0;
	}, [pendingAction, pendingCustomDpadMask, options]);

	const handleControllerMaskChange = useCallback(
		(btnMask: number, dpMask: number) => {
			const total = bitCount(btnMask) + bitCount(dpMask);
			if (total === 0) {
				setPendingAction(BUTTON_ACTIONS.NONE);
				setPendingCustomButtonMask(0);
				setPendingCustomDpadMask(0);
				return;
			}
			if (total === 1) {
				const opt = options.find(
					(o) =>
						(o.type === 'customButtonMask' && o.customButtonMask === btnMask && btnMask !== 0) ||
						(o.type === 'customDpadMask' && o.customDpadMask === dpMask && dpMask !== 0),
				);
				if (opt) {
					setPendingAction(opt.value as PinActionValues);
					setPendingCustomButtonMask(0);
					setPendingCustomDpadMask(0);
					return;
				}
			}
			setPendingAction(BUTTON_ACTIONS.CUSTOM_BUTTON_COMBO);
			setPendingCustomButtonMask(btnMask);
			setPendingCustomDpadMask(dpMask);
		},
		[options],
	);

	const handleSave = useCallback(() => {
		onAssign(pinNumber!, pendingAction, pendingCustomButtonMask, pendingCustomDpadMask, pendingKeyboardKeycode, pendingKeyboardModifierMask);
		onSaveColor?.();
		onClose();
	}, [pinNumber, pendingAction, pendingCustomButtonMask, pendingCustomDpadMask, pendingKeyboardKeycode, pendingKeyboardModifierMask, onAssign, onSaveColor, onClose]);

	const isAssignable = pendingAction !== BUTTON_ACTIONS.NONE || currentAction !== BUTTON_ACTIONS.NONE;



	const [activeTab, setActiveTab] = useState<'controller' | 'keyboard'>(inputMode === 3 ? 'keyboard' : 'controller');

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
		<Modal show={show} onHide={onClose} centered size="lg" className="pin-action-modal">
			<div className="d-flex flex-column" style={{ padding: 20, gap: 20 }}>
				<div className="d-flex align-items-center gap-2 card-heading">
					<PlusCircle />
					{t('PinMapping:button-config-header')}
					<button type="button" className="btn-close" onClick={onClose}>
						&times;
					</button>
				</div>
				<div className="pin-action-tabs">
					<button
						type="button"
						className={`pin-action-tab${activeTab === 'controller' ? ' active' : ''}`}
						onClick={() => setActiveTab('controller')}
					>
						{controllerSvg}
						{t('PinMapping:controller-tab')}
					</button>
					<button
						type="button"
						className={`pin-action-tab${activeTab === 'keyboard' ? ' active' : ''}`}
						onClick={() => setActiveTab('keyboard')}
					>
						{keyboardSvg}
						{t('PinMapping:keyboard-tab')}
					</button>
				</div>
				<div className="pin-action-sections">
					<div className={`pin-action-section${activeTab === 'controller' ? '' : ' inactive'}`}>
						{!disabled && (
							<CustomSelect
								isClearable
								isMulti
								options={groupedOptions}
								isDisabled={disabled}
								getOptionLabel={getOptionLabel}
								onChange={handleChange}
								value={getMultiValue()}
							/>
						)}
						{useWidget && !disabled && (
							<ControllerWidget
								buttonMask={swapFaceButtonBits(currentBtnMask, shouldSwap)}
								dpadMask={currentDpadMask}
								onMaskChange={(btnMask, dpMask) => handleControllerMaskChange(swapFaceButtonBits(btnMask, shouldSwap), dpMask)}
								buttonNames={buttonNames}
							/>
						)}
						{hasCustomTheme && !disabled && !isButtonPress && pendingAction !== BUTTON_ACTIONS.CUSTOM_BUTTON_COMBO && (
							<div className="mt-3 text-muted small">
								{t('CustomTheme:no-led-for-action')}
							</div>
						)}
					</div>
					<div className={`pin-action-section${activeTab === 'keyboard' ? '' : ' inactive'}`}>
						{!disabled && (
							<CustomSelect
								isMulti
								options={keyboardDropdownOptions}
								onChange={handleKeyboardDropdownChange}
								value={keyboardDropdownValue}
								getOptionLabel={(o: { label: string }) => o.label}
								autoFocus
							/>
						)}
						{useWidget && !disabled && (
							<KeyboardWidget
								keycode={pendingKeyboardKeycode}
								modifierMask={pendingKeyboardModifierMask}
								onChange={handleKeyboardChange}
							/>
						)}
					</div>
				</div>

				{isAssignable && (
					<div className="d-flex justify-content-end">
						<Button variant="primary" onClick={handleSave}>
							{t('Common:button-save-label')}
						</Button>
					</div>
				)}
			</div>
		</Modal>
	);
} 