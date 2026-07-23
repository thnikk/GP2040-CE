import fs from 'fs';
import path from 'path';

const GPIO_ACTION = {
	'GpioAction::NONE': 0,
	'GpioAction::RESERVED': -1,
	'GpioAction::ASSIGNED_TO_ADDON': -2,
	'GpioAction::BUTTON_PRESS_UP': 1,
	'GpioAction::BUTTON_PRESS_DOWN': 2,
	'GpioAction::BUTTON_PRESS_LEFT': 3,
	'GpioAction::BUTTON_PRESS_RIGHT': 4,
	'GpioAction::BUTTON_PRESS_B1': 5,
	'GpioAction::BUTTON_PRESS_B2': 6,
	'GpioAction::BUTTON_PRESS_B3': 7,
	'GpioAction::BUTTON_PRESS_B4': 8,
	'GpioAction::BUTTON_PRESS_L1': 9,
	'GpioAction::BUTTON_PRESS_R1': 10,
	'GpioAction::BUTTON_PRESS_L2': 11,
	'GpioAction::BUTTON_PRESS_R2': 12,
	'GpioAction::BUTTON_PRESS_S1': 13,
	'GpioAction::BUTTON_PRESS_S2': 14,
	'GpioAction::BUTTON_PRESS_A1': 15,
	'GpioAction::BUTTON_PRESS_A2': 16,
	'GpioAction::BUTTON_PRESS_L3': 17,
	'GpioAction::BUTTON_PRESS_R3': 18,
	'GpioAction::BUTTON_PRESS_FN': 19,
	'GpioAction::BUTTON_PRESS_DDI_UP': 20,
	'GpioAction::BUTTON_PRESS_DDI_DOWN': 21,
	'GpioAction::BUTTON_PRESS_DDI_LEFT': 22,
	'GpioAction::BUTTON_PRESS_DDI_RIGHT': 23,
	'GpioAction::BUTTON_PRESS_TURBO': 32,
	'GpioAction::BUTTON_PRESS_MACRO': 33,
	'GpioAction::BUTTON_PRESS_MACRO_1': 34,
	'GpioAction::BUTTON_PRESS_MACRO_2': 35,
	'GpioAction::BUTTON_PRESS_MACRO_3': 36,
	'GpioAction::BUTTON_PRESS_MACRO_4': 37,
	'GpioAction::BUTTON_PRESS_MACRO_5': 38,
	'GpioAction::BUTTON_PRESS_MACRO_6': 39,
	'GpioAction::BUTTON_PRESS_A3': 41,
	'GpioAction::BUTTON_PRESS_A4': 42,
	'GpioAction::BUTTON_PRESS_E1': 43,
	'GpioAction::BUTTON_PRESS_E2': 44,
	'GpioAction::BUTTON_PRESS_E3': 45,
	'GpioAction::BUTTON_PRESS_E4': 46,
	'GpioAction::BUTTON_PRESS_E5': 47,
	'GpioAction::BUTTON_PRESS_E6': 48,
	'GpioAction::BUTTON_PRESS_E7': 49,
	'GpioAction::BUTTON_PRESS_E8': 50,
	'GpioAction::BUTTON_PRESS_E9': 51,
	'GpioAction::BUTTON_PRESS_E10': 52,
	'GpioAction::BUTTON_PRESS_E11': 53,
	'GpioAction::BUTTON_PRESS_E12': 54,
	'GpioAction::BUTTON_PRESS_INPUT_REVERSE': 69,
};

const LED_FORMAT_MAP = {
	'LED_FORMAT_GRB': 0,
	'LED_FORMAT_RGB': 1,
	'LED_FORMAT_GRBW': 2,
	'LED_FORMAT_RGBW': 3,
};

const DPAD_TO_HIGH = { 1: 65536, 2: 131072, 4: 262144, 8: 524288 };

function evalBitExpr(str) {
	if (str === undefined || str === true) return 0;
	const cleaned = String(str).replace(/\s+/g, '');
	let result = 0;
	const re = /1<<(\d+)/g;
	let match;
	while ((match = re.exec(cleaned)) !== null) {
		result |= (1 << parseInt(match[1], 10));
	}
	if (result === 0 && /^\d+$/.test(cleaned)) {
		result = parseInt(cleaned, 10);
	}
	return result;
}

