import React from 'react';

import './FormCheck.css';

const FormCheck = ({ label, error, groupClassName, className, children, ...props }) => {
	return (
		<div className={groupClassName}>
			{label && <label className="form-label">{label}</label>}
			<div className="form-check">
				<input type="checkbox" className={`form-check-input ${className || ''}`} {...props} />
				{children}
			</div>
			{error && <div className="form-control-feedback is-invalid">{error}</div>}
		</div>
	);
};

export default FormCheck;
