import React from 'react';

type TableProps = {
	sm?: boolean;
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const Table = ({ sm, bordered, hover, striped, className = '', children, ...props }: TableProps) => {
	void bordered;
	void hover;
	void striped;
	return (
		<table className={`table${sm ? ' table-sm' : ''} ${className}`} {...props}>
			{children}
		</table>
	);
};

export default Table;
