import React from 'react';

const FRACTIONS: Record<number, number> = {
	1: 8.333333,
	2: 16.666667,
	3: 25,
	4: 33.333333,
	6: 50,
	9: 75,
	10: 83.333333,
};

type ColProps = {
	sm?: number;
	md?: number;
	lg?: number;
	className?: string;
	style?: React.CSSProperties;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const Col = ({ sm, md, lg, className = '', style, children, ...props }: ColProps) => {
	const bp = lg ?? md ?? sm ?? 12;
	const pct = FRACTIONS[bp] ?? (bp / 12) * 100;
	return (
		<div
			className={className}
			style={{ flex: `0 0 ${pct}%`, maxWidth: `${pct}%`, ...style }}
			{...props}
		>
			{children}
		</div>
	);
};

export default Col;
