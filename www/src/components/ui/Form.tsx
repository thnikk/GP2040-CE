import React from 'react';

type FormProps = {
	noValidate?: boolean;
	onSubmit?: (e: React.FormEvent) => void;
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const Form = ({ noValidate, onSubmit, className = '', children, ...props }: FormProps) => (
	<form
		className={className}
		{...(noValidate ? { noValidate: true } : {})}
		onSubmit={onSubmit}
		{...props}
	>
		{children}
	</form>
);

type FormGroupProps = {
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const FormGroup = ({ className = '', children, ...props }: FormGroupProps) => (
	<div className={`form-group ${className}`} {...props}>
		{children}
	</div>
);

type FormLabelProps = {
	className?: string;
	children?: React.ReactNode;
	htmlFor?: string;
	[key: string]: unknown;
};

const FormLabel = ({ className = '', children, ...props }: FormLabelProps) => (
	<label className={`form-label ${className}`} {...props}>
		{children}
	</label>
);

type FormControlProps = {
	className?: string;
	type?: string;
	placeholder?: string;
	value?: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const FormControl = ({ className = '', children, ...props }: FormControlProps) => {
	if (props.type === 'textarea') {
		return (
			<textarea className={`form-control ${className}`} {...props}>
				{children}
			</textarea>
		);
	}
	return <input className={`form-control ${className}`} {...props} />;
};

type FormControlFeedbackProps = {
	type?: 'valid' | 'invalid';
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const FormControlFeedback = ({ type, className = '', children, ...props }: FormControlFeedbackProps) => {
	if (!children) return null;
	return (
		<div className={`form-control-feedback${type === 'invalid' ? ' is-invalid' : ''} ${className}`} {...props}>
			{children}
		</div>
	);
};

FormControl.Feedback = FormControlFeedback;

type FormTextProps = {
	className?: string;
	muted?: boolean;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const FormText = ({ className = '', muted, children, ...props }: FormTextProps) => (
	<small className={`form-text ${muted ? 'text-muted' : ''} ${className}`} {...props}>
		{children}
	</small>
);

type FormSelectProps = {
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

const FormSelect = ({ className = '', children, ...props }: FormSelectProps) => (
	<select className={`form-select ${className}`} {...props}>
		{children}
	</select>
);

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

const FormCheckInput = ({ className = '', ...props }: FormCheckProps) => (
	<input type="checkbox" className={`form-check-input ${className}`} {...props} />
);

const FormCheckLabel = ({
	htmlFor,
	children,
	className = '',
}: {
	htmlFor?: string;
	children?: React.ReactNode;
	className?: string;
}) => (
	<label className={`form-check-label ${className}`} htmlFor={htmlFor}>
		{children}
	</label>
);

const FormCheck = ({ type, id, label, className = '', reverse, children, ...props }: FormCheckProps) => {
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

Form.Group = FormGroup;
Form.Label = FormLabel;
Form.Control = FormControl;
Form.Control.Feedback = FormControlFeedback;
Form.Text = FormText;
Form.Select = FormSelect;
Form.Check = FormCheck;
Form.Check.Input = FormCheckInput;
Form.Check.Label = FormCheckLabel;

export default Form;
