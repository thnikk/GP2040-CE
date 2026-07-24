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
	xs?: number | 'auto';
	sm?: number;
	md?: number;
	lg?: number;
	className?: string;
	style?: React.CSSProperties;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const Col = ({ xs, sm, md, lg, className = '', style, children, ...props }: ColProps) => {
	if (xs === 'auto') {
		return (
			<div className={className} style={{ flex: '0 0 auto', width: 'auto', maxWidth: '100%', ...style }} {...props}>
				{children}
			</div>
		);
	}
	const bp = lg ?? md ?? sm ?? xs ?? 12;
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
