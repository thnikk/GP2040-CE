export default {
	rgb: {
		'header-text': 'RGB LED Configuration',
		'data-pin-label': 'Data Pin (-1 for disabled)',
		'led-format-label': 'LED Format',
		'led-layout-label': 'LED Layout',
		'leds-per-button-label': 'LEDs Per Button',
		'led-brightness-maximum-label': 'Max Brightness',
		'led-brightness-steps-label': 'Brightness Steps',
	},
	player: {
		'header-text': 'Player LEDs',
		'pwm-sub-header-text':
			'For PWM LEDs, set each LED to a dedicated GPIO pin.',
		'rgb-sub-header-text':
			'Set the NeoPixel LED index for each player LED.',
		'pled-type-label': 'Player LED Type',
		'pled-type-off': 'Off',
		'pled-type-pwm': 'PWM',
		'pled-type-rgb': 'RGB',
		'pled-color-label': 'RGB PLED Color',
	},
    case: {
        'header-text': 'Case RGB LEDs',
        'sub-header-text':
			'For Case RGB LEDs, set a starting index and the case RGB count.',
		'case-index-label': 'RGB LED Index',
        'case-count-label': 'RGB LED Count',
        'case-type-label': 'Color Type',
        'case-type-off': 'Off',
        'case-type-static': 'Static',
        'case-color-label': 'Case RGB Color',
    },
	'pled-pin-label': 'PLED #{{pin}} Pin',
	'pled-index-label': 'PLED #{{index}} Index',
	'board-led': {
		'header-text': 'Board LED Configuration',
		'format-label': 'Board LED Format',
		'brightness-label': 'Board LED Brightness',
	},
	'pin-led': {
		'header-text': 'Pin LED Mapping',
		'sub-header-text':
			'Assign LED strip indices to GPIO pins. Set -1 for pins with no LED.',
		'pin-header': 'Pin',
		'action-header': 'Action',
		'led-index-header': 'LED Index',
	},
	'turn-off-when-suspended': 'Turn Off When Suspended',
};
