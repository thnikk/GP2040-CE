import React, { useCallback } from 'react';
import { KEY_CODES } from '../Data/Keyboard';

const MODIFIER_MIN = 0xe0;
const MODIFIER_MAX = 0xe7;

const isModifier = (v: number) => v >= MODIFIER_MIN && v <= MODIFIER_MAX;

const labelMap = new Map(KEY_CODES.map((k) => [k.value, k.label]));

type KeyDef = { label: string; value: number; size?: string; spacer?: boolean; flex?: boolean };

const MAIN_ROWS: KeyDef[][] = [
	[
		{ label: '', value: 0, size: '1u', spacer: true },
		{ label: '', value: 0, flex:true, spacer: true },
		{ label: 'F13', value: 0x68 },
		{ label: 'F14', value: 0x69 },
		{ label: 'F15', value: 0x6a },
		{ label: 'F16', value: 0x6b },
		{ label: '', value: 0, flex: true, spacer: true },
		{ label: 'F17', value: 0x6c },
		{ label: 'F18', value: 0x6d },
		{ label: 'F19', value: 0x6e },
		{ label: 'F20', value: 0x6f },
		{ label: '', value: 0, flex: true, spacer: true },
		{ label: 'F21', value: 0x70 },
		{ label: 'F22', value: 0x71 },
		{ label: 'F23', value: 0x72 },
		{ label: 'F24', value: 0x73 },
	],
	[
		{ label: 'Esc', value: 0x29 },
		{ label: '', value: 0, flex: true, spacer: true },
		{ label: 'F1', value: 0x3a },
		{ label: 'F2', value: 0x3b },
		{ label: 'F3', value: 0x3c },
		{ label: 'F4', value: 0x3d },
		{ label: '', value: 0, flex: true, spacer: true },
		{ label: 'F5', value: 0x3e },
		{ label: 'F6', value: 0x3f },
		{ label: 'F7', value: 0x40 },
		{ label: 'F8', value: 0x41 },
		{ label: '', value: 0, flex: true, spacer: true },
		{ label: 'F9', value: 0x42 },
		{ label: 'F10', value: 0x43 },
		{ label: 'F11', value: 0x44 },
		{ label: 'F12', value: 0x45 },
	],
	[
		{ label: '`', value: 0x35 },
		{ label: '1', value: 0x1e },
		{ label: '2', value: 0x1f },
		{ label: '3', value: 0x20 },
		{ label: '4', value: 0x21 },
		{ label: '5', value: 0x22 },
		{ label: '6', value: 0x23 },
		{ label: '7', value: 0x24 },
		{ label: '8', value: 0x25 },
		{ label: '9', value: 0x26 },
		{ label: '0', value: 0x27 },
		{ label: '-', value: 0x2d },
		{ label: '=', value: 0x2e },
		{ label: 'Bksp', value: 0x2a, size: '2u' },
	],
	[
		{ label: 'Tab', value: 0x2b, size: '1.5u' },
		{ label: 'Q', value: 0x14 },
		{ label: 'W', value: 0x1a },
		{ label: 'E', value: 0x08 },
		{ label: 'R', value: 0x15 },
		{ label: 'T', value: 0x17 },
		{ label: 'Y', value: 0x1c },
		{ label: 'U', value: 0x18 },
		{ label: 'I', value: 0x0c },
		{ label: 'O', value: 0x12 },
		{ label: 'P', value: 0x13 },
		{ label: '[', value: 0x2f },
		{ label: ']', value: 0x30 },
		{ label: '\\', value: 0x31, size: '1.5u' },
	],
	[
		{ label: 'CLck', value: 0x39, size: '1.75u' },
		{ label: 'A', value: 0x04 },
		{ label: 'S', value: 0x16 },
		{ label: 'D', value: 0x07 },
		{ label: 'F', value: 0x09 },
		{ label: 'G', value: 0x0a },
		{ label: 'H', value: 0x0b },
		{ label: 'J', value: 0x0d },
		{ label: 'K', value: 0x0e },
		{ label: 'L', value: 0x0f },
		{ label: ';', value: 0x33 },
		{ label: "'", value: 0x34 },
		{ label: 'Enter', value: 0x28, size: '2.25u' },
	],
	[
		{ label: 'SftL', value: 0xe1, size: '2.25u' },
		{ label: 'Z', value: 0x1d },
		{ label: 'X', value: 0x1b },
		{ label: 'C', value: 0x06 },
		{ label: 'V', value: 0x19 },
		{ label: 'B', value: 0x05 },
		{ label: 'N', value: 0x11 },
		{ label: 'M', value: 0x10 },
		{ label: ',', value: 0x36 },
		{ label: '.', value: 0x37 },
		{ label: '/', value: 0x38 },
		{ label: 'SftR', value: 0xe5, size: '2.75u' },
	],
	[
		{ label: 'CtL', value: 0xe0, size: '1.25u' },
		{ label: 'WinL', value: 0xe3, size: '1.25u' },
		{ label: 'AltL', value: 0xe2, size: '1.25u' },
		{ label: 'Space', value: 0x2c, size: '6.25u' },
		{ label: 'AltR', value: 0xe6, size: '1.25u' },
		{ label: 'WinR', value: 0xe7, size: '1.25u' },
		{ label: '', value: 0, size: '1.5u', spacer: true },
		{ label: 'CtR', value: 0xe4, size: '1.25u' },
	],
];

