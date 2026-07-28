import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// import dev host for wsl2
const host = process.env.VITE_DEV_HOST || 'localhost';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	return {
		build: {
			outDir: path.join(__dirname, "build"),
			sourcemap: false,
		},
		server: {
			host: host,
			open: env.VITE_DEV_OPEN !== 'false',
			port: 3000,
		},
		plugins: [
			react(),
			{
				name: 'dev-favicon',
				transformIndexHtml(html) {
					if (mode === 'development') {
						const svgPath = path.resolve(__dirname, 'public/images/logo.svg');
						const svg = fs.readFileSync(svgPath, 'utf-8');
						const redSvg = svg.replace('#d8dee9', '#bf616a');
						const dataUrl = `data:image/svg+xml,${encodeURIComponent(redSvg)}`;
						return html.replace('/images/logo.svg', dataUrl);
					}
				},
			},
		],
		resolve: {
			alias: {
				lodash: 'lodash-es',
				"@proto": path.resolve(__dirname, "src_gen"),
			},
		},
	};
});
