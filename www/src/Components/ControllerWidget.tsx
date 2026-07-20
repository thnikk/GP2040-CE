import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BUTTON_MASKS, DPAD_MASKS } from '../Data/Buttons';

type ControllerWidgetProps = {
	buttonMask: number;
	dpadMask: number;
	onMaskChange: (buttonMask: number, dpadMask: number) => void;
	buttonNames: Record<string, string>;
};

const BTN = BUTTON_MASKS.reduce((acc, { label, value }) => {
	acc[label] = value;
	return acc;
}, {} as Record<string, number>);

const DPAD = DPAD_MASKS.reduce((acc, { label, value }) => {
	acc[label] = value;
	return acc;
}, {} as Record<string, number>);

type SvgEl = {
	id: string;
	labelKey: string;
	mask: number;
	isDpad: boolean;
	type: 'circle' | 'rect' | 'ellipse' | 'path';
	attrs: Record<string, string | number>;
	strokeW?: number;
	staticLabel?: string;
	labelDy?: number;
};

function parsePathBounds(d: string): { cx: number; cy: number; w: number; h: number } | null {
	const tokens = d.match(/[a-zA-Z]|-?\d+\.?\d*/g);
	if (!tokens || tokens.length === 0) return null;

	let x = 0, y = 0;
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	let i = 0;
	let cmd = '';

	const add = (px: number, py: number) => {
		x = px; y = py;
		minX = Math.min(minX, x); minY = Math.min(minY, y);
		maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
	};

	while (i < tokens.length) {
		const t = tokens[i];
		if (/[a-zA-Z]/.test(t)) { cmd = t; i++; }
		if (!cmd) continue;
		const rel = cmd === cmd.toLowerCase();
		const cc = cmd.toLowerCase();
		const take = (n: number) => {
			const out: number[] = [];
			for (let j = 0; j < n; j++) out.push(parseFloat(tokens[i++]));
			return out;
		};
		switch (cc) {
			case 'm': {
				const [nx, ny] = take(2);
				add(rel ? x + nx : nx, rel ? y + ny : ny);
				cmd = rel ? 'l' : 'L';
				break;
			}
			case 'l': {
				const [nx, ny] = take(2);
				add(rel ? x + nx : nx, rel ? y + ny : ny);
				break;
			}
			case 'h': {
				const [hx] = take(1);
				add(rel ? x + hx : hx, y);
				break;
			}
			case 'v': {
				const [vy] = take(1);
				add(x, rel ? y + vy : vy);
				break;
			}
			case 'c': {
				do {
					const args = take(6);
					if (args.length < 6) break;
					add(rel ? x + args[4] : args[4], rel ? y + args[5] : args[5]);
				} while (i < tokens.length && /^[-\d]/.test(tokens[i]));
				break;
			}
			case 'q': {
				do {
					const args = take(4);
					if (args.length < 4) break;
					add(rel ? x + args[2] : args[2], rel ? y + args[3] : args[3]);
				} while (i < tokens.length && /^[-\d]/.test(tokens[i]));
				break;
			}
			case 'z': break;
		}
	}
	if (minX === Infinity) return null;
	return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY };
}

function elCenter(el: SvgEl): { cx: number; cy: number; fontSize: number } {
	const a = el.attrs;
	switch (el.type) {
		case 'circle':
			return { cx: a.cx as number, cy: a.cy as number, fontSize: Math.min((a.r as number) * 0.9, 14) };
		case 'ellipse':
			return { cx: a.cx as number, cy: a.cy as number, fontSize: Math.min((a.rx as number) * 0.6, 14) };
		case 'rect':
			return { cx: (a.x as number) + (a.width as number) / 2, cy: (a.y as number) + (a.height as number) / 2, fontSize: Math.min((a.height as number) * 0.6, 12) };
		case 'path': {
			const b = parsePathBounds(a.d as string);
			if (b) return { cx: b.cx, cy: b.cy, fontSize: Math.min(Math.min(b.w, b.h) * 0.5, 14) };
			return { cx: 0, cy: 0, fontSize: 10 };
		}
	}
}

