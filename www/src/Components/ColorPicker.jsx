import React from 'react';

const ColorPicker = ({ value, onChange, title }) => {
	return (
		<div className="d-inline-flex align-items-center gap-1" style={{ position: 'relative' }}>
			{title && <small className="text-muted">{title}</small>}
			<div
				className="color-swatch"
				style={{ backgroundColor: value || '#000000' }}
			/>
			<input
				type="color"
				value={value || '#000000'}
				onChange={(e) => onChange?.(e.target.value)}
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					opacity: 0,
					cursor: 'pointer',
				}}
			/>
		</div>
	);
};

export default ColorPicker;
