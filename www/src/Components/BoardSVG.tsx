import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import invert from 'lodash/invert';
import omit from 'lodash/omit';
import { useContext } from 'react';
import { AppContext } from '../Contexts/AppContext';
import useProfilesStore from '../Store/useProfilesStore';
import { BUTTON_ACTIONS, PinActionValues } from '../Data/Pins';
import { getButtonLabels } from '../Data/Buttons';

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
	customTheme?: Record<string, { normal: string; pressed: string }>;
	animationMode?: number;
	themeIndex?: number;
	staticColorNormal?: string;
	inputMode?: number;
	ledButtonMap?: Record<string, number | null>;
	splashImage?: number[];
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

function splashToDataUrl(bits: number[]): string {
	const w = 128, h = 64;
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d')!;
	const imageData = ctx.createImageData(w, h);
	for (let row = 0; row < h; row++) {
		for (let col = 0; col < w; col++) {
			const byteIndex = row * 16 + Math.floor(col / 8);
			const bitIndex = 7 - (col % 8);
			const pixelOn = ((bits[byteIndex] ?? 0) >> bitIndex) & 1;
			const val = pixelOn ? 255 : 0;
			const idx = (row * w + col) * 4;
			imageData.data[idx] = val;
			imageData.data[idx + 1] = val;
			imageData.data[idx + 2] = val;
			imageData.data[idx + 3] = 255;
		}
	}
	ctx.putImageData(imageData, 0, 0);
	return canvas.toDataURL('image/png');
}

const BUTTON_ORDER = ['Up', 'Down', 'Left', 'Right', 'B1', 'B2', 'B3', 'B4', 'R1', 'R2', 'L1', 'L2', 'S1', 'S2', 'L3', 'R3', 'A1', 'A2'];

function rainbowColor(btnKey: string): string {
	const index = BUTTON_ORDER.indexOf(btnKey);
	if (index === -1) return '';
	const hue = (index * 360 / BUTTON_ORDER.length) % 360;
	return `hsl(${hue}, 100%, 50%)`;
}

