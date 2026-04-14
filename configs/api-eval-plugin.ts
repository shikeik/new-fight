// ========== API Eval Bridge Plugin ==========
// 通过 HMR WebSocket 让 curl 能在浏览器里执行任意 JS

import type { ViteDevServer } from "vite"

const pendingRequests = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
let requestId = 0

export const apiEvalPlugin = {
	name: "api-eval-bridge",

	configureServer(server: ViteDevServer) {
		// HTTP 中间件 - 接收 curl/CLI 请求
		server.middlewares.use("/api/eval", async (req, res, _next) => {
			if (req.method !== "POST") {
				res.statusCode = 405
				res.setHeader("Content-Type", "application/json; charset=utf-8")
				res.end(JSON.stringify({ success: false, errorType: "method", result: null, error: "Method not allowed" }, null, 2) + "\n")
				return
			}

			const id = ++requestId

			// 读取请求体
			let body = ""
			req.setEncoding("utf8")
			for await (const chunk of req) {
				body += chunk
			}

			// 创建 Promise 等待浏览器响应
			const responsePromise = new Promise<unknown>((resolve, reject) => {
				pendingRequests.set(id, { resolve, reject })
				setTimeout(() => {
					if (pendingRequests.has(id)) {
						pendingRequests.delete(id)
						reject(new Error("Timeout waiting for browser response"))
					}
				}, 5000)
			})

			try {
				const url = new URL(req.url || "", `http://${req.headers.host}`)

				// 解析密码：支持 ?pwd=xxx 或 ?xxx 快捷方式
				let pwd: string | null = url.searchParams.get("pwd")
				if (!pwd) {
					const firstKey = url.searchParams.keys().next().value
					if (firstKey !== undefined && url.searchParams.get(firstKey) === "") {
						pwd = firstKey
					}
				}

				if (pwd !== "shikeik666") {
					res.statusCode = 403
					res.setHeader("Content-Type", "application/json; charset=utf-8")
					res.end(JSON.stringify({ success: false, errorType: "auth", result: null, error: "Forbidden" }, null, 2) + "\n")
					return
				}

				const code = body
				if (!code) {
					res.statusCode = 400
					res.setHeader("Content-Type", "application/json; charset=utf-8")
					res.end(JSON.stringify({ success: false, errorType: "input", result: null, error: "Missing code" }, null, 2) + "\n")
					return
				}

				// 通过 HMR WebSocket 发送给浏览器
				server.ws.send("api-eval-request", { id, code })

				// 等待浏览器响应
				const browserResult = await responsePromise as { success: boolean; errorType: string; result: unknown; error: string | null }

				const isPretty = url.searchParams.has("pretty")

				res.statusCode = 200
				res.setHeader("Access-Control-Allow-Origin", "*")

				if (isPretty) {
					res.setHeader("Content-Type", "text/plain; charset=utf-8")
					const prettyResult = browserResult.error
						? `❌ errorType: ${browserResult.errorType}\n\n${browserResult.error}`
						: `✅ success: true\nresult: ${typeof browserResult.result === 'object' ? JSON.stringify(browserResult.result, null, 2) : browserResult.result}`
					res.end(`[Request #${id}]\n${prettyResult}\n`)
				} else {
					res.setHeader("Content-Type", "application/json; charset=utf-8")
					res.end(JSON.stringify({ id, ...browserResult }, null, 2) + "\n")
				}
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err)
				res.statusCode = 500
				res.setHeader("Content-Type", "application/json; charset=utf-8")
				res.end(JSON.stringify({ success: false, errorType: "server", result: null, error: message }, null, 2) + "\n")
			}
		})

		// 接收浏览器响应
		server.ws.on("api-eval-response", (data: { id: number; success: boolean; errorType: string; result: unknown; error: string | null }) => {
			const pending = pendingRequests.get(data.id)
			if (pending) {
				pendingRequests.delete(data.id)
				pending.resolve(data)
			}
		})
	}
}
