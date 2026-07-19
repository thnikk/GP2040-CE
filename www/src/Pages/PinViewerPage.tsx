import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BoardSVG from '../Components/BoardSVG';
import Section from '../Components/Section';
import WebApi from '../Services/WebApi';
import { useBoardSVG } from '../hooks/useBoardSVG';
import './PinMapping.scss'; // Reuse styles from PinMapping for SVG sizing

export default function PinViewerPage() {
	const { t } = useTranslation('');
	const { svgContent, pinElements, loading, svgMode } = useBoardSVG();
	const [pressedPins, setPressedPins] = useState<number[]>([]);

	const controller = useRef<null | AbortController>(null);
	const stopRef = useRef(false);

	const pollPinState = async () => {
		if (stopRef.current) return;
		controller.current = new AbortController();

		try {
			const data = await WebApi.getPinState();
			
			if (data && data.heldPins) {
				setPressedPins(data.heldPins);
			} else {
				setPressedPins([]);
			}
		} catch (error) {
			// Ignore errors
		}

		if (!stopRef.current) {
			setTimeout(pollPinState, 50); // Poll every 50ms safely
		}
	};

	useEffect(() => {
		stopRef.current = false;
		pollPinState();

		return () => {
			stopRef.current = true;
			controller.current?.abort();
		};
	}, []);

	return (
		<Section title={t('PinViewer:header-text')}>
			<div className="mb-3">
				{t('PinViewer:sub-header-text')}
			</div>
			{svgMode ? (
				<div className="board-svg-wrapper">
					{loading ? (
						<div className="d-flex justify-content-center p-5">
							<span className="spinner-border" />
						</div>
					) : svgContent ? (
						<BoardSVG
							svgContent={svgContent}
							pinElements={pinElements}
							profileIndex={0}
							onPinClick={() => {}}
							highlightedPins={pressedPins}
						/>
					) : (
						<div className="alert alert-info">
							{t('PinViewer:no-svg-available')}
						</div>
					)}
				</div>
			) : (
				<div className="alert alert-warning">
					{t('PinViewer:svg-mode-disabled')}
				</div>
			)}
			
			{pressedPins.length > 0 && (
				<div className="alert alert-info mt-3">
					<strong>{t('PinViewer:pin-pressed', { pressedPin: pressedPins.join(', ') })}</strong>
				</div>
			)}
		</Section>
	);
}
