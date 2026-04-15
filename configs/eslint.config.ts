import js from "@eslint/js"
import globals from "globals"
import tsParser from "@typescript-eslint/parser"
import tsPlugin from "@typescript-eslint/eslint-plugin"

export default [
	js.configs.recommended,
	{
		name: "ignore-files",
		ignores: ["dist/**", "node_modules/**", ".git/**"]
	},
	{
		name: "app-files",
		files: ["**/*.js", "**/*.mjs", "**/*.ts"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			parser: tsParser,
			globals: {
				...globals.browser,
				...globals.node,
				eruda: "readonly",
				erudaIndexedDB: "readonly",
			},
		},
		plugins: {
			"@typescript-eslint": tsPlugin,
		},
		rules: {
			// 强制不使用分号
			"semi": ["error", "never"],

			// 强制使用双引号
			"quotes": ["error", "double"],

			// 禁止使用 var
			"no-var": "error",

			// 强制使用 const/let
			"prefer-const": "error",

			// 允许 console（游戏需要大量日志输出）
			"no-console": "off",

			// 未使用变量报错
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": ["error", {
				"argsIgnorePattern": "^_",
				"varsIgnorePattern": "^_",
				"caughtErrorsIgnorePattern": "^_",
			}],
			
			// 允许 any
			"@typescript-eslint/no-explicit-any": "error",
			
			// 关闭无用赋值检查（容易产生误报）
			"no-useless-assignment": "off",
		},
	},
]
