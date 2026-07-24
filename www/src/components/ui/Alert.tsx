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

const AlertHeading = ({ className = '', children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: unknown }) => (
	<h4 className={`alert-heading ${className}`} {...props}>
		{children}
	</h4>
);

Alert.Heading = AlertHeading;

export default Alert;