const SVG_ELS: SvgEl[] = [
	{ id: 'btn-l2', labelKey: 'L2',  mask: BTN.L2,  isDpad: false, type: 'path',   attrs: { d: 'm 108.49999,39.47 c 0,4.61 -3.35,8.36 -7.5,8.36 H 87.999992 c -4.14,0 -7.5,-3.74 -7.5,-8.36 V 16.61 c 0,-8.62 6.27,-15.61 14,-15.61 7.729998,0 13.999998,6.99 13.999998,15.61 z' } },
	{ id: 'btn-r2', labelKey: 'R2',  mask: BTN.R2,  isDpad: false, type: 'path',   attrs: { d: 'm 272.82999,39.94 c 0,4.64 -3.44,8.39 -7.68,8.39 h -13.31 c -4.24,0 -7.68,-3.76 -7.68,-8.39 V 17 c 0,-8.65 6.42,-15.67 14.33,-15.67 7.92,0 14.33,7.01 14.33,15.67 v 22.94 z' } },
	{ id: 'btn-l1', labelKey: 'L1',  mask: BTN.L1,  isDpad: false, type: 'rect',   attrs: { x: 72.8, y: 53.3, width: 43.3, height: 17, rx: 4 } },
	{ id: 'btn-r1', labelKey: 'R1',  mask: BTN.R1,  isDpad: false, type: 'rect',   attrs: { x: 237.3, y: 53.5, width: 42.6, height: 17, rx: 4 } },
	{ id: 'btn-a1', labelKey: 'A1',  mask: BTN.A1,  isDpad: false, type: 'ellipse', attrs: { cx: 176.5, cy: 111.5, rx: 19.453, ry: 19.453 } },
	{ id: 'btn-a2', labelKey: 'A2',  mask: BTN.A2,  isDpad: false, type: 'rect',   attrs: { x: 164.5, y: 164, width: 24, height: 14, rx: 7 } },
	{ id: 'btn-s1', labelKey: 'S1',  mask: BTN.S1,  isDpad: false, type: 'circle', attrs: { cx: 144, cy: 148.5, r: 10 } },
	{ id: 'btn-s2', labelKey: 'S2',  mask: BTN.S2,  isDpad: false, type: 'circle', attrs: { cx: 209, cy: 148.5, r: 10 } },
	{ id: 'btn-b4', labelKey: 'B4',  mask: BTN.B4,  isDpad: false, type: 'circle', attrs: { cx: 285, cy: 122, r: 13 } },
	{ id: 'btn-b3', labelKey: 'B3',  mask: BTN.B3,  isDpad: false, type: 'circle', attrs: { cx: 260.5, cy: 146.5, r: 13 } },
	{ id: 'btn-b2', labelKey: 'B2',  mask: BTN.B2,  isDpad: false, type: 'circle', attrs: { cx: 309.5, cy: 146.5, r: 13 } },
	{ id: 'btn-b1', labelKey: 'B1',  mask: BTN.B1,  isDpad: false, type: 'circle', attrs: { cx: 285, cy: 171, r: 13 } },
	{ id: 'btn-up',  labelKey: '',  mask: DPAD.Up,   isDpad: true, type: 'path', attrs: { d: 'm 130.31444,199.3086 c 0,-2.77763 -2.23605,-5.01368 -5.01367,-5.01368 h -6.52344 c -2.77762,0 -5.01367,2.23605 -5.01367,5.01368 v 16.83789 l 8.27539,8.31445 8.27539,-8.31445 z' } },
	{ id: 'btn-down', labelKey: '', mask: DPAD.Down, isDpad: true, type: 'path', attrs: { d: 'm 130.31444,249.61328 c 0,2.77763 -2.23605,5.01368 -5.01367,5.01368 h -6.52344 c -2.77762,0 -5.01367,-2.23605 -5.01367,-5.01368 v -16.83789 l 8.27539,-8.31445 8.27539,8.31445 z' } },
	{ id: 'btn-left', labelKey: '', mask: DPAD.Left, isDpad: true, type: 'path', attrs: { d: 'm 96.847652,216.22461 c -2.77763,0 -5.01368,2.23605 -5.01368,5.01367 v 6.52344 c 0,2.77762 2.23605,5.01367 5.01368,5.01367 h 16.837888 l 8.31445,-8.27539 -8.31445,-8.27539 z' } },
	{ id: 'btn-right', labelKey: '', mask: DPAD.Right, isDpad: true, type: 'path', attrs: { d: 'm 147.15233,216.22461 c 2.77763,0 5.01368,2.23605 5.01368,5.01367 v 6.52344 c 0,2.77762 -2.23605,5.01367 -5.01368,5.01367 h -16.83789 l -8.31445,-8.27539 8.31445,-8.27539 z' } },
	{ id: 'btn-l3',  labelKey: 'L3', mask: BTN.L3, isDpad: false, type: 'circle', attrs: { cx: 69, cy: 146, r: 10 }, strokeW: 4, staticLabel: 'L3' },
	{ id: 'btn-r3',  labelKey: 'R3', mask: BTN.R3, isDpad: false, type: 'circle', attrs: { cx: 234, cy: 224, r: 10 }, strokeW: 4, staticLabel: 'R3' },
];

type LabelPos = { cx: number; cy: number; fontSize: number };
const LABEL_POS = Object.fromEntries(
	SVG_ELS.map((el) => [el.id, elCenter(el)]),
) as Record<string, LabelPos>;

const BTN_DEFS = Object.fromEntries(
	SVG_ELS.map((el) => [el.id, { labelKey: el.labelKey, mask: el.mask, isDpad: el.isDpad }]),
) as Record<string, { labelKey: string; mask: number; isDpad: boolean }>;

const BTN_IDS = Object.keys(BTN_DEFS);
const isBtnId = (id: string | null): id is keyof typeof BTN_DEFS =>
	id != null && BTN_IDS.includes(id);

const defaultFill = (id: string) => {
	switch (id) {
		case 'btn-b1': return '#a3be8c';
		case 'btn-b2': return '#bf616a';
		case 'btn-b3': return '#5e81ac';
		case 'btn-b4': return '#ebcb8b';
		default: return '#d8dee9';
	}
};

