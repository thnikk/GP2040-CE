import React, { useContext } from 'react';
import { TabContext } from './Tab';

type NavProps = {
	variant?: 'pills' | 'tabs';
	className?: string;
	activeKey?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const Nav = ({ variant, className = '', children, ...props }: NavProps) => {
	const { activeKey, ...rest } = props as Record<string, unknown>;
	return (
		<nav className={`nav${variant === 'pills' ? ' nav-pills' : variant === 'tabs' ? ' nav-tabs' : ''} ${className}`} {...rest}>
			{children}
		</nav>
	);
};

type NavItemProps = {
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const NavItem = ({ className = '', children, ...props }: NavItemProps) => (
	<div className={`nav-item ${className}`} {...props}>
		{children}
	</div>
);

type NavLinkProps = {
	as?: React.ElementType;
	to?: string;
	eventKey?: string;
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const NavLink = ({ as: Component = 'a', to, eventKey, className = '', children, ...props }: NavLinkProps) => {
	const tab = useContext(TabContext);
	const handleClick = (e: React.MouseEvent) => {
		if (eventKey && tab.onSelect) {
			e.preventDefault();
			tab.onSelect(eventKey);
		}
	};
	return (
		<Component className={`nav-link ${className}`} {...(to ? { to } : {})} onClick={handleClick} {...props}>
			{children}
		</Component>
	);
};

Nav.Item = NavItem;
Nav.Link = NavLink;

export default Nav;
