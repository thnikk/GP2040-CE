import React from 'react';

type FormLabelProps = {
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const FormLabel = ({ className = '', children, ...props }: FormLabelProps) => (
	<label className={`form-label ${className}`} {...props}>
		{children}
	</label>
);

export default FormLabel;
