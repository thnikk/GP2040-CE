import React, { memo, useCallback, useContext } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import invert from 'lodash/invert';
import omit from 'lodash/omit';
import { MultiValue, SingleValue } from 'react-select';

import { AppContext } from '../Contexts/AppContext';
import useProfilesStore from '../Store/useProfilesStore';

import CustomSelect from '../Components/CustomSelect';

import { BUTTON_MASKS, DPAD_MASKS, getButtonLabels } from '../Data/Buttons';
import { BUTTON_ACTIONS, PinActionValues } from '../Data/Pins';

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

const PinSelectList = memo(function PinSelectList({
	profileIndex,
	excludePins,
	includePins,
}: {
	profileIndex: number;
	excludePins?: Set<number>;
	includePins?: Set<number>;
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
		if (!pin.startsWith('pin')) return false;
		const num = parseInt(pin.replace('pin', ''), 10);
		if (includePins) return includePins.has(num);
		if (excludePins) return !excludePins.has(num);
		return true;
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

export default PinSelectList;