export function findBoardConfigDir(boardId, rootDir) {
	const boardIdLower = boardId.toLowerCase();

	const envConfig = process.env.GP2040_BOARDCONFIG;
	if (envConfig && envConfig.toLowerCase() === boardIdLower) {
		const dir = path.join(rootDir, 'configs', envConfig);
		if (fs.existsSync(dir)) return envConfig;
	}

	const configsDir = path.join(rootDir, 'configs');
	if (!fs.existsSync(configsDir)) return null;

	const entries = fs.readdirSync(configsDir, { withFileTypes: true });

	for (const entry of entries) {
		if (entry.isDirectory() && entry.name.toLowerCase() === boardIdLower)
			return entry.name;
	}

	return null;
}

export function parseBoardConfig(configDir, rootDir) {
	const boardConfigPath = path.join(rootDir, 'configs', configDir, 'BoardConfig.h');
	if (!fs.existsSync(boardConfigPath)) return null;

	const content = fs.readFileSync(boardConfigPath, 'utf8');
	const rawDefines = extractDefines(content);

	return buildBoardConfig(rawDefines, configDir, rootDir);
}

function resolveValue(raw, mappings) {
	if (raw === undefined) return undefined;
	const trimmed = raw.trim().replace(/;$/, '');
	return mappings[trimmed] !== undefined ? mappings[trimmed] : trimmed;
}

