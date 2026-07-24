import React, { useState } from 'react';

type NavbarProps = {
	collapseOnSelect?: boolean;
	expand?: string;
	fixed?: string;
	className?: string;
	children?: React.ReactNode;
};

const NavbarBrand = ({
	title,
	children,
	className = '',
}: {
	title?: string;
	children?: React.ReactNode;
	className?: string;
}) => (
	<div className={`navbar-brand ${className}`} title={title}>
		{children}
	</div>
);

const NavbarToggle = ({
	onClick,
}: {
	onClick?: () => void;
}) => (
	<button type="button" className="navbar-toggler" onClick={onClick}>
		<svg viewBox="0 0 30 30" width="22" height="22" fill="currentColor">
			<path d="M4 7h22M4 15h22M4 23h22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	</button>
);

const NavbarCollapse = ({
	children,
	className = '',
}: {
	children?: React.ReactNode;
	className?: string;
}) => <div className={`navbar-collapse ${className}`}>{children}</div>;

const Navbar = ({ fixed, className = '', children, ...props }: NavbarProps) => {
	void props; // collapseOnSelect, expand handled internally
	const [expanded, setExpanded] = useState(false);

	const enhancedChildren = React.Children.map(children, (child) => {
		if (React.isValidElement(child) && (child.type === NavbarCollapse || child.type === 'div' && child.props.className?.includes('navbar-collapse'))) {
			return React.cloneElement(child as React.ReactElement<{ className?: string }>, {
				className: `${child.props.className || ''}${expanded ? ' show' : ''}`,
			});
		}
		return child;
	});

	return (
		<nav className={`navbar${fixed === 'top' ? ' fixed-top' : ''} ${className}`}>
			<div className="container-lg">
				{React.Children.map(enhancedChildren, (child) => {
					if (React.isValidElement(child) && child.type === NavbarToggle) {
						return React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
							onClick: () => setExpanded(!expanded),
						});
					}
					return child;
				})}
			</div>
		</nav>
	);
};

Navbar.Brand = NavbarBrand;
Navbar.Toggle = NavbarToggle;
Navbar.Collapse = NavbarCollapse;

export default Navbar;
