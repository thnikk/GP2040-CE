import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Tab } from '../components/ui/Tab';
import Nav from '../components/ui/Nav';
import Row from '../components/ui/Row';
import Col from '../components/ui/Col';

import PeripheralMappingPage from './PeripheralMappingPage';
import ButtonLayoutConfigPage from './ButtonLayoutConfigPage';
import LEDConfigPage from './LEDConfigPage';
import DisplayConfigPage from './DisplayConfig';
import InputMacroAddonPage from './InputMacroAddonPage';
import BackupPage from './BackupPage';
import ResetSettingsPage from './ResetSettingsPage';

import Microchip from '../Icons/Microchip';
import LayerStack from '../Icons/LayerStack';
import Lightbulb from '../Icons/Lightbulb';
import DisplayMonitor from '../Icons/DisplayMonitor';
import Lightning from '../Icons/Lightning';
import Upload from '../Icons/Upload';
import Reboot from '../Icons/Reboot';

const TABS = [
	{ key: 'peripheral-mapping', labelKey: 'Navigation:peripheral-mapping-label', Icon: Microchip },
	{ key: 'button-layout', labelKey: 'Navigation:button-layout-label', Icon: LayerStack },
	{ key: 'led-config', labelKey: 'Navigation:led-config-label', Icon: Lightbulb },
	{ key: 'display-config', labelKey: 'Navigation:display-config-label', Icon: DisplayMonitor },
	{ key: 'macro', labelKey: 'Navigation:macro-label', Icon: Lightning },
	{ key: 'backup', labelKey: 'Navigation:backup-label', Icon: Upload },
	{ key: 'reset-settings', labelKey: 'Navigation:resetSettings-label', Icon: Reboot },
];

export default function ConfigurationPage() {
	const { t } = useTranslation('');
	const [activeTab, setActiveTab] = useState(
		window.location.hash ? window.location.hash.slice(1) : 'peripheral-mapping',
	);

	useEffect(() => {
		const onHashChange = () => {
			const hash = window.location.hash.slice(1);
			if (hash && hash !== activeTab) setActiveTab(hash);
		};
		window.addEventListener('hashchange', onHashChange);
		return () => window.removeEventListener('hashchange', onHashChange);
	}, [activeTab]);

	return (
		<div>
			<div className="alert alert-danger mb-3">{t('ConfigurationPage:warning-text')}</div>
			<Tab.Container
				activeKey={activeTab}
				onSelect={(k) => {
					setActiveTab(k);
					window.location.hash = k;
				}}
			>
				<Row style={{ gap: '10px' }}>
					<Col xs="auto">
						<Nav variant="pills" className="flex-column">
							{TABS.map(({ key, labelKey, Icon }) => (
								<Nav.Item key={key}>
									<Nav.Link eventKey={key} className="nav-btn">
										<span className="d-flex align-items-center gap-2">
											<Icon />
											{t(labelKey)}
										</span>
									</Nav.Link>
								</Nav.Item>
							))}
						</Nav>
					</Col>
					<div style={{ flex: 1, minWidth: 0 }}>
						<Tab.Content>
							<Tab.Pane eventKey="peripheral-mapping">
								{activeTab === 'peripheral-mapping' && <PeripheralMappingPage />}
							</Tab.Pane>
							<Tab.Pane eventKey="button-layout">
								{activeTab === 'button-layout' && <ButtonLayoutConfigPage />}
							</Tab.Pane>
							<Tab.Pane eventKey="led-config">
								{activeTab === 'led-config' && <LEDConfigPage />}
							</Tab.Pane>
							<Tab.Pane eventKey="display-config">
								{activeTab === 'display-config' && <DisplayConfigPage />}
							</Tab.Pane>
							<Tab.Pane eventKey="macro">
								{activeTab === 'macro' && <InputMacroAddonPage />}
							</Tab.Pane>
							<Tab.Pane eventKey="backup">
								{activeTab === 'backup' && <BackupPage />}
							</Tab.Pane>
							<Tab.Pane eventKey="reset-settings">
								{activeTab === 'reset-settings' && <ResetSettingsPage />}
							</Tab.Pane>
						</Tab.Content>
					</div>
				</Row>
			</Tab.Container>
		</div>
	);
}
