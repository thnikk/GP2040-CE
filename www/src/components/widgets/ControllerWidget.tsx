import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BUTTON_MASKS, DPAD_MASKS } from '../../Data/Buttons';

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
	strokeW?: number;
	staticLabel?: string;
	labelDy?: number;
};

const SVG_ELS: SvgEl[] = [
	{ id: 'btn-l2', labelKey: 'L2',  mask: BTN.L2,  isDpad: false },
	{ id: 'btn-r2', labelKey: 'R2',  mask: BTN.R2,  isDpad: false },
	{ id: 'btn-l1', labelKey: 'L1',  mask: BTN.L1,  isDpad: false },
	{ id: 'btn-r1', labelKey: 'R1',  mask: BTN.R1,  isDpad: false },
	{ id: 'btn-a1', labelKey: 'A1',  mask: BTN.A1,  isDpad: false },
	{ id: 'btn-a2', labelKey: 'A2',  mask: BTN.A2,  isDpad: false },
	{ id: 'btn-s1', labelKey: 'S1',  mask: BTN.S1,  isDpad: false },
	{ id: 'btn-s2', labelKey: 'S2',  mask: BTN.S2,  isDpad: false },
	{ id: 'btn-b4', labelKey: 'B4',  mask: BTN.B4,  isDpad: false },
	{ id: 'btn-b3', labelKey: 'B3',  mask: BTN.B3,  isDpad: false },
	{ id: 'btn-b2', labelKey: 'B2',  mask: BTN.B2,  isDpad: false },
	{ id: 'btn-b1', labelKey: 'B1',  mask: BTN.B1,  isDpad: false },
	{ id: 'btn-up',  labelKey: '',  mask: DPAD.Up,   isDpad: true, staticLabel: 'Up' },
	{ id: 'btn-down', labelKey: '', mask: DPAD.Down, isDpad: true, staticLabel: 'Down' },
	{ id: 'btn-left', labelKey: '', mask: DPAD.Left, isDpad: true, staticLabel: 'Left' },
	{ id: 'btn-right', labelKey: '', mask: DPAD.Right, isDpad: true, staticLabel: 'Right' },
	{ id: 'btn-l3',  labelKey: 'L3', mask: BTN.L3, isDpad: false, strokeW: 4, staticLabel: 'L3' },
	{ id: 'btn-r3',  labelKey: 'R3', mask: BTN.R3, isDpad: false, strokeW: 4, staticLabel: 'R3' },
];

const BTN_DEFS = Object.fromEntries(
	SVG_ELS.map((el) => [el.id, { labelKey: el.labelKey, mask: el.mask, isDpad: el.isDpad }]),
) as Record<string, { labelKey: string; mask: number; isDpad: boolean }>;

const BTN_IDS = Object.keys(BTN_DEFS);
const isBtnId = (id: string | null): id is keyof typeof BTN_DEFS =>
	id != null && BTN_IDS.includes(id);

const VIEWBOX_RE = /viewBox="([^"]+)"/;

export default function ControllerWidget({
	buttonMask,
	dpadMask,
	onMaskChange,
	buttonNames,
}: ControllerWidgetProps) {
	const svgRef = useRef<SVGSVGElement>(null);
	const [svgMarkup, setSvgMarkup] = useState('');
	const [viewBox, setViewBox] = useState('0 0 352 279.5');

	useEffect(() => {
		fetch('/images/controller.svg')
			.then((r) => r.text())
			.then((text) => {
				const match = text.match(VIEWBOX_RE);
				if (match) setViewBox(match[1]);
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
				const node = svg.getElementById(el.id);
				if (!node) continue;
				const bbox = node.getBBox();
				const cx = bbox.x + bbox.width / 2;
				const cy = bbox.y + bbox.height / 2;
				const label = el.staticLabel || buttonNames[el.labelKey] || el.labelKey;
				const text = document.createElementNS(ns, 'text');
				text.setAttribute('x', String(cx));
				text.setAttribute('y', String(cy + 1 + (el.labelDy ?? 0)));
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
				el.style.stroke = 'var(--bg-4)';
				el.style.setProperty('stroke-width', '2', 'important');
				const isBtn = el.id && isBtnId(el.id) || el.closest('[id]') && isBtnId(el.closest('[id]')?.getAttribute('id') ?? null);
				if (isBtn) {
					el.style.setProperty('cursor', 'pointer', 'important');
					el.style.setProperty('pointer-events', 'all', 'important');
				}
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

			(node as HTMLElement).style.stroke = sel ? '#00ff00' : 'var(--bg-4)';
			if (sel) {
				node.parentNode?.appendChild(node);
				(node as HTMLElement).style.setProperty('stroke-width', '3', 'important');
			} else {
				(node as HTMLElement).style.setProperty('stroke-width', '2', 'important');
			}

			const label = svg.getElementById(`label-${el.id}`);
			if (label) {
				(label as HTMLElement).style.setProperty('fill', 'currentColor', 'important');
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
			(label as HTMLElement).style.setProperty('fill', 'currentColor', 'important');
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
					viewBox={viewBox}
					xmlns="http://www.w3.org/2000/svg"
					onClick={handleSvgClick}
					dangerouslySetInnerHTML={{ __html: svgMarkup }}
				/>
			) : (
				<svg ref={svgRef} className="cgp-svg" viewBox={viewBox} />
			)}
		</div>
	);
}
