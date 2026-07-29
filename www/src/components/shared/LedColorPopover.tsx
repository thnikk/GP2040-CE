import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type LedColorPopoverProps = {
	show: boolean;
	onHide: () => void;
	triggerRect: DOMRect | null;
	buttonName: string;
	normalColor: string;
	pressedColor: string;
	onColorChange: (buttonName: string, colors: { normal: string; pressed: string }) => void;
};

const POPOVER_GAP = 10;

const LedColorPopover = ({
	show, onHide, triggerRect, buttonName,
	normalColor, pressedColor, onColorChange,
}: LedColorPopoverProps) => {
	const { t } = useTranslation('');
	const ref = useRef<HTMLDivElement>(null);
	const [pos, setPos] = useState({ top: -9999, left: -9999 });
	const [arrowUp, setArrowUp] = useState(false);

	useEffect(() => {
		if (!show) return;
		const handleClickOutside = (e: MouseEvent) => {
			if ((e.target as Element).closest('[id^="led-"]')) return;
			if (ref.current && !ref.current.contains(e.target as Node)) {
				onHide();
			}
		};
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onHide();
		};
		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleEscape);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		};
	}, [show, onHide]);

	useLayoutEffect(() => {
		if (!show || !triggerRect || !ref.current) return;

		const updatePosition = () => {
			const popover = ref.current;
			if (!popover || !triggerRect) return;

			const pw = popover.offsetWidth;
			const ph = popover.offsetHeight;
			const vw = window.innerWidth;

			let left = triggerRect.left + triggerRect.width / 2 - pw / 2;
			let top = triggerRect.top - ph - POPOVER_GAP;

			left = Math.max(POPOVER_GAP, Math.min(left, vw - pw - POPOVER_GAP));

			const wouldFlip = top < POPOVER_GAP;
			if (wouldFlip) {
				top = triggerRect.bottom + POPOVER_GAP;
			}
			setArrowUp(wouldFlip);

			const arrowOffset = triggerRect.left + triggerRect.width / 2 - left;
			setPos({ top, left });
			popover.style.setProperty('--arrow-left', `${arrowOffset}px`);
		};

		updatePosition();
		window.addEventListener('scroll', updatePosition, true);
		window.addEventListener('resize', updatePosition);

		return () => {
			window.removeEventListener('scroll', updatePosition, true);
			window.removeEventListener('resize', updatePosition);
		};
	}, [show, triggerRect]);

	if (!show || !triggerRect) return null;

	return (
		<div
			className={`led-popover${arrowUp ? ' arrow-up' : ''}`}
			ref={ref}
			style={{ top: pos.top, left: pos.left }}
		>
			<div className="led-popover-body">
				<div style={{ position: 'relative' }}>
					<button type="button" className="led-color-btn" tabIndex={-1}>
						<span
							className="led-color-circle"
							style={{ backgroundColor: normalColor }}
						/>
						<span>{t('CustomTheme:normal-label')}</span>
					</button>
					<input
						type="color"
						value={normalColor}
						onChange={(e) => onColorChange(buttonName, { normal: e.target.value, pressed: pressedColor })}
						style={{
							position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer',
						}}
					/>
				</div>
				<div style={{ position: 'relative' }}>
					<button type="button" className="led-color-btn" tabIndex={-1}>
						<span
							className="led-color-circle"
							style={{ backgroundColor: pressedColor }}
						/>
						<span>{t('CustomTheme:pressed-label')}</span>
					</button>
					<input
						type="color"
						value={pressedColor}
						onChange={(e) => onColorChange(buttonName, { normal: normalColor, pressed: e.target.value })}
						style={{
							position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer',
						}}
					/>
				</div>
			</div>
		</div>
	);
};

export default LedColorPopover;
