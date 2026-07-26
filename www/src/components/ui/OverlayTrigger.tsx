import React, { useState, useRef } from 'react';

type TooltipProps = {
	children?: React.ReactNode;
	[key: string]: unknown;
};

type OverlayTriggerProps = {
	placement?: 'top' | 'bottom' | 'left' | 'right';
	overlay: React.ReactElement<TooltipProps>;
	children: React.ReactElement;
	show?: boolean;
};

const Tooltip = ({ children, className = '', ...props }: TooltipProps) => (
	<div className={`tooltip ${className}`} role="tooltip" {...props}>
		<div className="tooltip-inner">{children}</div>
	</div>
);

const OverlayTrigger = ({ overlay, children, show: showProp, placement = 'top' }: OverlayTriggerProps) => {
	const [show, setShow] = useState(false);
	const triggerRef = useRef<HTMLElement>(null);

	const handleMouseEnter = () => {
		if (showProp === undefined) setShow(true);
	};
	const handleMouseLeave = () => {
		if (showProp === undefined) setShow(false);
	};

	const visible = showProp !== undefined ? showProp : show;

	const placementStyle = () => {
		switch (placement) {
			case 'bottom':
				return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '0.25rem' };
			case 'top':
				return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '0.25rem' };
			case 'left':
				return { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '0.25rem' };
			case 'right':
				return { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '0.25rem' };
		}
	};

	return (
		<div style={{ position: 'relative', width: '100%' }}>
			{React.cloneElement(children, {
				onMouseEnter: handleMouseEnter,
				onMouseLeave: handleMouseLeave,
				ref: triggerRef,
			})}
			{visible && (
				<div style={{ position: 'absolute', zIndex: 1080, ...placementStyle() }}>
					{overlay}
				</div>
			)}
		</div>
	);
};

OverlayTrigger.displayName = 'OverlayTrigger';
Tooltip.displayName = 'Tooltip';

export { OverlayTrigger, Tooltip };
