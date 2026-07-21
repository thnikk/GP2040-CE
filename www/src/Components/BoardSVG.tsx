import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import invert from 'lodash/invert';
import omit from 'lodash/omit';
import { useContext } from 'react';
import { AppContext } from '../Contexts/AppContext';
import useProfilesStore from '../Store/useProfilesStore';
import { BUTTON_ACTIONS, PinActionValues } from '../Data/Pins';
import { getButtonLabels } from '../Data/Buttons';
import { KEY_CODES } from '../Data/Keyboard';

const STATIC_THEME_COLORS: Record<string, string>[] = [
	{}, // Static Rainbow — computed per-button
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#00ff00', B2: '#ff0000', B3: '#0000ff', B4: '#ffff00', L1: '#000000', L2: '#000000', R1: '#000000', R2: '#000000' }, // Xbox
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#00ff00', B2: '#ff0000', B3: '#0000ff', B4: '#ffff00', L1: '#ffffff', L2: '#ffffff', R1: '#ffffff', R2: '#ffffff' }, // Xbox All
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#ffff00', B2: '#ff0000', B3: '#00ff00', B4: '#0000ff', L1: '#000000', L2: '#000000', R1: '#000000', R2: '#000000' }, // Super Famicom
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#ffff00', B2: '#ff0000', B3: '#00ff00', B4: '#0000ff', L1: '#ffffff', L2: '#ffffff', R1: '#ffffff', R2: '#ffffff' }, // Super Famicom All
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#0000ff', B2: '#ff0000', B3: '#ff00ff', B4: '#00ff00', L1: '#000000', L2: '#000000', R1: '#000000', R2: '#000000' }, // PlayStation
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#0000ff', B2: '#ff0000', B3: '#ff00ff', B4: '#00ff00', L1: '#ffffff', L2: '#ffffff', R1: '#ffffff', R2: '#ffffff' }, // PlayStation All
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ff0000', Right: '#ffffff', B1: '', B2: '', B3: '#ff0000', B4: '#ffff00', L1: '#0000ff', L2: '', R1: '#00ff00', R2: '' }, // Neo Geo
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#ff0000', B2: '', B3: '#ffff00', B4: '#00ff00', L1: '', L2: '', R1: '#0000ff', R2: '' }, // Neo Geo Curved
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#ffff00', B2: '#0000ff', B3: '#ff0000', B4: '#00ff00', L1: '', L2: '', R1: '', R2: '' }, // Neo Geo Modern
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#0000ff', B2: '#ffff00', B3: '#0000ff', B4: '#ffff00', L1: '', L2: '', R1: '#ff0000', R2: '#ff0000' }, // Six Button Fighter
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#0000ff', B2: '#ffff00', B3: '#0000ff', B4: '#ffff00', L1: '#00ff00', L2: '#00ff00', R1: '#ff0000', R2: '#ff0000' }, // Six Button Fighter Plus
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#ff0000', B2: '#ffffff', B3: '#ff0000', B4: '#ffffff', L1: '#000000', L2: '#000000', R1: '#0000ff', R2: '#0000ff' }, // Street Fighter 2
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#00ffff', B2: '#ff00ff', B3: '#ffff00', B4: '#00ff00', L1: '', L2: '', R1: '#ff0000', R2: '' }, // Tekken
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#ff00ff', B3: '#0000ff', B4: '#00ff00', R1: '#ff0000', R2: '#ff8000' }, // Guilty Gear Type-A
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#ff0000', B3: '#ff00ff', B4: '#0000ff', R1: '#00ff00', R2: '#ff8000' }, // Guilty Gear Type-B
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#ff8000', B3: '#ff00ff', B4: '#0000ff', R1: '#00ff00', R2: '#ff0000' }, // Guilty Gear Type-C
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#0000ff', B3: '#ff00ff', B4: '#00ff00', B2: '#ff0000', R1: '#ff8000' }, // Guilty Gear Type-D
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#00ff00', B3: '#ff00ff', B4: '#0000ff', B2: '#ff0000', R1: '#ff8000' }, // Guilty Gear Type-E
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#00ff00', B2: '#ff0000', B3: '#0000ff', B4: '#ffff00', L1: '#ff8000', L2: '#ff00ff', R1: '#8000ff', R2: '#00ffff' }, // Fightboard
	{ Up: '#ffffff', Down: '#ffffff', Left: '#ffffff', Right: '#ffffff', B1: '#00ff00', B2: '#ff0000', B3: '#0000ff', B4: '#ffff00', L1: '#00ffff', L2: '#0000ff', R1: '#ff00ff', R2: '#8000ff' }, // Springboard
];

