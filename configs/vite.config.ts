import { resolve } from "path"

// 项目根目录（vite.config.ts 现在在 configs/ 目录下）
const rootDir = resolve(__dirname, "..")

export default {
	server: {
		host: "0.0.0.0",
		port: 5000
	},
	build: {
		target: "es2022",
		outDir: "dist",
		assetsDir: "assets",
		rollupOptions: {
			input: {
				index: resolve(rootDir, "index.html"),
			}
		}
	},
	plugins: [],
	resolve: {
		alias: {
			"@": resolve(rootDir, "src"),
		},
		extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"]
	},
	esbuild: {
		loader: "ts",
		include: ["src/**/*.ts", "src/**/*.js"]
	},
	optimizeDeps: {
		include: ["three/webgpu"],
		rolldownOptions: {
			resolve: {
				extensions: [".ts", ".js"]
			}
		}
	}
}
