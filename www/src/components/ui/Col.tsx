import React from 'react';

type ColProps = {
	sm?: number;
	md?: number;
	lg?: number;
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const Col = ({ sm, md, lg, className = '', children, ...props }: ColProps) => {
	const classes = [
		sm ? `col-sm-${sm}` : '',
		md ? `col-md-${md}` : '',
		lg ? `col-lg-${lg}` : '',
		className,
	]
		.filter(Boolean)
		.join(' ');
	return (
		<div className={classes} {...props}>
			{children}
		</div>
	);
};

export default Col;