function extractDefines(content) {
	const defines = {};
	const cleaned = content.replace(/\/\*[\s\S]*?\*\//g, '');
	const lines = cleaned.split('\n').filter(l => !l.trim().startsWith('//'));
	const joined = lines.join('\n').replace(/\\\n\s*/g, '');

	for (const line of joined.split('\n')) {
		const match = line.match(/^#define\s+(\w+)(?:\s+(.*))?$/);
		if (match) {
			let val = (match[2] || '').trim();
			const commentIdx = val.indexOf('//');
			if (commentIdx >= 0) val = val.substring(0, commentIdx).trim();
			defines[match[1]] = val || true;
		}
	}
	return defines;
}

function buildBoardConfig(rawDefines, configDir, rootDir) {
	const pinDefaults = [];
	for (let i = 0; i < 30; i++) {
		const key = `GPIO_PIN_${i.toString().padStart(2, '0')}`;
		if (rawDefines[key] !== undefined) {
			const val = GPIO_ACTION[rawDefines[key]];
			pinDefaults.push(val !== undefined ? val : -2);
		} else {
			pinDefaults.push(0);
		}
	}

	const pinLedIndices = {};
	for (let i = 0; i < 30; i++) {
		const key = `BOARD_LED_INDEX_GP${i.toString().padStart(2, '0')}`;
		if (rawDefines[key] !== undefined) {
			const val = parseInt(rawDefines[key], 10);
			pinLedIndices[String(i)] = isNaN(val) ? -1 : val;
		} else {
			pinLedIndices[String(i)] = null;
		}
	}

	const boardLedsPin = rawDefines.BOARD_LEDS_PIN !== undefined
		? parseInt(rawDefines.BOARD_LEDS_PIN, 10) : -1;

	const ledBrightnessMaximum = rawDefines.LED_BRIGHTNESS_MAXIMUM !== undefined
		? parseInt(rawDefines.LED_BRIGHTNESS_MAXIMUM, 10) : 255;

	const ledBrightnessSteps = rawDefines.LED_BRIGHTNESS_STEPS !== undefined
		? parseInt(rawDefines.LED_BRIGHTNESS_STEPS, 10) : 5;

	const ledFormat = rawDefines.LED_FORMAT !== undefined
		? (LED_FORMAT_MAP[rawDefines.LED_FORMAT] ?? 0) : 0;

	const ledsPerButton = rawDefines.LEDS_PER_PIXEL !== undefined
		? parseInt(rawDefines.LEDS_PER_PIXEL, 10) : 1;

	let extraPins = [];
	if (rawDefines.BOARD_EXTRA_PINS !== undefined) {
		const match = rawDefines.BOARD_EXTRA_PINS.match(/\{([^}]*)\}/);
		if (match) {
			extraPins = match[1].split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
		}
	}

	const hasSvg = rawDefines.BOARD_SVG !== undefined;
	const svgPath = hasSvg ? path.join(rootDir, 'configs', configDir, 'board.svg') : null;

	let boardConfigLabel = configDir;
	if (rawDefines.BOARD_CONFIG_LABEL !== undefined) {
		const match = rawDefines.BOARD_CONFIG_LABEL.match(/"([^"]*)"/);
		if (match) boardConfigLabel = match[1];
	}

	const boardLedsRgbEnabled = rawDefines.BOARD_LEDS_RGB_ENABLED !== undefined
		? parseInt(rawDefines.BOARD_LEDS_RGB_ENABLED, 10) : 0;

	const boardLedsRgbPin = rawDefines.BOARD_LEDS_RGB_PIN !== undefined
		? parseInt(rawDefines.BOARD_LEDS_RGB_PIN, 10) : -1;

	const boardLedsRgbFormat = rawDefines.BOARD_LEDS_RGB_FORMAT !== undefined
		? (LED_FORMAT_MAP[rawDefines.BOARD_LEDS_RGB_FORMAT] ?? 0) : 0;

	const boardLedsRgbBrightness = rawDefines.BOARD_LEDS_RGB_BRIGHTNESS !== undefined
		? parseInt(rawDefines.BOARD_LEDS_RGB_BRIGHTNESS, 10) : 128;

	const baseAnimationIndex = rawDefines.LEDS_BASE_ANIMATION_INDEX !== undefined
		? parseInt(rawDefines.LEDS_BASE_ANIMATION_INDEX, 10) : undefined;

	const themeIndex = rawDefines.LEDS_THEME_INDEX !== undefined
		? parseInt(rawDefines.LEDS_THEME_INDEX, 10) : undefined;

	const pinWebconfig = rawDefines.PIN_WEBCONFIG !== undefined
		? parseInt(rawDefines.PIN_WEBCONFIG, 10) : -1;

	const pinWebconfigAdvanced = rawDefines.PIN_WEBCONFIG_ADVANCED !== undefined
		? parseInt(rawDefines.PIN_WEBCONFIG_ADVANCED, 10) : -1;

	const inputModePins = {
		xinput: rawDefines.DEFAULT_INPUT_MODE_XINPUT_PIN !== undefined
			? parseInt(rawDefines.DEFAULT_INPUT_MODE_XINPUT_PIN, 10) : -1,
		switch: rawDefines.DEFAULT_INPUT_MODE_SWITCH_PIN !== undefined
			? parseInt(rawDefines.DEFAULT_INPUT_MODE_SWITCH_PIN, 10) : -1,
		ps3: rawDefines.DEFAULT_INPUT_MODE_PS3_PIN !== undefined
			? parseInt(rawDefines.DEFAULT_INPUT_MODE_PS3_PIN, 10) : -1,
		ps4: rawDefines.DEFAULT_INPUT_MODE_PS4_PIN !== undefined
			? parseInt(rawDefines.DEFAULT_INPUT_MODE_PS4_PIN, 10) : -1,
		ps5: rawDefines.DEFAULT_INPUT_MODE_PS5_PIN !== undefined
			? parseInt(rawDefines.DEFAULT_INPUT_MODE_PS5_PIN, 10) : -1,
		keyboard: rawDefines.DEFAULT_INPUT_MODE_KEYBOARD_PIN !== undefined
			? parseInt(rawDefines.DEFAULT_INPUT_MODE_KEYBOARD_PIN, 10) : -1,
	};

	const hotkeyDefaults = [
		{ buttonsMask: 768, dpadMask: 1, auxMask: 32768, action: 4 },
		{ buttonsMask: 768, dpadMask: 2, auxMask: 0, action: 1 },
		{ buttonsMask: 768, dpadMask: 4, auxMask: 0, action: 2 },
		{ buttonsMask: 768, dpadMask: 8, auxMask: 0, action: 3 },
		{ buttonsMask: 4608, dpadMask: 1, auxMask: 0, action: 6 },
		{ buttonsMask: 4608, dpadMask: 2, auxMask: 0, action: 7 },
		{ buttonsMask: 4608, dpadMask: 4, auxMask: 0, action: 8 },
	];

	const hotkeys = [];
	for (let i = 1; i <= 16; i++) {
		const def = hotkeyDefaults[i - 1] || {};
		const n = i.toString().padStart(2, '0');
		let buttonsMask = def.buttonsMask ?? 0;
		let dpadMask = def.dpadMask ?? 0;
		let auxMask = def.auxMask ?? 0;
		let action = def.action ?? 0;
		let usePinTrigger = 0;
		let pinTriggerMask = 0;

		if (rawDefines[`HOTKEY_${n}_BUTTONS_MASK`] !== undefined)
			buttonsMask = parseInt(rawDefines[`HOTKEY_${n}_BUTTONS_MASK`], 10) || 0;
		if (rawDefines[`HOTKEY_${n}_DPAD_MASK`] !== undefined)
			dpadMask = parseInt(rawDefines[`HOTKEY_${n}_DPAD_MASK`], 10) || 0;
		if (rawDefines[`HOTKEY_${n}_AUX_MASK`] !== undefined)
			auxMask = parseInt(rawDefines[`HOTKEY_${n}_AUX_MASK`], 10) || 0;
		if (rawDefines[`HOTKEY_${n}_ACTION`] !== undefined)
			action = parseInt(rawDefines[`HOTKEY_${n}_ACTION`], 10) || 0;
		if (rawDefines[`HOTKEY_${n}_USE_PIN_TRIGGER`] !== undefined)
			usePinTrigger = parseInt(rawDefines[`HOTKEY_${n}_USE_PIN_TRIGGER`], 10) || 0;
		if (rawDefines[`HOTKEY_${n}_PIN_TRIGGER_MASK`] !== undefined)
			pinTriggerMask = evalBitExpr(rawDefines[`HOTKEY_${n}_PIN_TRIGGER_MASK`]);

		for (const [bit, high] of Object.entries(DPAD_TO_HIGH))
			if (dpadMask & parseInt(bit)) buttonsMask |= high;

		hotkeys.push({ auxMask, buttonsMask, action, usePinTrigger, pinTriggerMask });
	}

	return {
		boardConfigLabel,
		configDir,
		hasSvg,
		svgPath,
		pinDefaults,
		pinLedIndices,
		ledOptions: {
			dataPin: isNaN(boardLedsPin) ? -1 : boardLedsPin,
			brightnessMaximum: isNaN(ledBrightnessMaximum) ? 255 : ledBrightnessMaximum,
			brightnessSteps: isNaN(ledBrightnessSteps) ? 5 : ledBrightnessSteps,
			ledFormat: isNaN(ledFormat) ? 0 : ledFormat,
			ledsPerButton: isNaN(ledsPerButton) ? 1 : ledsPerButton,
		},
		extraPins,
		boardLedOptions: {
			enabled: isNaN(boardLedsRgbEnabled) ? 0 : boardLedsRgbEnabled,
			pin: isNaN(boardLedsRgbPin) ? -1 : boardLedsRgbPin,
			format: isNaN(boardLedsRgbFormat) ? 0 : boardLedsRgbFormat,
			brightness: isNaN(boardLedsRgbBrightness) ? 128 : boardLedsRgbBrightness,
		},
		animationOptions: {
			baseAnimationIndex: isNaN(baseAnimationIndex) ? 2 : baseAnimationIndex,
			themeIndex: isNaN(themeIndex) ? 0 : themeIndex,
		},
		hotkeys,
		inputModePins,
		webconfig: {
			pin: isNaN(pinWebconfig) ? -1 : pinWebconfig,
			pinAdvanced: isNaN(pinWebconfigAdvanced) ? -1 : pinWebconfigAdvanced,
		},
	};
}