const defaultStroke = (id: string) => {
	if (id === 'analog-left' || id === 'analog-right') return '#1c1f26';
	switch (id) {
		case 'btn-b1': return '#a3be8c';
		case 'btn-b2': return '#bf616a';
		case 'btn-b3': return '#5e81ac';
		case 'btn-b4': return '#ebcb8b';
		default: return '#000';
	}
};

export default function ControllerWidget({
	buttonMask,
	dpadMask,
	onMaskChange,
	buttonNames,
}: ControllerWidgetProps) {
	const svgRef = useRef<SVGSVGElement>(null);
	const [svgMarkup, setSvgMarkup] = useState('');

	useEffect(() => {
		fetch('/images/controller.svg')
			.then((r) => r.text())
			.then((text) => {
				const inner = text
					.replace(/<\?xml[^>]*\?>\s*/i, '')
					.replace(/<svg[^>]*>/, '')
					.replace(/<\/svg>\s*$/, '');
				setSvgMarkup(inner);
			});
	}, []);

	const updateLabels = useCallback(
		(svg: SVGSVGElement) => {
			svg.querySelectorAll('.cgp-label').forEach((el) => el.remove());
			const ns = 'http://www.w3.org/2000/svg';
			for (const el of SVG_ELS) {
				const pos = LABEL_POS[el.id];
				if (!pos) continue;
				const label = el.staticLabel || buttonNames[el.labelKey] || el.labelKey;
				const text = document.createElementNS(ns, 'text');
				text.setAttribute('x', String(pos.cx));
				text.setAttribute('y', String(pos.cy + 1 + (el.labelDy ?? 0)));
				text.setAttribute('text-anchor', 'middle');
				text.setAttribute('dominant-baseline', 'central');
				text.setAttribute('font-family', 'Nunito, sans-serif');
				text.setAttribute('font-weight', '700');
				text.classList.add('cgp-label');
				text.setAttribute('id', `label-${el.id}`);
				text.textContent = label;
				svg.appendChild(text);
			}
		},
		[buttonNames],
	);

	useEffect(() => {
		const svg = svgRef.current;
		if (!svg || !svgMarkup) return;

		svg.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line')
			.forEach((el) => {
				el.setAttribute('vector-effect', 'non-scaling-stroke');
				el.style.setProperty('stroke-width', '2', 'important');
			});
	}, [svgMarkup]);

	useEffect(() => {
		const svg = svgRef.current;
		if (!svg) return;

		for (const el of SVG_ELS) {
			const node = svg.getElementById(el.id);
			if (!node) continue;

			const sel = el.isDpad
				? (dpadMask & el.mask) !== 0
				: (buttonMask & el.mask) !== 0;

			(node as HTMLElement).style.fill = defaultFill(el.id);
			(node as HTMLElement).style.stroke = sel ? '#ffffff' : defaultStroke(el.id);
			if (sel) {
				(node as HTMLElement).style.setProperty('stroke-width', '3', 'important');
			} else {
				(node as HTMLElement).style.setProperty('stroke-width', '2', 'important');
			}

			const label = svg.getElementById(`label-${el.id}`);
			if (label) {
				(label as HTMLElement).style.fill = sel ? '#1c1f26' : '#ffffff';
				(label as HTMLElement).style.stroke = sel ? '#ffffff' : '#1c1f26';
			}
		}
	}, [buttonMask, dpadMask, svgMarkup]);

	useEffect(() => {
		const svg = svgRef.current;
		if (!svg || !svgMarkup) return;
		updateLabels(svg);

		for (const el of SVG_ELS) {
			const label = svg.getElementById(`label-${el.id}`);
			if (!label) continue;
			const sel = el.isDpad
				? (dpadMask & el.mask) !== 0
				: (buttonMask & el.mask) !== 0;
			(label as HTMLElement).style.fill = sel ? '#1c1f26' : '#ffffff';
			(label as HTMLElement).style.stroke = sel ? '#ffffff' : '#1c1f26';
		}
	}, [svgMarkup, updateLabels]);

	const handleSvgClick = useCallback(
		(e: React.MouseEvent<SVGSVGElement>) => {
			let el = e.target as Element | null;
			while (el && el !== e.currentTarget) {
				const id = el.getAttribute('id');
				if (id && isBtnId(id)) {
					const def = BTN_DEFS[id];
					if (def.isDpad) {
						onMaskChange(buttonMask, dpadMask ^ def.mask);
					} else {
						onMaskChange(buttonMask ^ def.mask, dpadMask);
					}
					return;
				}
				el = el.parentElement;
			}
		},
		[buttonMask, dpadMask, onMaskChange],
	);

	return (
		<div className="controller-widget">
			{svgMarkup ? (
				<svg
					ref={svgRef}
					className="cgp-svg"
					viewBox="0 0 352 279.5"
					xmlns="http://www.w3.org/2000/svg"
					onClick={handleSvgClick}
					dangerouslySetInnerHTML={{ __html: svgMarkup }}
				/>
			) : (
				<svg ref={svgRef} className="cgp-svg" viewBox="0 0 352 279.5" />
			)}
		</div>
	);
}