const INPUT_MODE_COLORS: Record<number, string> = {
	0: '#00FF00',  // XInput
	1: '#FF0000',  // Switch
	2: '#0000FF',  // PS3
	3: '#FFFF00',  // Keyboard
	4: '#0000FF',  // PS4
	5: '#00FF00',  // XBone
	6: '#00FFFF',  // MD Mini
	7: '#FF8000',  // NeoGeo
	8: '#FF00FF',  // PCE Mini
	9: '#FF8000',  // Egret
	10: '#FF8000', // Astro
	11: '#0000FF', // PS Classic
	12: '#00FF00', // Xbox Original
	13: '#0000FF', // PS5
	14: '#FFFFFF', // Generic
};

type BoardSVGProps = {
	svgContent: string;
	pinElements: { id: string; pinNumber: number }[];
	profileIndex: number;
	onPinClick: (pinNumber: number) => void;
	highlightedPin?: number | null;
	dirtyPins?: Set<number>;
	modeColors?: Record<number, string>;
	customTheme?: Record<string, { normal: string; pressed: string }>;
	animationMode?: number;
	themeIndex?: number;
	staticColorNormal?: string;
	inputMode?: number;
	pinLedIndices?: Record<string, number>;
	ledButtonOrder?: (string | undefined)[];
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

const MODIFIER_MIN = 0xe0;

const MODIFIER_SHORT: Record<number, string> = {
	0xe0: 'Ctrl', 0xe1: 'Shift', 0xe2: 'Alt', 0xe3: 'Win',
	0xe4: 'Ctrl', 0xe5: 'Shift', 0xe6: 'Alt', 0xe7: 'Win',
};

const keyCodeLabel = (code: number): string =>
	KEY_CODES.find((k) => k.value === code)?.label || '';

function prepareSvg(svg: string): string {
	return svg.replace(
		/<svg([^>]*)>/,
		(match, attrs) => {
			let cleaned = attrs
				.replace(/\s+width="[^"]*"/g, '')
				.replace(/\s+height="[^"]*"/g, '');
			if (!cleaned.includes('viewBox')) {
				cleaned += ' viewBox="0 0 100 100"';
			}
			return `<svg${cleaned}>`;
		},
	);
}

const BUTTON_ORDER = ['Up', 'Down', 'Left', 'Right', 'B1', 'B2', 'B3', 'B4', 'R1', 'R2', 'L1', 'L2', 'S1', 'S2', 'L3', 'R3', 'A1', 'A2'];

function rainbowColor(ledIndex: number, totalLeds: number): string {
	const hue = (ledIndex * 360 / totalLeds) % 360;
	return `hsl(${hue}, 100%, 50%)`;
}

function getLedColor(
	ledIndex: number,
	totalLeds: number,
	animationMode: number,
	themeIndex: number,
	customTheme?: Record<string, { normal: string; pressed: string }>,
	staticColorNormal?: string,
	ledButtonOrder?: (string | undefined)[],
): string {
	if (animationMode === 0 && staticColorNormal) {
		return staticColorNormal;
	}
	if (animationMode === 4 && customTheme) {
		const btnKey = ledButtonOrder?.[ledIndex] || BUTTON_ORDER[ledIndex % BUTTON_ORDER.length];
		if (customTheme[btnKey]) return customTheme[btnKey].normal;
	}
	if (animationMode === 3 && themeIndex >= 0 && themeIndex < STATIC_THEME_COLORS.length) {
		const btnKey = ledButtonOrder?.[ledIndex] || BUTTON_ORDER[ledIndex % BUTTON_ORDER.length];
		return STATIC_THEME_COLORS[themeIndex][btnKey] || '';
	}
	if (animationMode === 1 || animationMode === 2) {
		return rainbowColor(ledIndex, totalLeds);
	}
	return '';
}

export default function BoardSVG({
	svgContent,
	pinElements,
	profileIndex,
	onPinClick,
	highlightedPin,
	dirtyPins,
	customTheme,
	animationMode = 0,
	themeIndex = 0,
	staticColorNormal,
	inputMode,
	pinLedIndices,
	ledButtonOrder,
	modeColors,
}: BoardSVGProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const { buttonLabels } = useContext(AppContext);
	const { buttonLabelType, swapTpShareLabels } = buttonLabels;
	const CURRENT_BUTTONS = getButtonLabels(buttonLabelType, swapTpShareLabels);
    const buttonNames = omit(CURRENT_BUTTONS, ['label', 'value']);
    const originalFills = useRef<Map<string, { fill: string; strokeWidth: string }>>(new Map());

    const pins = useProfilesStore(
		useShallow((state) => {
			const p = state.profiles[profileIndex];
			if (!p) return {};
			return omit(p, ['profileLabel', 'enabled']);
		}),
	);

    const updateLabels = useCallback(() => {
	        if (!containerRef.current) return;

	        if (originalFills.current.size === 0) {
	            pinElements.forEach(({ id }) => {
	                const el = containerRef.current?.querySelector(`#${CSS.escape(id)}`);
	                if (!el) return;
	                const tagName = el.tagName.toLowerCase();
	                const isShape = SHAPE_TAGS.has(tagName);
	                const shapeList: Element[] = isShape
	                    ? [el]
	                    : Array.from(el.querySelectorAll('rect, circle, path, ellipse, polygon, polyline, line'));
	                shapeList.forEach((shape, idx) => {
	                    const key = `${id}-${idx}`;
	                    const s = shape as HTMLElement;
	                    let fill = s.style.fill || shape.getAttribute('fill') || '';
	                    if (!fill || fill === 'none') {
	                        fill = window.getComputedStyle(shape).fill;
	                    }
	                    const sw = s.style.strokeWidth || shape.getAttribute('stroke-width') || '';
	                    if (fill && fill !== 'none') {
	                        originalFills.current.set(key, { fill, strokeWidth: sw });
	                    }
	                });
	            });
	        }

	        const ledValues = pinLedIndices ? Object.values(pinLedIndices).filter((v): v is number => typeof v === 'number' && v >= 0) : [];
	        const totalLeds = ledValues.length > 0 ? Math.max(...ledValues) + 1 : 0;

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
				labelEl.setAttribute('dominant-baseline', 'central');
				labelEl.setAttribute('font-family', '"Nunito", monospace');
				labelEl.setAttribute('font-size', '11');
				labelEl.setAttribute('font-weight', 'bold');
				labelEl.setAttribute('fill', '#000000');
				labelEl.setAttribute('stroke', '#ffffff');
				labelEl.setAttribute('stroke-width', '2');
				labelEl.setAttribute('stroke-linejoin', 'round');
				labelEl.setAttribute('paint-order', 'stroke fill');

				if (isShape) {
					const g = document.createElementNS(svgNs, 'g');
					g.setAttribute('id', id);
					el.parentNode?.insertBefore(g, el);
					g.appendChild(el);
					el.removeAttribute('id');
					g.appendChild(labelEl);
				} else {
					el.appendChild(labelEl);
				}
			}

			const actionKey = invert(BUTTON_ACTIONS)[action];
			const btnKey = ACTION_LABELS[action] || actionKey?.split('BUTTON_PRESS_')?.pop();

			const isKeyboardMode = inputMode === 3;
			const profileData = useProfilesStore.getState().profiles[profileIndex];
			const keyboardKeycode = profileData?.keyboardKeycodes?.[pinNumber] ?? 0;
			const keyboardModifierMask = profileData?.keyboardModifierMasks?.[pinNumber] ?? 0;

			let keyboardLines: string[] | null = null;
			if (isKeyboardMode && keyboardKeycode > 0) {
				keyboardLines = [];
				for (let i = 0; i < 8; i++) {
					if (keyboardModifierMask & (1 << i))
						keyboardLines.push(MODIFIER_SHORT[MODIFIER_MIN + i] || '');
				}
				if (keyboardKeycode < MODIFIER_MIN)
					keyboardLines.push(keyCodeLabel(keyboardKeycode));
				else
					keyboardLines.push(MODIFIER_SHORT[keyboardKeycode] || keyCodeLabel(keyboardKeycode));
			}

			if (keyboardLines) {
				// handled below after positioning
			} else if (isKeyboardMode) {
				labelEl.textContent = '';
			} else {
				let displayLabel = '';
				if (action === BUTTON_ACTIONS.NONE) {
					displayLabel = '';
				} else if (action === BUTTON_ACTIONS.RESERVED || action === BUTTON_ACTIONS.ASSIGNED_TO_ADDON) {
					displayLabel = ACTION_LABELS[action] || '';
				} else {
					displayLabel = (btnKey && buttonNames[btnKey]) || ACTION_LABELS[action] || actionKey || '';
				}
				labelEl.textContent = displayLabel;
				labelEl.style.setProperty('font-size', '11px', 'important');
			}

			const buttonEl = isShape ? (el as Element) : shapes[0];
			const buttonRect = (buttonEl as Element).getBoundingClientRect();
			const svgRoot = el.ownerSVGElement as SVGSVGElement;
			const screenCTM = svgRoot.getScreenCTM();

			let cx = buttonRect.left + buttonRect.width / 2;
			let cy = buttonRect.top + buttonRect.height / 2;

			if (screenCTM) {
				const inverse = screenCTM.inverse();
				const pt = new DOMPoint(cx, cy).matrixTransform(inverse);
				cx = pt.x;
				cy = pt.y;
			}

			if (keyboardLines) {
				const svgNs = 'http://www.w3.org/2000/svg';
				while (labelEl.firstChild) labelEl.removeChild(labelEl.firstChild);
				labelEl.removeAttribute('x');
				labelEl.removeAttribute('y');
				const fontSize = 12;
				const lineHeight = 16;
				const totalLines = keyboardLines.length;
				keyboardLines.forEach((line, idx) => {
					const tspan = document.createElementNS(svgNs, 'tspan');
					tspan.textContent = line;
					tspan.setAttribute('x', String(cx));
					tspan.setAttribute('y', String(cy + (idx - (totalLines - 1) / 2) * lineHeight));
					tspan.setAttribute('text-anchor', 'middle');
					tspan.style.setProperty('font-size', `${fontSize}px`, 'important');
					labelEl.appendChild(tspan);
				});
			} else {
				labelEl.setAttribute('x', String(cx));
				labelEl.setAttribute('y', String(cy));
			}

			if (!keyboardLines) {
				const labelRect = labelEl.getBoundingClientRect();
				if (labelRect.width > buttonRect.width * 0.85) {
					labelEl.setAttribute('transform', `rotate(-25, ${cx}, ${cy})`);
				} else if (labelEl.hasAttribute('transform')) {
					labelEl.removeAttribute('transform');
				}
			} else if (labelEl.hasAttribute('transform')) {
				labelEl.removeAttribute('transform');
			}

			const isHighlighted = highlightedPin !== null && highlightedPin === pinNumber;

			const pinStr = String(pinNumber);
			const hasLed = pinLedIndices && pinLedIndices[pinStr] != null && pinLedIndices[pinStr] >= 0;
			const ledIndex = hasLed ? pinLedIndices[pinStr] : -1;
			const ledColor = hasLed ? getLedColor(ledIndex, totalLeds, animationMode, themeIndex, customTheme, staticColorNormal, ledButtonOrder) : '';

	        shapes.forEach((shape, shapeIndex) => {
	            const svgEl = shape as HTMLElement;
	            const origFill = originalFills.current.get(`${id}-${shapeIndex}`)?.fill || '';
	            if (isHighlighted) {
	                svgEl.style.setProperty('fill', '#3d3d00', 'important');
	                svgEl.style.setProperty('stroke', '#ffff00', 'important');
	                svgEl.style.setProperty('stroke-width', '3', 'important');
	                svgEl.style.removeProperty('fill-opacity');
	            } else if (action === BUTTON_ACTIONS.NONE || action === undefined) {
	                svgEl.style.setProperty('fill', origFill || '#16213e', 'important');
	                svgEl.style.setProperty('fill-opacity', '0.2', 'important');
	                svgEl.style.removeProperty('stroke');
	                svgEl.style.setProperty('stroke-width', '2', 'important');
	            } else if (action === BUTTON_ACTIONS.RESERVED) {
	                svgEl.style.setProperty('fill', '#3d0000', 'important');
	                svgEl.style.setProperty('stroke', '#ff0000', 'important');
	                svgEl.style.removeProperty('fill-opacity');
	            } else if (action === BUTTON_ACTIONS.ASSIGNED_TO_ADDON) {
	                svgEl.style.setProperty('fill', '#1a1a3e', 'important');
	                svgEl.style.setProperty('stroke', '#6666ff', 'important');
	                svgEl.style.removeProperty('fill-opacity');
	            } else if (ledColor) {
	                svgEl.style.setProperty('fill', ledColor, 'important');
	                svgEl.style.removeProperty('fill-opacity');
	                svgEl.style.removeProperty('stroke');
	                svgEl.style.setProperty('stroke-width', '2', 'important');
	            } else {
	                svgEl.style.setProperty('fill', origFill || '#0a3d0a', 'important');
	                svgEl.style.removeProperty('fill-opacity');
	                svgEl.style.removeProperty('stroke');
	                svgEl.style.setProperty('stroke-width', '2', 'important');
	            }

	            if (dirtyPins?.has(pinNumber) && !isHighlighted) {
	                svgEl.style.setProperty('stroke', '#00ff00', 'important');
	                svgEl.style.setProperty('stroke-width', '3', 'important');
	            }
	        });
		});
	}, [pinElements, pins, buttonNames, highlightedPin, dirtyPins, customTheme, animationMode, themeIndex, inputMode, pinLedIndices, ledButtonOrder]);

	useEffect(() => {
		if (!containerRef.current || !svgContent) return;

		const svgContainer = containerRef.current;

		svgContainer.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line')
			.forEach((el) => {
				el.setAttribute('vector-effect', 'non-scaling-stroke');
				el.style.setProperty('stroke-width', '2', 'important');
			});

		const caseEl = svgContainer.querySelector('#case');
		if (caseEl) {
			(caseEl as HTMLElement).style.setProperty('stroke-width', '1', 'important');
		}

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

	const updateLabelsRef = useRef(updateLabels);
	updateLabelsRef.current = updateLabels;

	useEffect(() => {
		updateLabels();
	});

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const applyLayout = () => {
			updateLabelsRef.current();
		};

		applyLayout();

		const observer = new ResizeObserver(applyLayout);
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		if (!containerRef.current) return;
		const ledEl = containerRef.current.querySelector('#board-led') as HTMLElement | null;
		if (!ledEl) return;
		const color = inputMode !== undefined ? (modeColors?.[inputMode] ?? INPUT_MODE_COLORS[inputMode]) : undefined;
		if (color) {
			ledEl.style.setProperty('fill', color, 'important');
		} else {
			ledEl.style.removeProperty('fill');
		}
	}, [inputMode, modeColors]);

	const processedSvg = useMemo(() => prepareSvg(svgContent), [svgContent]);

	return (
		<div
			ref={containerRef}
			className="board-svg-container"
			dangerouslySetInnerHTML={{ __html: processedSvg }}
		/>
	);
}
