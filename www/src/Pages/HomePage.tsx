import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { isNewerVersion } from '../Services/Utilities';
import useSystemStats from '../Store/useSystemStats';
import Section from '../components/shared/Section';
import Gamepad from '../Icons/Gamepad';
import Hand from '../Icons/Hand';
import Etsy from '../Icons/Etsy';
import GitHub from '../Icons/GitHub';
import Site from '../Icons/Site';
import Book from '../Icons/Book';
import Flask from '../Icons/Flask';
import Gear from '../Icons/Gear';

export default function HomePage() {
	const { t } = useTranslation('');
	const {
		latestVersion,
		latestDownloadUrl,
		currentVersion,
		showConfigButton,
		boardName,
	} = useSystemStats();

	const updateAvailable =
		latestVersion &&
		currentVersion?.split('-').length === 1 &&
		isNewerVersion(latestVersion, currentVersion);

	return (
		<Section
			heading
			icon={<Hand />}
			title={t('HomePage:welcome-heading-text')}
			description={t('HomePage:welcome-description-text', {
				boardName,
			})}
		>
			<div className="d-flex flex-column gap-2">
				<NavLink to="/layout" className="btn btn-secondary w-100 justify-content-start gap-3">
					<Gamepad style={{ width: '1em', height: '1em', flexShrink: 0 }} />
					<span className="fw-semibold">{t('Navigation:layout-label')}</span>
					<span className="text-muted">{t('HomePage:layout-card-text')}</span>
				</NavLink>
				<NavLink to="/settings" className="btn btn-secondary w-100 justify-content-start gap-3">
					<Gear style={{ width: '1em', height: '1em', flexShrink: 0 }} />
					<span className="fw-semibold">{t('Navigation:settings-label')}</span>
					<span className="text-muted">{t('HomePage:settings-card-text')}</span>
				</NavLink>
				{showConfigButton && (
					<NavLink to="/configuration" className="btn btn-secondary w-100 justify-content-start gap-3">
						<Flask style={{ width: '1em', height: '1em', flexShrink: 0 }} />
						<span className="fw-semibold">{t('Navigation:config-label')}</span>
						<span className="text-muted">{t('HomePage:config-card-text')}</span>
					</NavLink>
				)}
				<a
					href="https://github.com/thnikk/GP2040-th"
					target="_blank"
					rel="noreferrer"
					className="btn btn-secondary w-100 justify-content-start gap-3"
				>
					<GitHub style={{ width: '1em', height: '1em', flexShrink: 0 }} />
					<span className="fw-semibold">{t('HomePage:github-card-label')}</span>
					<span className="text-muted">{t('HomePage:github-card-text')}</span>
				</a>
				<a
					href="https://www.thnikk.moe/"
					target="_blank"
					rel="noreferrer"
					className="btn btn-secondary w-100 justify-content-start gap-3"
				>
					<Site style={{ width: '1em', height: '1em', flexShrink: 0 }} />
					<span className="fw-semibold">{t('HomePage:site-card-label')}</span>
					<span className="text-muted">{t('HomePage:site-card-text')}</span>
				</a>
				<a
					href="https://docs.thnikk.moe/"
					target="_blank"
					rel="noreferrer"
					className="btn btn-secondary w-100 justify-content-start gap-3"
				>
					<Book style={{ width: '1em', height: '1em', flexShrink: 0 }} />
					<span className="fw-semibold">{t('HomePage:docs-card-label')}</span>
					<span className="text-muted">{t('HomePage:docs-card-text')}</span>
				</a>
				<a
					href="https://www.etsy.com/shop/thnikk"
					target="_blank"
					rel="noreferrer"
					className="btn btn-secondary w-100 justify-content-start gap-3"
				>
					<Etsy style={{ width: '1em', height: '1em', flexShrink: 0 }} />
					<span className="fw-semibold">{t('HomePage:etsy-card-label')}</span>
					<span className="text-muted">{t('HomePage:etsy-card-text')}</span>
				</a>
				{updateAvailable && (
					<div className="card border-primary mt-2">
						<div className="card-body d-flex align-items-center justify-content-between gap-3">
							<div>
								<div className="fw-semibold">{t('HomePage:update-available-text')}</div>
								<small className="text-muted">
									{t('HomePage:update-available-description-text', {
										version: latestVersion,
									})}
								</small>
							</div>
							<a
								target="_blank"
								rel="noreferrer"
								href={latestDownloadUrl}
								className="btn btn-primary text-nowrap"
							>
								{t('HomePage:get-update-text')}
							</a>
						</div>
					</div>
				)}
			</div>
		</Section>
	);
}
