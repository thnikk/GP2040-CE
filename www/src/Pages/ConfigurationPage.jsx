import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Section from '../Components/Section';

const configLinks = [
	{ to: '/peripheral-mapping', labelKey: 'Navigation:peripheral-mapping-label' },
	{ to: '/button-layout', labelKey: 'Navigation:button-layout-label' },
	{ to: '/led-config', labelKey: 'Navigation:led-config-label' },
	{ to: '/display-config', labelKey: 'Navigation:display-config-label' },
	{ to: '/add-ons', labelKey: 'Navigation:add-ons-label' },
	{ to: '/macro', labelKey: 'Navigation:macro-label' },
	{ to: '/backup', labelKey: 'Navigation:backup-label' },
	{ to: '/reset-settings', labelKey: 'Navigation:resetSettings-label' },
];

export default function ConfigurationPage() {
	const { t } = useTranslation('');

	return (
		<Section title={t('Navigation:config-label')}>
			<div className="alert alert-danger">{t('ConfigurationPage:warning-text')}</div>
			<div className="d-flex flex-column gap-2">
				{configLinks.map((link) => (
					<NavLink key={link.to} to={link.to} className="btn btn-secondary">
						{t(link.labelKey)}
					</NavLink>
				))}
			</div>
		</Section>
	);
}
