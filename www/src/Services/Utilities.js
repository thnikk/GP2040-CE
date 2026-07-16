// Compare two semver strings (e.g. "v1.0.0" > "v0.7.10-1")
// Returns true if version a is newer than version b
const isNewerVersion = (a, b) => {
	const parse = (v) => {
		const s = v.replace(/^v/i, '').split(/[.-]/);
		return s.map((p) => {
			const n = parseInt(p, 10);
			return isNaN(n) ? p : n;
		});
	};

	const pa = parse(a);
	const pb = parse(b);

	for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
		const left = i < pa.length ? pa[i] : 0;
		const right = i < pb.length ? pb[i] : 0;
		if (left === right) continue;
		if (typeof left === 'number' && typeof right === 'number') return left > right;
		if (typeof left === 'string' && typeof right === 'string') return left > right;
		return typeof left === 'number';
	}
	return false;
};

// Convert a hex string to a number
const hexToInt = (hex) => {
	return parseInt(hex.replace('#', ''), 16);
};

// Convert a number to hex
const intToHex = (d) => {
	return ('0' + Number(d).toString(16)).slice(-2).toLowerCase();
};

// Convert a 32-bit ARGB value to hex format
const rgbIntToHex = (rgbInt) => {
	let r = (rgbInt >> 16) & 255;
	let g = (rgbInt >> 8) & 255;
	let b = (rgbInt >> 0) & 255;

	return `#${intToHex(r)}${intToHex(g)}${intToHex(b)}`;
};

// Takes an array of 8-bit RGB values and returns the hex value
const rgbArrayToHex = (values) => {
	let [r, g, b] = values;

	if (!(r >= 0 && r <= 255)) r = 0;
	if (!(g >= 0 && g <= 255)) g = 0;
	if (!(b >= 0 && b <= 255)) r = 0;

	return `#${intToHex(r)}${intToHex(g)}${intToHex(b)}`;
};

const rgbWheel = (pos) => {
	pos = 255 - pos;
	if (pos < 85) {
		return rgbArrayToHex([255 - pos * 3, 0, pos * 3]);
	} else if (pos < 170) {
		pos -= 85;
		return rgbArrayToHex([0, pos * 3, 255 - pos * 3]);
	} else {
		pos -= 170;
		return rgbArrayToHex([pos * 3, 255 - pos * 3, 0]);
	}
};

export { hexToInt, intToHex, isNewerVersion, rgbArrayToHex, rgbIntToHex, rgbWheel };
