import { useEffect, useState } from 'react';

const BOARD_SVG_ENABLED = import.meta.env.VITE_GP2040_BOARD_HAS_SVG === 'true';

type PinElement = {
	id: string;
	pinNumber: number;
};

type BoardSVGState = {
	svgContent: string | null;
	loading: boolean;
	error: string | null;
	pinElements: PinElement[];
	svgMode: boolean;
};

const PIN_RE = /^pin(\d+)$/;

function parseSvg(svgText: string): { pinElements: PinElement[] } {
	const parser = new DOMParser();
	const doc = parser.parseFromString(svgText, 'image/svg+xml');
	const allElements = doc.querySelectorAll('[id]');
	const pins: PinElement[] = [];

	allElements.forEach((el) => {
		const match = el.id.match(PIN_RE);
		if (match) {
			pins.push({ id: el.id, pinNumber: parseInt(match[1], 10) });
		}
	});

	pins.sort((a, b) => a.pinNumber - b.pinNumber);
	return { pinElements: pins };
}

let cachedState: BoardSVGState | null = null;

export function useBoardSVG() {
	const [state, setState] = useState<BoardSVGState>(() => {
		if (cachedState) return cachedState;
		return {
			svgContent: null,
			loading: true,
			error: null,
			pinElements: [],
			svgMode: BOARD_SVG_ENABLED,
		};
	});

	useEffect(() => {
		if (cachedState) {
			setState(cachedState);
			return;
		}

		if (!BOARD_SVG_ENABLED) {
			const result: BoardSVGState = {
				svgContent: null,
				loading: false,
				error: null,
				pinElements: [],
				svgMode: false,
			};
			cachedState = result;
			setState(result);
			return;
		}

		let cancelled = false;

		async function load() {
			try {
				const resp = await fetch('/boards/board.svg');
				if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

				const svgText = await resp.text();
				if (cancelled) return;

				const { pinElements } = parseSvg(svgText);
				const result: BoardSVGState = {
					svgContent: svgText,
					loading: false,
					error: null,
					pinElements,
					svgMode: true,
				};
				cachedState = result;
				setState(result);
			} catch {
				if (cancelled) return;

				try {
					const resp = await fetch('/boards/_default.svg');
					if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
					const svgText = await resp.text();
					if (cancelled) return;

					const { pinElements } = parseSvg(svgText);
					const result: BoardSVGState = {
						svgContent: svgText,
						loading: false,
						error: null,
						pinElements,
						svgMode: true,
					};
					cachedState = result;
					setState(result);
				} catch {
					if (cancelled) return;
					const result: BoardSVGState = {
						svgContent: null,
						loading: false,
						error: 'No SVG available for this board',
						pinElements: [],
						svgMode: true,
					};
					cachedState = result;
					setState(result);
				}
			}
		}

		load();
		return () => { cancelled = true; };
	}, []);

	return state;
}
