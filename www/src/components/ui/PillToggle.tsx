import React from 'react';

type PillToggleProps = {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label?: React.ReactNode;
	disabled?: boolean;
	id?: string;
};

const PillToggle = ({ checked, onChange, label, disabled, id }: PillToggleProps) => (
	<button
		id={id}
		type="button"
		className={`pill-toggle${checked ? ' active' : ''}`}
		disabled={disabled}
		onClick={() => onChange(!checked)}
		aria-pressed={checked}
	>
		{label}
	</button>
);

export default PillToggle;
