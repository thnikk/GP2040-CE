import React from 'react';

type FormCheckProps = {
	type?: 'checkbox' | 'switch';
	id?: string;
	label?: string;
	className?: string;
	reverse?: boolean;
	isInvalid?: boolean;
	checked?: boolean;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const FormCheck = ({
	type = 'checkbox',
	id,
	label,
	className = '',
	reverse,
	children,
	...props
}: FormCheckProps) => {
	const containerClass = [
		'form-check',
		type === 'switch' ? 'form-switch' : '',
		reverse ? 'form-check-reverse' : '',
		className,
	]
		.filter(Boolean)
		.join(' ');

	const input = <input type="checkbox" className="form-check-input" id={id} {...props} />;
	const labelEl = label ? (
		<label className="form-check-label" htmlFor={id}>
			{label}
		</label>
	) : null;

	return (
		<div className={containerClass}>
			{reverse ? labelEl : input}
			{reverse ? input : labelEl}
			{children}
		</div>
	);
};

export default FormCheck;
