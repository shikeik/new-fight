export async function main(apiUrl, usageName) {
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

  const url = pretty ? apiUrl + "&pretty" : apiUrl

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
