import { execSync } from "node:child_process"

export async function main(defaultUrl, usageName) {
  const args = process.argv.slice(2)
  const pretty = args.includes("-p") || args.includes("--pretty")
  const codeArg = args.filter((a) => a !== "-p" && a !== "--pretty")[0]

  let code = ""
  if (codeArg) {
    code = codeArg
  } else {
    process.stdin.setEncoding("utf8")
    for await (const chunk of process.stdin) {
      code += chunk
    }
    code = code.replace(/\n$/, "")
  }

  if (!code) {
    console.error(`用法: ${usageName} [-p] 'code'`)
    console.error(`       ${usageName} [-p] <<'EOF'`)
    console.error("       code...")
    console.error("       EOF")
    process.exit(1)
  }

  const apiUrl = process.env.EVAL_API_URL || defaultUrl
  const url = pretty ? apiUrl + "&pretty" : apiUrl

  try {
    const curlCmd = `curl -sk -X POST ${escapeShellArg(url)} -H "Content-Type: text/plain" -d ${escapeShellArg(code)}`
    const output = execSync(curlCmd, { encoding: "utf8" })
    console.log(output)
  } catch (err) {
    console.error("请求失败:", err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

function escapeShellArg(arg) {
  return "'" + arg.replace(/'/g, "'\"'\"'") + "'"
}
