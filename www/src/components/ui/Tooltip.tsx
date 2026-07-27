import React, { useState, useRef, useLayoutEffect } from 'react';

const Tooltip = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
	const isValidation = className.includes('tooltip-validation');
	return (
		<div className={`tooltip-popup${isValidation ? ' danger' : ''}`}>
			{children}
		</div>
	);
};

type TooltipTriggerProps = {
	content: React.ReactNode;
	placement?: 'top' | 'bottom' | 'left' | 'right';
	show?: boolean;
	children: React.ReactElement;
};

const TooltipTrigger = ({ content, placement = 'bottom', show: showProp, children }: TooltipTriggerProps) => {
	const [show, setShow] = useState(false);
	const [pos, setPos] = useState({ top: -9999, left: -9999 });
	const triggerRef = useRef<HTMLElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);

	const handleMouseEnter = () => {
		if (showProp === undefined) setShow(true);
	};
	const handleMouseLeave = () => {
		if (showProp === undefined) setShow(false);
	};

	const visible = showProp !== undefined ? showProp : show;

	useLayoutEffect(() => {
		if (!visible || !triggerRef.current || !tooltipRef.current) return;

		const trigger = triggerRef.current;
		const tooltip = tooltipRef.current;
		const tr = trigger.getBoundingClientRect();
		const tt = tooltip.getBoundingClientRect();
		const gap = 4;
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		let top: number, left: number;

		switch (placement) {
			case 'top':
				top = tr.top - tt.height - gap;
				left = tr.left + (tr.width - tt.width) / 2;
				break;
			case 'bottom':
				top = tr.bottom + gap;
				left = tr.left + (tr.width - tt.width) / 2;
				break;
			case 'left':
				top = tr.top + (tr.height - tt.height) / 2;
				left = tr.left - tt.width - gap;
				break;
			case 'right':
				top = tr.top + (tr.height - tt.height) / 2;
				left = tr.right + gap;
				break;
		}

		top = Math.max(gap, Math.min(top, vh - tt.height - gap));
		left = Math.max(gap, Math.min(left, vw - tt.width - gap));

		setPos({ top, left });
	}, [visible, placement]);

	return (
		<>
		<span
				ref={triggerRef}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				style={{ display: 'inline-flex' }}
			>
				{children}
			</span>
			{visible && (
				<div ref={tooltipRef} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 1080 }}>
					{content}
				</div>
			)}
		</>
	);
};

export { Tooltip, TooltipTrigger };
