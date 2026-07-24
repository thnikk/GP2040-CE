import React from 'react';

type InputGroupProps = {
	size?: 'sm' | 'lg';
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const InputGroupText = ({
	className = '',
	children,
	...props
}: {
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
}) => (
	<span className={`input-group-text ${className}`} {...props}>
		{children}
	</span>
);

const InputGroup = ({ size, className = '', children, ...props }: InputGroupProps) => (
	<div className={`input-group${size === 'sm' ? ' input-group-sm' : size === 'lg' ? ' input-group-lg' : ''} ${className}`} {...props}>
		{children}
	</div>
);

InputGroup.Text = InputGroupText;

export default InputGroup;