function getLedColor(
	btnKey: string | undefined,
	animationMode: number,
	themeIndex: number,
	customTheme?: Record<string, { normal: string; pressed: string }>,
	staticColorNormal?: string,
	ledButtonMap?: Record<string, number | null>,
): string {
	if (!btnKey) return '';
	if (ledButtonMap && ledButtonMap[btnKey] == null) return '';
	if (animationMode === 0 && staticColorNormal) {
		return staticColorNormal;
	}
	if (animationMode === 4 && customTheme && customTheme[btnKey]) {
		return customTheme[btnKey].normal;
	}
	if (animationMode === 3 && themeIndex >= 0 && themeIndex < STATIC_THEME_COLORS.length) {
		return STATIC_THEME_COLORS[themeIndex][btnKey] || '';
	}
	if (animationMode === 1 || animationMode === 2) {
		return rainbowColor(btnKey);
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
	ledButtonMap,
	splashImage,
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
				labelEl.setAttribute('stroke-width', '3');
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

			let displayLabel = '';
			if (action === BUTTON_ACTIONS.NONE) {
				displayLabel = '';
			} else if (action === BUTTON_ACTIONS.RESERVED || action === BUTTON_ACTIONS.ASSIGNED_TO_ADDON) {
				displayLabel = ACTION_LABELS[action] || '';
			} else {
				displayLabel = (btnKey && buttonNames[btnKey]) || ACTION_LABELS[action] || actionKey || '';
			}
			labelEl.textContent = displayLabel;

			const buttonEl = isShape ? (el as Element) : shapes[0];
			const buttonRect = (buttonEl as Element).getBoundingClientRect();
			const labelRect = labelEl.getBoundingClientRect();
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
			labelEl.setAttribute('x', String(cx));
			labelEl.setAttribute('y', String(cy));

			if (labelRect.width > buttonRect.width * 0.85) {
				labelEl.setAttribute('transform', `rotate(-25, ${cx}, ${cy})`);
			} else if (labelEl.hasAttribute('transform')) {
				labelEl.removeAttribute('transform');
			}

			const isHighlighted = highlightedPin !== null && highlightedPin === pinNumber;

			const ledColor = getLedColor(btnKey, animationMode, themeIndex, customTheme, staticColorNormal, ledButtonMap);

	        shapes.forEach((shape, shapeIndex) => {
	            const svgEl = shape as HTMLElement;
	            const orig = originalFills.current.get(`${id}-${shapeIndex}`);
	            const origFill = orig?.fill || '';
	            const origStrokeWidth = orig?.strokeWidth || '';
	            if (isHighlighted) {
	                svgEl.style.setProperty('fill', '#3d3d00', 'important');
	                svgEl.style.setProperty('stroke', '#ffff00', 'important');
	                svgEl.style.setProperty('stroke-width', '4', 'important');
	                svgEl.style.removeProperty('fill-opacity');
	            } else if (action === BUTTON_ACTIONS.NONE || action === undefined) {
	                svgEl.style.setProperty('fill', origFill || '#16213e', 'important');
	                svgEl.style.setProperty('fill-opacity', '0.2', 'important');
	                svgEl.style.removeProperty('stroke');
	                if (origStrokeWidth) {
	                    svgEl.style.setProperty('stroke-width', origStrokeWidth, 'important');
	                } else {
	                    svgEl.style.removeProperty('stroke-width');
	                }
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
	                if (origStrokeWidth) {
	                    svgEl.style.setProperty('stroke-width', origStrokeWidth, 'important');
	                } else {
	                    svgEl.style.removeProperty('stroke-width');
	                }
	            } else {
	                svgEl.style.setProperty('fill', origFill || '#0a3d0a', 'important');
	                svgEl.style.removeProperty('fill-opacity');
	                svgEl.style.removeProperty('stroke');
	                if (origStrokeWidth) {
	                    svgEl.style.setProperty('stroke-width', origStrokeWidth, 'important');
	                } else {
	                    svgEl.style.removeProperty('stroke-width');
	                }
	            }

	            if (dirtyPins?.has(pinNumber) && !isHighlighted) {
	                svgEl.style.setProperty('stroke', '#00ff00', 'important');
	                svgEl.style.setProperty('stroke-width', '3', 'important');
	            }
	        });
		});
	}, [pinElements, pins, buttonNames, highlightedPin, dirtyPins, customTheme, animationMode, themeIndex]);

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

	const updateLabelsRef = useRef(updateLabels);
	updateLabelsRef.current = updateLabels;

	const splashImageRef = useRef(splashImage);
	splashImageRef.current = splashImage;

	useEffect(() => {
		updateLabels();
	});

	useEffect(() => {
		if (!containerRef.current) return;
		const ledEl = containerRef.current.querySelector('#board-led') as HTMLElement | null;
		if (!ledEl) return;
		const color = inputMode !== undefined ? INPUT_MODE_COLORS[inputMode] : undefined;
		if (color) {
			ledEl.style.setProperty('fill', color, 'important');
		} else {
			ledEl.style.removeProperty('fill');
		}
	}, [inputMode]);

	const OLED_PADDING = 4;

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const applyLayout = () => {
			updateLabelsRef.current();

			const oledEl = container.querySelector('#oled') as SVGGraphicsElement | null;
			if (!oledEl || !splashImageRef.current?.length) return;

			const bbox = oledEl.getBBox();
			if (bbox.width === 0 || bbox.height === 0) return;

			const p = OLED_PADDING;

			const bgEl = container.querySelector('#oled-bg');
			if (bgEl) {
				bgEl.setAttribute('x', String(bbox.x));
				bgEl.setAttribute('y', String(bbox.y));
				bgEl.setAttribute('width', String(bbox.width));
				bgEl.setAttribute('height', String(bbox.height));
			}

			const imgEl = container.querySelector('#oled-splash');
			if (imgEl) {
				imgEl.setAttribute('x', String(bbox.x + p));
				imgEl.setAttribute('y', String(bbox.y + p));
				imgEl.setAttribute('width', String(bbox.width - 2 * p));
				imgEl.setAttribute('height', String(bbox.height - 2 * p));
			}
		};

		applyLayout();

		const observer = new ResizeObserver(applyLayout);
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const oledEl = container.querySelector('#oled') as SVGGraphicsElement | null;
		if (!oledEl) return;

		const svgNs = 'http://www.w3.org/2000/svg';

		if (splashImage && splashImage.length > 0) {
			const dataUrl = splashToDataUrl(splashImage);
			const bbox = oledEl.getBBox();

			(oledEl as HTMLElement).style.setProperty('fill', 'none', 'important');

			let clipPath = container.querySelector('#oled-clip');
			if (!clipPath) {
				clipPath = document.createElementNS(svgNs, 'clipPath');
				clipPath.setAttribute('id', 'oled-clip');
				const use = document.createElementNS(svgNs, 'use');
				use.setAttribute('href', '#oled');
				clipPath.appendChild(use);
				oledEl.parentNode?.insertBefore(clipPath, oledEl);
			}

			let bgEl = container.querySelector('#oled-bg');
			if (!bgEl) {
				bgEl = document.createElementNS(svgNs, 'rect');
				bgEl.setAttribute('id', 'oled-bg');
				oledEl.parentNode?.insertBefore(bgEl, oledEl);
			}
			bgEl.setAttribute('x', String(bbox.x));
			bgEl.setAttribute('y', String(bbox.y));
			bgEl.setAttribute('width', String(bbox.width));
			bgEl.setAttribute('height', String(bbox.height));
			bgEl.setAttribute('fill', '#000000');
			bgEl.setAttribute('clip-path', 'url(#oled-clip)');

			const p = OLED_PADDING;
			let imgEl = container.querySelector('#oled-splash');
			if (!imgEl) {
				imgEl = document.createElementNS(svgNs, 'image');
				imgEl.setAttribute('id', 'oled-splash');
				oledEl.parentNode?.insertBefore(imgEl, oledEl);
			}
			imgEl.setAttribute('x', String(bbox.x + p));
			imgEl.setAttribute('y', String(bbox.y + p));
			imgEl.setAttribute('width', String(bbox.width - 2 * p));
			imgEl.setAttribute('height', String(bbox.height - 2 * p));
			imgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
			imgEl.setAttribute('href', dataUrl);
			imgEl.setAttribute('clip-path', 'url(#oled-clip)');
		} else {
			container.querySelector('#oled-splash')?.remove();
			container.querySelector('#oled-bg')?.remove();
			container.querySelector('#oled-clip')?.remove();
			(oledEl as HTMLElement).style.removeProperty('fill');
		}
	}, [splashImage]);

	const processedSvg = useMemo(() => prepareSvg(svgContent), [svgContent]);

	return (
		<div
			ref={containerRef}
			className="board-svg-container"
			dangerouslySetInnerHTML={{ __html: processedSvg }}
		/>
	);
}
