// ========== API Eval Bridge Plugin ==========
// /api/eval  -> 通过 HMR WebSocket 在浏览器执行 JS
// /api/eval2 -> 在服务端 Node.js 环境中执行 JS

import type { ViteDevServer } from "vite"
import type { IncomingMessage, ServerResponse } from "node:http"
import vm from "node:vm"
import { normalizeResult, makeSuccessResult, makeErrorResult, type EvalResult } from "../src/fighter/lib/eval-engine.ts"

const pendingRequests = new Map<number, { resolve: (v: unknown) => void }>()
let requestId = 0

// 共享的 Node.js 执行上下文（持久化状态）
const eval2Context = vm.createContext({
	console,
	require,
	module: { exports: {} },
	exports: {},
	__dirname: process.cwd(),
	__filename: "[eval-api2]",
	Buffer,
	process,
	global,
	setTimeout,
	setInterval,
	clearTimeout,
	clearInterval,
	fetch,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	setImmediate: (globalThis as any).setImmediate,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	clearImmediate: (globalThis as any).clearImmediate,
})

async function readBody(req: IncomingMessage): Promise<string> {
	let body = ""
	req.setEncoding("utf8")
	for await (const chunk of req) {
		body += chunk
	}
	return body
}

function parsePwd(url: URL): string | null {
	let pwd: string | null = url.searchParams.get("pwd")
	if (!pwd) {
		const firstKey = url.searchParams.keys().next().value
		if (firstKey !== undefined && url.searchParams.get(firstKey) === "") {
			pwd = firstKey
		}
	}
	return pwd
}

function sendJson(res: ServerResponse, statusCode: number, payload: object) {
	res.statusCode = statusCode
	res.setHeader("Content-Type", "application/json; charset=utf-8")
	res.end(JSON.stringify(payload, null, 2) + "\n")
}

function sendResult(res: ServerResponse, id: number, result: EvalResult, isPretty: boolean) {
	res.statusCode = 200
	res.setHeader("Access-Control-Allow-Origin", "*")
	if (isPretty) {
		res.setHeader("Content-Type", "text/plain; charset=utf-8")
		const prettyResult = result.error
			? `❌ errorType: ${result.errorType}\n\n${result.error}`
			: `✅ success: true\nresult: ${typeof result.result === "object" ? JSON.stringify(result.result, null, 2).replace(/\\n/g, "\n") : result.result}`
		res.end(`[Request #${id}]\n${prettyResult}\n`)
	} else {
		res.setHeader("Content-Type", "application/json; charset=utf-8")
		res.end(JSON.stringify({ id, ...result }, null, 2) + "\n")
	}
}

async function evalInServer(code: string): Promise<EvalResult> {
	try {
		const wrapped = `(async () => { return await (eval(${JSON.stringify(code)})); })()`
		let raw = vm.runInContext(wrapped, eval2Context, { timeout: 5000 })
		if (raw && typeof (raw as { then?: unknown }).then === "function") {
			raw = await Promise.race([
				raw as Promise<unknown>,
				new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000))
			])
		}
		return makeSuccessResult(normalizeResult(raw))
	} catch (err: unknown) {
		return makeErrorResult(err)
	}
}

async function handleEval(
	req: IncomingMessage,
	res: ServerResponse,
	executor: (code: string, id: number) => Promise<EvalResult>
) {
	if (req.method !== "POST") {
		sendJson(res, 405, { success: false, errorType: "method", result: null, error: "Method not allowed" })
		return
	}

	const id = ++requestId
	const body = await readBody(req)

	try {
		const url = new URL(req.url || "", `http://${req.headers.host}`)
		const pwd = parsePwd(url)
		if (pwd !== "shikeik666") {
			sendJson(res, 403, { success: false, errorType: "auth", result: null, error: "Forbidden" })
			return
		}
		if (!body) {
			sendJson(res, 400, { success: false, errorType: "input", result: null, error: "Missing code" })
			return
		}

		const result = await executor(body, id)
		sendResult(res, id, result, url.searchParams.has("pretty"))
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err)
		sendJson(res, 500, { success: false, errorType: "server", result: null, error: message })
	}
}

export const apiEvalPlugin = {
	name: "api-eval-bridge",

	configureServer(server: ViteDevServer) {
		// /api/eval -> 浏览器执行
		server.middlewares.use("/api/eval", async (req, res) => {
			await handleEval(req, res, async (code, id) => {
				const responsePromise = new Promise<unknown>((resolve) => {
					pendingRequests.set(id, { resolve })
					setTimeout(() => {
						if (pendingRequests.has(id)) {
							pendingRequests.delete(id)
							resolve({ success: false, errorType: "timeout", result: null, error: "Timeout waiting for browser response" })
						}
					}, 5000)
				})

				server.ws.send("api-eval-request", { id, code })
				return await responsePromise as EvalResult
			})
		})

		// /api/eval2 -> 服务端 Node 执行
		server.middlewares.use("/api/eval2", async (req, res) => {
			await handleEval(req, res, evalInServer)
		})

		// 接收浏览器响应
		server.ws.on("api-eval-response", (data: { id: number } & EvalResult) => {
			const pending = pendingRequests.get(data.id)
			if (pending) {
				pendingRequests.delete(data.id)
				pending.resolve(data)
			}
		})
	}
}
