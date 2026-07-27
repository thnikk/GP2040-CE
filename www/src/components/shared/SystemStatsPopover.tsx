import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isNewerVersion } from '../../Services/Utilities';
import useSystemStats from '../../Store/useSystemStats';

type SystemStatsPopoverProps = {
	show: boolean;
	onHide: () => void;
	triggerRef?: React.RefObject<HTMLElement>;
};

const POPOVER_GAP = 10;

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
	const [pos, setPos] = useState({ top: -9999, left: -9999 });

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

	useLayoutEffect(() => {
		if (!show || !triggerRef?.current || !ref.current) return;

		const updatePosition = () => {
			const trigger = triggerRef?.current;
			const popover = ref.current;
			if (!trigger || !popover) return;

			const tr = trigger.getBoundingClientRect();
			const pw = popover.offsetWidth;
			const ph = popover.offsetHeight;
			const vw = window.innerWidth;

			let left = tr.left + tr.width / 2 - pw / 2;
			let top = tr.top - ph - POPOVER_GAP;

			left = Math.max(POPOVER_GAP, Math.min(left, vw - pw - POPOVER_GAP));

			if (top < POPOVER_GAP) {
				top = tr.bottom + POPOVER_GAP;
			}

			const arrowOffset = tr.left + tr.width / 2 - left;

			setPos({ top, left });
			popover.style.setProperty('--arrow-left', `${arrowOffset}px`);
		};

		updatePosition();

		window.addEventListener('scroll', updatePosition, true);
		window.addEventListener('resize', updatePosition);

		return () => {
			window.removeEventListener('scroll', updatePosition, true);
			window.removeEventListener('resize', updatePosition);
		};
	}, [show, triggerRef]);

	if (!show) return null;

	return (
		<div className="footer-popover" ref={ref} style={{ top: pos.top, left: pos.left }}>
			<div className="footer-popover-body">
				{loaded ? (
					<>
						<div className="card-heading">{t('HomePage:system-stats-header-text')}</div>
						<div className="system-text">
							<strong>{t('HomePage:board-text')}:</strong> {boardConfigProperties.label}
						</div>
						<div className="system-text d-flex align-items-center">
							<strong>{t('HomePage:version-text')}:</strong> {currentVersion}
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

					</>
				) : (
					<span className="text-muted">{t('Common:loading-text')}</span>
				)}
			</div>
		</div>
	);
};

export default SystemStatsPopover;
