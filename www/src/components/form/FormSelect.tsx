import React from 'react';

type FormSelectTypes = {
	label?: string;
	error?: string;
	groupClassName?: string;
	hidden?: boolean;
	className?: string;
	isInvalid?: boolean;
	children?: React.ReactNode;
	value?: string | number;
	onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
	[key: string]: unknown;
};

const FormSelect = ({
	label,
	error,
	groupClassName = '',
	hidden = false,
	className = '',
	isInvalid,
	children,
	...props
}: FormSelectTypes) => {
	return (
		<div className={groupClassName} hidden={hidden}>
			{label && <label className="form-label">{label}</label>}
			<select className={`form-select ${className}`} {...props}>
				{children}
			</select>
			{error && <div className="form-control-feedback is-invalid">{error}</div>}
		</div>
	);
};

export default FormSelect;
