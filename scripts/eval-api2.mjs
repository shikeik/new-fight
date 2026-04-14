#!/usr/bin/env node
// ========== eval-api2 CLI ==========
// 在服务端 Node.js 环境中执行 JS，无需浏览器打开

const API_URL = "http://127.0.0.1:5000/api/eval2?shikeik666"

async function main() {
	const args = process.argv.slice(2)
	const pretty = args.includes("-p") || args.includes("--pretty")
	const codeArg = args.filter(a => a !== "-p" && a !== "--pretty")[0]

	let code = ""
	if (codeArg) {
		code = codeArg
	} else {
		// 从 stdin 读取（支持 heredoc）
		process.stdin.setEncoding("utf8")
		for await (const chunk of process.stdin) {
			code += chunk
		}
		code = code.replace(/\n$/, "") // 去掉末尾换行
	}

	if (!code) {
		console.error("用法: eval-api2 [-p] 'code'")
		console.error("       eval-api2 [-p] <<'EOF'")
		console.error("       代码...")
		console.error("       EOF")
		process.exit(1)
	}

	const url = pretty ? API_URL + "&pretty" : API_URL

	try {
		const res = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "text/plain" },
			body: code,
		})

		const text = await res.text()
		console.log(text)
	} catch (err) {
		console.error("请求失败:", err.message)
		process.exit(1)
	}
}

main()
