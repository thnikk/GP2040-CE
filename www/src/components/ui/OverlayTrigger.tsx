import React, { useState, useRef } from 'react';

type TooltipProps = {
	children?: React.ReactNode;
	[key: string]: unknown;
};

type OverlayTriggerProps = {
	placement?: 'top' | 'bottom' | 'left' | 'right';
	overlay: React.ReactElement<TooltipProps>;
	children: React.ReactElement;
};

const Tooltip = ({ children, ...props }: TooltipProps) => (
	<div className="tooltip" role="tooltip" {...props}>
		<div className="tooltip-inner">{children}</div>
	</div>
);

const OverlayTrigger = ({ overlay, children }: OverlayTriggerProps) => {
	const [show, setShow] = useState(false);
	const triggerRef = useRef<HTMLElement>(null);

	const handleMouseEnter = () => setShow(true);
	const handleMouseLeave = () => setShow(false);

	return (
		<>
			{React.cloneElement(children, {
				onMouseEnter: handleMouseEnter,
				onMouseLeave: handleMouseLeave,
				ref: triggerRef,
			})}
			{show && overlay}
		</>
	);
};

OverlayTrigger.displayName = 'OverlayTrigger';
Tooltip.displayName = 'Tooltip';

export { OverlayTrigger, Tooltip };
