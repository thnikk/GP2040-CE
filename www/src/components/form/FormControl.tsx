import React, { HTMLProps } from 'react';

type formTypes = {
	onClick?: () => void;
	label?: string;
	error?: string;
	groupClassName?: string;
	hidden?: boolean;
	className?: string;
	isInvalid?: boolean;
	value?: string | number;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
} & HTMLProps<HTMLInputElement>;

const FormControl = ({
	onClick,
	label,
	error,
	groupClassName,
	className = '',
	hidden = false,
	isInvalid,
	value,
	...props
}: formTypes) => {
	return (
		<div className={groupClassName} onClick={onClick} hidden={hidden}>
			{label && <label className="form-label">{label}</label>}
			<input className={`form-control ${className}`} value={value ?? ''} {...props} />
			{error && <div className="form-control-feedback is-invalid">{error}</div>}
		</div>
	);
};

export default FormControl;
