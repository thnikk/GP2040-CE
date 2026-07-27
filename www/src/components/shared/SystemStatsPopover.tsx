import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isNewerVersion } from '../../Services/Utilities';
import useSystemStats from '../../Store/useSystemStats';
import ProgressBar from '../ui/ProgressBar';

type SystemStatsPopoverProps = {
	show: boolean;
	onHide: () => void;
	triggerRef?: React.RefObject<HTMLElement>;
};

const SystemStatsPopover = ({ show, onHide, triggerRef }: SystemStatsPopoverProps) => {
	const { t } = useTranslation('');
	const {
		latestVersion,
		latestDownloadUrl,
		currentVersion,
		boardConfigProperties,
		memoryReport,
		loaded,
	} = useSystemStats();
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				triggerRef?.current?.contains(e.target as Node)
			) return;
			if (ref.current && !ref.current.contains(e.target as Node)) {
				onHide();
			}
		};
		if (show) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [show, onHide, triggerRef]);

	if (!show) return null;

	return (
		<div className="footer-popover" ref={ref}>
			<div className="footer-popover-body">
				{loaded ? (
					<>
						<strong className="system-text">{t('HomePage:version-text')}</strong>
						<div className="system-text">{`${boardConfigProperties.label} (${boardConfigProperties.fileName}.uf2)`}</div>
						<div className="system-text d-flex align-items-center">
							<span>{t('HomePage:current-text', { version: currentVersion })}</span>
							{latestVersion && isNewerVersion(currentVersion, latestVersion) && (
								<span className="badge bg-info ms-2">{t('HomePage:pre-release-badge-text')}</span>
							)}
						</div>
						<div className="system-text">
							{t('HomePage:latest-text', { version: latestVersion })}
						</div>
						{latestVersion &&
							currentVersion?.split('-').length == 1 &&
							isNewerVersion(latestVersion, currentVersion) && (
								<div>
									<a
										target="_blank"
										rel="noreferrer"
										href={latestDownloadUrl}
										className="btn btn-primary btn-sm"
									>
										{t('HomePage:get-update-text')}
									</a>
								</div>
							)}

						<strong className="system-text">
							{t('HomePage:memory-header-text')}
						</strong>
						<div className="system-text">
							{t('HomePage:memory-flash-text')}: {memoryReport.usedFlash} /{' '}
							{memoryReport.totalFlash} ({memoryReport.percentageFlash}%)
						</div>
						<div className="system-text">
							{t('HomePage:memory-heap-text')}: {memoryReport.usedHeap} /{' '}
							{memoryReport.totalHeap} ({memoryReport.percentageHeap}%)
						</div>
						<div className="system-text">
							{t('HomePage:memory-static-allocations-text')}:{' '}
							{memoryReport.staticAllocs}
						</div>
						<div>
							{t('HomePage:memory-board-text')}: {memoryReport.physicalFlash}
						</div>

						<ProgressBar
							className="system-text"
							now={memoryReport.percentageFlash}
							label={`${t('HomePage:memory-flash-text')} ${
								memoryReport.percentageFlash
							}%`}
						/>
						<ProgressBar
							className="system-text"
							now={memoryReport.percentageHeap}
							label={`${t('HomePage:memory-heap-text')} ${
								memoryReport.percentageHeap
							}%`}
						/>
					</>
				) : (
					<span className="text-muted">{t('Common:loading-text')}</span>
				)}
			</div>
		</div>
	);
};

export default SystemStatsPopover;
