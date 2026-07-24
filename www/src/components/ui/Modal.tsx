import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

type ModalSize = 'sm' | 'lg' | 'xl';

type ModalProps = {
	show: boolean;
	onHide?: () => void;
	centered?: boolean;
	size?: ModalSize;
	className?: string;
	children?: React.ReactNode;
};

const ModalHeader = ({
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
	<div className={`modal-header ${className}`}>
		{children}
		{closeButton && (
			<button type="button" className="btn-close" onClick={onHide}>
				&times;
			</button>
		)}
	</div>
);

const ModalTitle = ({
	children,
	className = '',
}: {
	children?: React.ReactNode;
	className?: string;
}) => <div className={`modal-title ${className}`}>{children}</div>;

const ModalBody = ({
	children,
	className = '',
}: {
	children?: React.ReactNode;
	className?: string;
}) => <div className={`modal-body ${className}`}>{children}</div>;

const ModalFooter = ({
	children,
	className = '',
}: {
	children?: React.ReactNode;
	className?: string;
}) => <div className={`modal-footer ${className}`}>{children}</div>;

const Modal = ({ show, onHide, size, className = '', children, ...props }: ModalProps) => {
	void props; // centered and other props handled by CSS
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === 'Escape' && onHide) onHide();
		},
		[onHide],
	);

	useEffect(() => {
		if (show) {
			document.addEventListener('keydown', handleKeyDown);
			document.body.style.overflow = 'hidden';
		}
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			document.body.style.overflow = '';
		};
	}, [show, handleKeyDown]);

	if (!show) return null;

	const sizeClass = size === 'lg' ? ' modal-dialog-lg' : size === 'xl' ? ' modal-dialog-xl' : '';

	const enhancedChildren = React.Children.map(children, (child) => {
		if (React.isValidElement(child) && (child.type === ModalHeader || child.type === ModalFooter)) {
			return React.cloneElement(child as React.ReactElement<{ onHide?: () => void }>, { onHide });
		}
		return child;
	});

	return createPortal(
		<div className={`modal-overlay ${className}`} onClick={onHide}>
			<div
				className={`modal-dialog${sizeClass}`}
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
			>
				<div className="modal-content">{enhancedChildren}</div>
			</div>
		</div>,
		document.body,
	);
};

Modal.Header = ModalHeader;
Modal.Title = ModalTitle;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;
