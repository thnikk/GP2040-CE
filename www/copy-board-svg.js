import path from 'node:path';
import fs from 'node:fs';

import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(__filename).replace(path.normalize('www'), '');

const targetDir = process.argv[2];
if (!targetDir) {
	console.error('Usage: node copy-board-svg.js <target-dir>');
	console.error('  <target-dir>: "public" for dev, "build" for production');
	process.exit(1);
}

const boardId = process.env.VITE_GP2040_BOARD;
const hasSvg = process.env.VITE_GP2040_BOARD_HAS_SVG === 'true';

if (!hasSvg || !boardId) {
	if (!hasSvg) console.log('Board has no SVG, skipping copy');
	if (!boardId) console.log('VITE_GP2040_BOARD not set, skipping copy');
	process.exit(0);
}

let boardConfig = '';
if (process.env.GP2040_BOARDCONFIG && process.env.GP2040_BOARDCONFIG.toLowerCase() === boardId.toLowerCase()) {
	boardConfig = process.env.GP2040_BOARDCONFIG;
}

if (!boardConfig) {
	const configsDir = path.join(root, 'configs');
	if (fs.existsSync(configsDir)) {
		const boardIdLower = boardId.toLowerCase();
		const entries = fs.readdirSync(configsDir, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.isDirectory() && entry.name.toLowerCase() === boardIdLower) {
				const svgPath = path.join(configsDir, entry.name, 'board.svg');
				if (fs.existsSync(svgPath)) {
					boardConfig = entry.name;
					break;
				}
			}
		}
	}
}

if (!boardConfig) {
	console.log('GP2040_BOARDCONFIG not set and no config dir with board.svg found, skipping copy');
	process.exit(0);
}

const sourceFile = path.join(root, 'configs', boardConfig, 'board.svg');
const targetFile = path.join(root, 'www', targetDir, 'boards', 'board.svg');

if (!fs.existsSync(sourceFile)) {
	console.error(`Board SVG not found: ${sourceFile}`);
	process.exit(1);
}

const targetDirPath = path.dirname(targetFile);
fs.mkdirSync(targetDirPath, { recursive: true });

if (fs.existsSync(targetFile) && fs.realpathSync(sourceFile) === fs.realpathSync(targetFile)) {
	console.log(`Skipping — target already points to source: ${targetFile}`);
	process.exit(0);
}

if (fs.existsSync(targetFile)) {
	fs.unlinkSync(targetFile);
}

try {
	const relativePath = path.relative(targetDirPath, sourceFile);
	fs.symlinkSync(relativePath, targetFile, 'file');
	console.log(`Linked ${sourceFile} → ${targetFile}`);
} catch {
	fs.copyFileSync(sourceFile, targetFile);
	console.log(`Copied ${sourceFile} → ${targetFile}`);
}
