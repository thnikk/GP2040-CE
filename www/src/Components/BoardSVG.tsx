import React, { useEffect, useRef, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import invert from 'lodash/invert';
import omit from 'lodash/omit';
import { useContext } from 'react';
import { AppContext } from '../Contexts/AppContext';
import useProfilesStore from '../Store/useProfilesStore';
import { BUTTON_ACTIONS, PinActionValues } from '../Data/Pins';
import { getButtonLabels } from '../Data/Buttons';

type BoardSVGProps = {
	svgContent: string;
	pinElements: { id: string; pinNumber: number }[];
	profileIndex: number;
	onPinClick: (pinNumber: number) => void;
	highlightedPin?: number | null;
};

const ACTION_LABELS: Record<PinActionValues, string> = {
	[BUTTON_ACTIONS.NONE]: '',
	[BUTTON_ACTIONS.RESERVED]: 'RESERVED',
	[BUTTON_ACTIONS.ASSIGNED_TO_ADDON]: 'ADDON',
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
	[BUTTON_ACTIONS.BUTTON_PRESS_A3]: 'A3',
	[BUTTON_ACTIONS.BUTTON_PRESS_A4]: 'A4',
	[BUTTON_ACTIONS.BUTTON_PRESS_E1]: 'E1',
	[BUTTON_ACTIONS.BUTTON_PRESS_E2]: 'E2',
	[BUTTON_ACTIONS.BUTTON_PRESS_E3]: 'E3',
	[BUTTON_ACTIONS.BUTTON_PRESS_E4]: 'E4',
	[BUTTON_ACTIONS.BUTTON_PRESS_E5]: 'E5',
	[BUTTON_ACTIONS.BUTTON_PRESS_E6]: 'E6',
	[BUTTON_ACTIONS.BUTTON_PRESS_E7]: 'E7',
	[BUTTON_ACTIONS.BUTTON_PRESS_E8]: 'E8',
	[BUTTON_ACTIONS.BUTTON_PRESS_E9]: 'E9',
	[BUTTON_ACTIONS.BUTTON_PRESS_E10]: 'E10',
	[BUTTON_ACTIONS.BUTTON_PRESS_E11]: 'E11',
	[BUTTON_ACTIONS.BUTTON_PRESS_E12]: 'E12',
	[BUTTON_ACTIONS.BUTTON_PRESS_FN]: 'Fn',
	[BUTTON_ACTIONS.BUTTON_PRESS_TURBO]: 'Turbo',
	[BUTTON_ACTIONS.BUTTON_PRESS_MACRO]: 'Macro',
	[BUTTON_ACTIONS.BUTTON_PRESS_MACRO_1]: 'M1',
	[BUTTON_ACTIONS.BUTTON_PRESS_MACRO_2]: 'M2',
	[BUTTON_ACTIONS.BUTTON_PRESS_MACRO_3]: 'M3',
	[BUTTON_ACTIONS.BUTTON_PRESS_MACRO_4]: 'M4',
	[BUTTON_ACTIONS.BUTTON_PRESS_MACRO_5]: 'M5',
	[BUTTON_ACTIONS.BUTTON_PRESS_MACRO_6]: 'M6',
	[BUTTON_ACTIONS.BUTTON_PRESS_INPUT_REVERSE]: 'Rev',
	[BUTTON_ACTIONS.SUSTAIN_FOCUS_MODE]: 'Focus',
	[BUTTON_ACTIONS.SUSTAIN_4_8_WAY_MODE]: '4-8Way',
	[BUTTON_ACTIONS.SUSTAIN_DP_MODE_DP]: 'DP',
	[BUTTON_ACTIONS.SUSTAIN_DP_MODE_LS]: 'LS',
	[BUTTON_ACTIONS.SUSTAIN_DP_MODE_RS]: 'RS',
	[BUTTON_ACTIONS.SUSTAIN_SOCD_MODE_UP_PRIO]: 'UpPrio',
	[BUTTON_ACTIONS.SUSTAIN_SOCD_MODE_NEUTRAL]: 'Neut',
	[BUTTON_ACTIONS.SUSTAIN_SOCD_MODE_SECOND_WIN]: '2ndWin',
	[BUTTON_ACTIONS.SUSTAIN_SOCD_MODE_FIRST_WIN]: '1stWin',
	[BUTTON_ACTIONS.SUSTAIN_SOCD_MODE_BYPASS]: 'Bypass',
	[BUTTON_ACTIONS.DIGITAL_DIRECTION_UP]: 'DigUp',
	[BUTTON_ACTIONS.DIGITAL_DIRECTION_DOWN]: 'DigDown',
	[BUTTON_ACTIONS.DIGITAL_DIRECTION_LEFT]: 'DigLeft',
	[BUTTON_ACTIONS.DIGITAL_DIRECTION_RIGHT]: 'DigRight',
	[BUTTON_ACTIONS.ANALOG_DIRECTION_LS_X_NEG]: 'LS-X-',
	[BUTTON_ACTIONS.ANALOG_DIRECTION_LS_X_POS]: 'LS-X+',
	[BUTTON_ACTIONS.ANALOG_DIRECTION_LS_Y_NEG]: 'LS-Y-',
	[BUTTON_ACTIONS.ANALOG_DIRECTION_LS_Y_POS]: 'LS-Y+',
	[BUTTON_ACTIONS.ANALOG_DIRECTION_RS_X_NEG]: 'RS-X-',
	[BUTTON_ACTIONS.ANALOG_DIRECTION_RS_X_POS]: 'RS-X+',
	[BUTTON_ACTIONS.ANALOG_DIRECTION_RS_Y_NEG]: 'RS-Y-',
	[BUTTON_ACTIONS.ANALOG_DIRECTION_RS_Y_POS]: 'RS-Y+',
	[BUTTON_ACTIONS.ANALOG_DIRECTION_MOD_LOW]: 'ModLow',
	[BUTTON_ACTIONS.ANALOG_DIRECTION_MOD_HIGH]: 'ModHigh',
	[BUTTON_ACTIONS.MENU_NAVIGATION_UP]: 'NavUp',
	[BUTTON_ACTIONS.MENU_NAVIGATION_DOWN]: 'NavDown',
	[BUTTON_ACTIONS.MENU_NAVIGATION_LEFT]: 'NavLeft',
	[BUTTON_ACTIONS.MENU_NAVIGATION_RIGHT]: 'NavRight',
	[BUTTON_ACTIONS.MENU_NAVIGATION_SELECT]: 'NavSel',
	[BUTTON_ACTIONS.MENU_NAVIGATION_BACK]: 'NavBack',
	[BUTTON_ACTIONS.MENU_NAVIGATION_TOGGLE]: 'NavTog',
	[BUTTON_ACTIONS.CUSTOM_BUTTON_COMBO]: 'Combo',
};

const SHAPE_TAGS = new Set([
	'path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line',
]);

export default function BoardSVG({
	svgContent,
	pinElements,
	profileIndex,
	onPinClick,
	highlightedPin,
}: BoardSVGProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const { buttonLabels } = useContext(AppContext);
	const { buttonLabelType, swapTpShareLabels } = buttonLabels;
	const CURRENT_BUTTONS = getButtonLabels(buttonLabelType, swapTpShareLabels);
	const buttonNames = omit(CURRENT_BUTTONS, ['label', 'value']);

	const pins = useProfilesStore(
		useShallow((state) => {
			const p = state.profiles[profileIndex];
			if (!p) return {};
			return omit(p, ['profileLabel', 'enabled']);
		}),
	);

	const updateLabels = useCallback(() => {
		if (!containerRef.current) return;

		pinElements.forEach(({ id, pinNumber }) => {
			const el = containerRef.current?.querySelector(`#${CSS.escape(id)}`);
			if (!el) return;

			const tagName = el.tagName.toLowerCase();
			const isShape = SHAPE_TAGS.has(tagName);
			const shapes: Element[] = isShape
				? [el]
				: Array.from(el.querySelectorAll('rect, circle, path, ellipse, polygon, polyline, line'));

			const pinData = pins[`pin${pinNumber.toString().padStart(2, '0')}`];
			const action = pinData?.action ?? BUTTON_ACTIONS.NONE;

			let labelEl = el.querySelector<SVGTextElement>('.pin-action-label');
			if (!labelEl) {
				const svgNs = 'http://www.w3.org/2000/svg';
				labelEl = document.createElementNS(svgNs, 'text');
				labelEl.setAttribute('class', 'pin-action-label');
				labelEl.setAttribute('text-anchor', 'middle');
				labelEl.setAttribute('font-family', 'monospace');
				labelEl.setAttribute('font-size', '9');
				labelEl.setAttribute('font-weight', 'bold');

				if (isShape) {
					el.parentNode?.insertBefore(labelEl, el.nextSibling);
				} else {
					el.appendChild(labelEl);
				}
			}

			let displayLabel = '';
			if (action === BUTTON_ACTIONS.NONE) {
				displayLabel = '';
			} else if (action === BUTTON_ACTIONS.RESERVED || action === BUTTON_ACTIONS.ASSIGNED_TO_ADDON) {
				displayLabel = ACTION_LABELS[action] || '';
			} else {
				const actionKey = invert(BUTTON_ACTIONS)[action];
				const btnKey = actionKey?.split('BUTTON_PRESS_')?.pop();
				displayLabel = (btnKey && buttonNames[btnKey]) || ACTION_LABELS[action] || actionKey || '';
			}
			labelEl.textContent = displayLabel;

			const bbox = el.getBBox();
			const cx = bbox.x + bbox.width / 2;
			const cy = bbox.y + bbox.height + 14;
			labelEl.setAttribute('x', String(cx));
			labelEl.setAttribute('y', String(cy));

			const isHighlighted = highlightedPin !== null && highlightedPin === pinNumber;

			shapes.forEach((shape) => {
				const svgEl = shape as HTMLElement;
				if (isHighlighted) {
					svgEl.style.setProperty('fill', '#3d3d00', 'important');
					svgEl.style.setProperty('stroke', '#ffff00', 'important');
					svgEl.style.setProperty('stroke-width', '4', 'important');
				} else if (action === BUTTON_ACTIONS.NONE || action === undefined) {
					svgEl.style.setProperty('fill', '#16213e', 'important');
					svgEl.style.removeProperty('stroke-width');
				} else if (action === BUTTON_ACTIONS.RESERVED) {
					svgEl.style.setProperty('fill', '#3d0000', 'important');
					svgEl.style.setProperty('stroke', '#ff0000', 'important');
				} else if (action === BUTTON_ACTIONS.ASSIGNED_TO_ADDON) {
					svgEl.style.setProperty('fill', '#1a1a3e', 'important');
					svgEl.style.setProperty('stroke', '#6666ff', 'important');
				} else {
					svgEl.style.setProperty('fill', '#0a3d0a', 'important');
					svgEl.style.setProperty('stroke', '#00ff00', 'important');
					svgEl.style.setProperty('stroke-width', '3', 'important');
				}
			});
		});
	}, [pinElements, pins, buttonNames, highlightedPin]);

	useEffect(() => {
		if (!containerRef.current || !svgContent) return;

		const svgContainer = containerRef.current;
		const groups = svgContainer.querySelectorAll('[id^="pin"]');

		const handlers: (() => void)[] = [];
		groups.forEach((group) => {
			const match = group.id.match(/^pin(\d+)$/);
			if (!match) return;
			const pinNum = parseInt(match[1], 10);

			const handler = () => onPinClick(pinNum);
			group.addEventListener('click', handler);
			group.style.setProperty('cursor', 'pointer');
			handlers.push(() => group.removeEventListener('click', handler));
		});

		return () => handlers.forEach((remove) => remove());
	}, [svgContent, pinElements, onPinClick]);

	useEffect(() => {
		updateLabels();
	});

	return (
		<div
			ref={containerRef}
			className="board-svg-container"
			dangerouslySetInnerHTML={{ __html: svgContent }}
		/>
	);
}
