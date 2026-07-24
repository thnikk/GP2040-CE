import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

type OffcanvasProps = {
	show: boolean;
	onHide?: () => void;
	placement?: 'start' | 'end' | 'top' | 'bottom';
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const OffcanvasHeader = ({
	closeButton,
	children,
	onHide,
	className = '',
}: {
	closeButton?: boolean;
	children?: React.ReactNode;
	onHide?: () => void;
	className?: string;
}) => (
	<div className={`offcanvas-header ${className}`}>
		{children}
		{closeButton && (
			<button type="button" className="btn-close" onClick={onHide}>
				&times;
			</button>
		)}
	</div>
);

const OffcanvasTitle = ({
	children,
	className = '',
}: {
	children?: React.ReactNode;
	className?: string;
}) => <div className={`offcanvas-title ${className}`}>{children}</div>;

const OffcanvasBody = ({
	children,
	className = '',
}: {
	children?: React.ReactNode;
	className?: string;
}) => <div className={`offcanvas-body ${className}`}>{children}</div>;

const Offcanvas = ({ show, onHide, className = '', children, ...props }: OffcanvasProps) => {
	void props; // placement handled by CSS
	useEffect(() => {
		if (show) {
			document.body.style.overflow = 'hidden';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [show]);

	if (!show) return null;

	const enhancedChildren = React.Children.map(children, (child) => {
		if (React.isValidElement(child) && child.type === OffcanvasHeader) {
			return React.cloneElement(child as React.ReactElement<{ onHide?: () => void }>, { onHide });
		}
		return child;
	});

	return createPortal(
		<>
			<div className="offcanvas-overlay" onClick={onHide} />
			<div className={`offcanvas show ${className}`} role="dialog">
				{enhancedChildren}
			</div>
		</>,
		document.body,
	);
};

Offcanvas.Header = OffcanvasHeader;
Offcanvas.Title = OffcanvasTitle;
Offcanvas.Body = OffcanvasBody;

export default Offcanvas;
