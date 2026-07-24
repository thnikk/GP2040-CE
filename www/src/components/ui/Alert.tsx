import React from 'react';

type AlertProps = {
	variant?: 'info' | 'warning' | 'danger';
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const Alert = ({ variant = 'info', className = '', children, ...props }: AlertProps) => (
	<div className={`alert alert-${variant} ${className}`} role="alert" {...props}>
		{children}
	</div>
);

export default Alert;
