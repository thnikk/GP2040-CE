import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { isNewerVersion } from '../Services/Utilities';
import useSystemStats from '../Store/useSystemStats';
import Section from '../components/shared/Section';
import Gamepad from '../Icons/Gamepad';
import Etsy from '../Icons/Etsy';
import GitHub from '../Icons/GitHub';

const GearIcon = () => (
	<svg viewBox="0 0 512 512" fill="currentColor" style={{ width: '1em', height: '1em', flexShrink: 0 }}>
		<path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c5.9 7.2 11.3 14.5 16.4 22.5zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z" />
	</svg>
);

const FlaskIcon = () => (
	<svg viewBox="0 0 448 512" fill="currentColor" style={{ width: '1em', height: '1em', flexShrink: 0 }}>
		<path d="M288 0L160 0 128 0C110.3 0 96 14.3 96 32s14.3 32 32 32l0 132.8c0 11.8-3.3 23.5-9.5 33.5L10.3 406.2C3.6 417.2 0 429.7 0 442.6C0 480.9 31.1 512 69.4 512l309.2 0c38.3 0 69.4-31.1 69.4-69.4c0-12.8-3.6-25.4-10.3-36.4L329.5 230.4c-6.2-10.1-9.5-21.7-9.5-33.5L320 64c17.7 0 32-14.3 32-32s-14.3-32-32-32L288 0zM192 196.8L192 64l64 0 0 132.8c0 23.7 6.6 46.9 19 67.1L309.5 320l-171 0L173 263.9c12.4-20.2 19-43.4 19-67.1z" />
	</svg>
);

export default function HomePage() {
	const { t } = useTranslation('');
	const {
		latestVersion,
		latestDownloadUrl,
		currentVersion,
		showConfigButton,
		boardConfigProperties,
	} = useSystemStats();

	const updateAvailable =
		latestVersion &&
		currentVersion?.split('-').length === 1 &&
		isNewerVersion(latestVersion, currentVersion);

	return (
		<Section
			heading
			title={t('HomePage:welcome-heading-text')}
			description={t('HomePage:welcome-description-text', {
				boardName: boardConfigProperties.label,
			})}
		>
			<div className="d-flex flex-column gap-2">
				<NavLink to="/layout" className="btn btn-secondary w-100 justify-content-start gap-3">
					<Gamepad style={{ width: '1em', height: '1em', flexShrink: 0 }} />
					<span className="fw-semibold">{t('Navigation:layout-label')}</span>
					<span className="text-muted">{t('HomePage:layout-card-text')}</span>
				</NavLink>
				<NavLink to="/settings" className="btn btn-secondary w-100 justify-content-start gap-3">
					<GearIcon />
					<span className="fw-semibold">{t('Navigation:settings-label')}</span>
					<span className="text-muted">{t('HomePage:settings-card-text')}</span>
				</NavLink>
				{showConfigButton && (
					<NavLink to="/configuration" className="btn btn-secondary w-100 justify-content-start gap-3">
						<FlaskIcon />
						<span className="fw-semibold">{t('Navigation:config-label')}</span>
						<span className="text-muted">{t('HomePage:config-card-text')}</span>
					</NavLink>
				)}
				<a
					href="https://github.com/thnikk/GP2040-CE"
					target="_blank"
					rel="noreferrer"
					className="btn btn-secondary w-100 justify-content-start gap-3"
				>
					<GitHub style={{ width: '1em', height: '1em', flexShrink: 0 }} />
					<span className="fw-semibold">{t('HomePage:github-card-label')}</span>
					<span className="text-muted">{t('HomePage:github-card-text')}</span>
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
