import React, { useState, useRef, useEffect } from 'react';

type DropdownButtonProps = {
	variant?: string;
	title: React.ReactNode;
	align?: string;
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

type DropdownItemProps = {
	as?: React.ElementType;
	to?: string;
	className?: string;
	children?: React.ReactNode;
	onClick?: () => void;
	[key: string]: unknown;
};

const DropdownItem = ({
	as: Component = 'button',
	to,
	className = '',
	children,
	onClick,
	...props
}: DropdownItemProps) => (
	<Component
		className={`dropdown-item ${className}`}
		{...(to ? { to } : {})}
		{...(onClick ? { onClick } : {})}
		{...props}
	>
		{children}
	</Component>
);

const DropdownButton = ({
	variant = 'secondary',
	title,
	className = '',
	children,
	...props
}: DropdownButtonProps) => {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div className={`dropdown ${className}`} ref={ref} {...props}>
			<button
				type="button"
				className={`btn btn-${variant} dropdown-toggle`}
				onClick={() => setOpen(!open)}
			>
				{title}
			</button>
			<div className={`dropdown-menu${open ? ' show' : ''}`}>
				{React.Children.map(children, (child) => {
					if (React.isValidElement(child) && child.type === DropdownItem) {
						return React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
							onClick: () => {
								setOpen(false);
								child.props.onClick?.();
							},
						});
					}
					return child;
				})}
			</div>
		</div>
	);
};

DropdownButton.displayName = 'DropdownButton';
DropdownItem.displayName = 'DropdownItem';

DropdownButton.Item = DropdownItem;

const Dropdown = DropdownButton;

export { Dropdown, DropdownButton, DropdownItem };
