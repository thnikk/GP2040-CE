import React, { createContext, useContext, useState, useEffect } from 'react';

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
	defaultActiveKey?: string;
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

const TabContainer = ({ activeKey: controlledKey, defaultActiveKey, onSelect, children }: TabContainerProps) => {
	const hashKey = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
	const [internalKey, setInternalKey] = useState(hashKey || defaultActiveKey);

	useEffect(() => {
		const onHashChange = () => {
			const newHash = window.location.hash.replace('#', '');
			if (newHash && !controlledKey) setInternalKey(newHash);
		};
		window.addEventListener('hashchange', onHashChange);
		return () => window.removeEventListener('hashchange', onHashChange);
	}, [controlledKey]);

	const activeKey = controlledKey ?? internalKey;
	const handleSelect = (key: string) => {
		if (!controlledKey) {
			setInternalKey(key);
			window.location.hash = key;
		}
		onSelect?.(key);
	};
	return (
		<TabContext.Provider value={{ activeKey, onSelect: handleSelect }}>
			{children}
		</TabContext.Provider>
	);
};

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

const Tabs = ({ className = '', children, activeKey: controlledKey, onSelect, defaultActiveKey, fill, ...props }: TabsProps) => {
	void fill;
	const hashKey = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
	const [internalKey, setInternalKey] = useState(hashKey || defaultActiveKey);

	useEffect(() => {
		const onHashChange = () => {
			const newHash = window.location.hash.replace('#', '');
			if (newHash && !controlledKey) setInternalKey(newHash);
		};
		window.addEventListener('hashchange', onHashChange);
		return () => window.removeEventListener('hashchange', onHashChange);
	}, [controlledKey]);

	const activeKey = controlledKey ?? internalKey;
	const handleSelect = (key: string) => {
		if (!controlledKey) {
			setInternalKey(key);
			window.location.hash = key;
		}
		onSelect?.(key);
	};
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
					onClick={() => handleSelect(key)}
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
