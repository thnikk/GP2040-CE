import React from 'react';

type RowProps = {
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const Row = ({ className = '', children, ...props }: RowProps) => (
	<div className={`d-flex flex-wrap ${className}`} {...props}>
		{children}
	</div>
);

export default Row;
