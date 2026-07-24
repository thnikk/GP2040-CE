import React from 'react';

type ProgressBarProps = {
	now: number;
	label?: string;
	className?: string;
};

const ProgressBar = ({ now, label, className = '' }: ProgressBarProps) => (
	<div className={`progress ${className}`}>
		<div className="progress-bar" style={{ width: `${now}%` }} role="progressbar">
			{label}
		</div>
	</div>
);

export default ProgressBar;
