import React from 'react';
import ReactSelect, { GroupBase, Props } from 'react-select';

import './CustomSelect.css';

function CustomSelect<
	Option,
	IsMulti extends boolean = false,
	Group extends GroupBase<Option> = GroupBase<Option>,
>({ className, ...props }: Props<Option, IsMulti, Group>) {
	return (
		<ReactSelect
			className={`react-select__container${className ? ` ${className}` : ''}`}
			classNamePrefix="react-select"
			{...props}
		/>
	);
}

export default CustomSelect;
