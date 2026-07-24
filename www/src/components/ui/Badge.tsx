import React from 'react';

type BadgeProps = {
	bg?: string;
	className?: string;
	children?: React.ReactNode;
};

const Badge = ({ bg, className = '', children }: BadgeProps) => (
	<span className={`badge${bg ? ` bg-${bg}` : ''} ${className}`}>{children}</span>
);

export default Badge;
