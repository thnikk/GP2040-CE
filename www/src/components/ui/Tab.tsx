import React, { createContext, useContext } from 'react';

type TabContextType = {
	activeKey?: string;
	onSelect?: (key: string) => void;
};

export const TabContext = createContext<TabContextType>({});

type TabsProps = {
	className?: string;
	children?: React.ReactNode;
	activeKey?: string;
	onSelect?: (key: string | null) => void;
	[key: string]: unknown;
};

type TabProps = {
	eventKey: string;
	title: string;
	className?: string;
	children?: React.ReactNode;
};

type TabContainerProps = {
	activeKey?: string;
	onSelect?: (key: string) => void;
	children?: React.ReactNode;
	[key: string]: unknown;
};

type TabContentProps = {
	children?: React.ReactNode;
	[key: string]: unknown;
};

type TabPaneProps = {
	eventKey: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const TabContainer = ({ activeKey, onSelect, children }: TabContainerProps) => (
	<TabContext.Provider value={{ activeKey, onSelect }}>{children}</TabContext.Provider>
);

const TabContent = ({ children, ...props }: TabContentProps) => (
	<div className="tab-content" {...props}>
		{children}
	</div>
);

const TabPane = ({ eventKey, children, ...props }: TabPaneProps) => {
	const { activeKey } = useContext(TabContext);
	const isActive = activeKey === eventKey;
	return (
		<div className={`tab-pane${isActive ? ' active' : ''}`} role="tabpanel" {...props}>
			{children}
		</div>
	);
};

const Tabs = ({ className = '', children, activeKey, onSelect, ...props }: TabsProps) => {
	const tabs: React.ReactNode[] = [];
	const panes: React.ReactNode[] = [];

	React.Children.forEach(children, (child) => {
		if (React.isValidElement<TabProps>(child) && child.type === Tab) {
			const { eventKey: key, title } = child.props;
			const isActive = activeKey === key;
			tabs.push(
				<button
					key={`tab-${key}`}
					type="button"
					className={`nav-link${isActive ? ' active' : ''}`}
					onClick={() => onSelect?.(key)}
				>
					{title}
				</button>,
			);
			panes.push(
				<div key={`pane-${key}`} className={`tab-pane${isActive ? ' active' : ''}`}>
					{child.props.children}
				</div>,
			);
		}
	});

	return (
		<div {...props}>
			<nav className={`nav nav-tabs ${className}`}>{tabs}</nav>
			<div className="tab-content">{panes}</div>
		</div>
	);
};

const Tab = ({ children }: TabProps) => <>{children}</>;

Tab.Container = TabContainer;
Tab.Content = TabContent;
Tab.Pane = TabPane;

Tabs.displayName = 'Tabs';
Tab.displayName = 'Tab';

export { Tabs, Tab };
