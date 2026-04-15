import { resolve } from "path"
import basicSsl from "@vitejs/plugin-basic-ssl"
import { apiEvalPlugin } from "./api-eval-plugin.ts"

// 项目根目录（vite.config.ts 现在在 configs/ 目录下）
const rootDir = resolve(__dirname, "..")
const useHttps = process.env.HTTPS === "true"

export default {
	server: {
		host: "0.0.0.0",
		port: 5000,
		https: useHttps,
	},
	build: {
		target: "es2022",
		outDir: "dist",
		assetsDir: "assets",
		rollupOptions: {
			input: {
				index: resolve(rootDir, "index.html"),
				fighter: resolve(rootDir, "pages/fighter.html"),
				tank: resolve(rootDir, "pages/tank.html"),
			}
		}
	},
	plugins: useHttps ? [basicSsl(), apiEvalPlugin] : [apiEvalPlugin],
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
		include: ["three", "luna-data-grid", "licia", "idb"],
		rolldownOptions: {
			resolve: {
				extensions: [".ts", ".js"]
			}
		}
	}
}
