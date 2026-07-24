import React from 'react';

type InputGroupProps = {
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const InputGroup = ({ className = '', children, ...props }: InputGroupProps) => (
	<div className={`input-group ${className}`} {...props}>
		{children}
	</div>
);

export default InputGroup;
