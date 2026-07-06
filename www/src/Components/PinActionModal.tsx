import React, { useCallback, useMemo } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import invert from 'lodash/invert';
import omit from 'lodash/omit';
import { useContext } from 'react';
import CustomSelect from './CustomSelect';
import { AppContext } from '../Contexts/AppContext';
import { BUTTON_ACTIONS, PinActionValues } from '../Data/Pins';
import { BUTTON_MASKS, DPAD_MASKS, getButtonLabels } from '../Data/Buttons';
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
	onClose,
	onAssign,
}: PinActionModalProps) {
	const { t } = useTranslation('');
	const { buttonLabels } = useContext(AppContext);
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
		if (currentAction === BUTTON_ACTIONS.NONE) return null;
		if (disabledOptions.includes(currentAction)) {
			const actionKey = invert(BUTTON_ACTIONS)[currentAction];
			return [{ label: actionKey, value: currentAction, type: 'action', customButtonMask: 0, customDpadMask: 0 }];
		}
		if (currentAction === BUTTON_ACTIONS.CUSTOM_BUTTON_COMBO) {
			return options.filter(
				({ type, customButtonMask, customDpadMask }) =>
					(currentCustomButtonMask & customButtonMask && type === 'customButtonMask') ||
					(currentCustomDpadMask & customDpadMask && type === 'customDpadMask'),
			) as MultiValue<OptionType>;
		}
		return options.filter((option) => option.value === currentAction) as MultiValue<OptionType>;
	}, [currentAction, currentCustomButtonMask, currentCustomDpadMask, options]);

	const isDisabled = disabledOptions.includes(currentAction);

	const handleChange = useCallback(
		(selected: MultiValue<OptionType> | SingleValue<OptionType>) => {
			if (!selected || (Array.isArray(selected) && !selected.length)) {
				onAssign(pinNumber!, BUTTON_ACTIONS.NONE, 0, 0);
				onClose();
				return;
			}
			if (Array.isArray(selected) && selected.length > 1) {
				const lastSelected = selected[selected.length - 1];
				if (lastSelected.type === 'action') {
					onAssign(pinNumber!, lastSelected.value, 0, 0);
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
					onAssign(pinNumber!, BUTTON_ACTIONS.CUSTOM_BUTTON_COMBO, masks.customButtonMask, masks.customDpadMask);
				}
			} else {
				const single = Array.isArray(selected) ? selected[0] : selected;
				onAssign(pinNumber!, single.value, 0, 0);
			}
			onClose();
		},
		[pinNumber, onAssign, onClose],
	);

	return (
		<Modal show={show} onHide={onClose} centered size="lg">
			<Modal.Header closeButton>
				<Modal.Title>
					{t('PinMapping:assign-action-title', { pin: `GP${pinNumber}` })}
				</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<CustomSelect
					isClearable
					isMulti={!isDisabled}
					options={groupedOptions}
					isDisabled={isDisabled}
					getOptionLabel={getOptionLabel}
					onChange={handleChange}
					value={getMultiValue()}
					autoFocus
				/>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="secondary" onClick={onClose}>
					{t('Common:button-dismiss-label')}
				</Button>
			</Modal.Footer>
		</Modal>
	);
}
