import React, { forwardRef } from 'react';

type ButtonProps = {
	variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'link' | 'outline-danger';
	size?: 'sm';
	as?: React.ElementType;
	className?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
} & React.ComponentPropsWithoutRef<'button'>;

const Button = forwardRef<HTMLElement, ButtonProps>(
	({ variant = 'primary', size, as: Component = 'button', className = '', children, ...props }, ref) => {
		const classes = ['btn', `btn-${variant}`, size === 'sm' ? 'btn-sm' : '', className]
			.filter(Boolean)
			.join(' ');
		return (
			<Component ref={ref} className={classes} {...props}>
				{children}
			</Component>
		);
	},
);

Button.displayName = 'Button';
export default Button;