const EXTRA_CLUSTERS: { label: string; keys: KeyDef[][] }[] = [
	{
		label: 'Navigation',
		keys: [
			[
				{ label: 'Ins', value: 0x49 },
				{ label: 'Home', value: 0x4a },
				{ label: 'PgUp', value: 0x4b },
			],
			[
				{ label: 'Del', value: 0x4c },
				{ label: 'End', value: 0x4d },
				{ label: 'PgDn', value: 0x4e },
			],
		],
	},
	{
		label: 'Arrows',
		keys: [
			[
				{ label: '', value: 0, spacer: true },
				{ label: '↑', value: 0x52 },
				{ label: '', value: 0, spacer: true },
			],
			[
				{ label: '←', value: 0x50 },
				{ label: '↓', value: 0x51 },
				{ label: '→', value: 0x4f },
			],
		],
	},
	{
		label: 'Media',
		keys: [
			[
				{ label: 'Mute', value: 0xf2 },
				{ label: 'Vol-', value: 0xf4 },
				{ label: 'Vol+', value: 0xf3 },
				{ label: '', value: 0, spacer: true },
			],
			[
				{ label: 'Prev', value: 0xe9 },
				{ label: 'Play', value: 0xf1 },
				{ label: 'Next', value: 0xe8 },
				{ label: 'Stop', value: 0xf0 },
			],
		],
	},
];

type KeyboardWidgetProps = {
	keycode: number;
	modifierMask: number;
	onChange: (keycode: number, modifierMask: number) => void;
};

export default function KeyboardWidget({
	keycode,
	modifierMask,
	onChange,
}: KeyboardWidgetProps) {
	const handleKeyClick = useCallback(
		(value: number) => {
			if (isModifier(value)) {
				const bit = 1 << (value - MODIFIER_MIN);
				onChange(keycode, modifierMask ^ bit);
			} else {
				onChange(value === keycode ? 0 : value, modifierMask);
			}
		},
		[keycode, modifierMask, onChange],
	);

	const sizeClass = (s: string | undefined) => s ? `sz-${s.replace('.', '_')}` : 'sz-1u';

	const renderKey = (key: KeyDef, idx: number) => {
		const sz = sizeClass(key.size);
		if (key.spacer) {
			const cls = key.flex ? 'kb-flex-spacer' : `kb-spacer ${sz}`;
			return <div className={cls} key={`s-${idx}`} />;
		}
		const isMod = isModifier(key.value);
		const isSelected = isMod
			? Boolean(modifierMask & (1 << (key.value - MODIFIER_MIN)))
			: key.value === keycode;
		return (
			<button
				type="button"
				className={`kb-key${isSelected ? ' selected' : ''}${isMod ? ' mod' : ''} ${sz}`}
				key={key.value}
				onClick={() => handleKeyClick(key.value)}
				title={labelMap.get(key.value) || key.label}
			>
				{key.label}
			</button>
		);
	};

	return (
		<div className="keyboard-widget">
			<div className="kb-main-centered">
				{MAIN_ROWS.map((row, ri) => {
					if (ri < 2) {
						const groups: KeyDef[][] = [[]];
						for (const key of row) {
							if (key.flex) {
								groups.push([]);
							} else {
								groups[groups.length - 1].push(key);
							}
						}
						return (
							<div className="keyboard-row f-row" key={ri}>
								{groups.map((g, gi) => (
									<div className="f-cluster" key={gi}>
										{g.map((key, ki) => renderKey(key, ki))}
									</div>
								))}
							</div>
						);
					}
					return (
						<div className="keyboard-row" key={ri}>
							{row.map((key, ki) => renderKey(key, ki))}
						</div>
					);
				})}
			</div>
			<div className="kb-clusters-row">
				{EXTRA_CLUSTERS.map((cluster) => (
					<div className="kb-cluster" key={cluster.label}>
						<div className="kb-cluster-label">{cluster.label}</div>
						{cluster.keys.map((row, ri) => (
							<div className="keyboard-row" key={ri}>
								{row.map((key, ki) => renderKey(key, ki))}
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
}
