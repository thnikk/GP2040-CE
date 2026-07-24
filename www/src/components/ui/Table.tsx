import React from 'react';

type TableProps = {
	sm?: boolean;
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const Table = ({ sm, className = '', children, ...props }: TableProps) => (
	<table className={`table${sm ? ' table-sm' : ''} ${className}`} {...props}>
		{children}
	</table>
);

export default Table;
