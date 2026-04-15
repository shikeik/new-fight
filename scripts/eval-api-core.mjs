import { createInterface } from "node:readline"
import { readFileSync } from "node:fs"

export async function main(defaultUrl, usageName) {
  const args = process.argv.slice(2)
  const pretty = args.includes("-p") || args.includes("--pretty")
  const codeArg = args.filter((a) => a !== "-p" && a !== "--pretty")[0]

  let code = ""
  if (codeArg) {
    code = codeArg
  } else if (!process.stdin.isTTY) {
    process.stdin.setEncoding("utf8")
    for await (const chunk of process.stdin) {
      code += chunk
    }
    code = code.replace(/\n$/, "")
  } else {
    console.log("> 输入代码，最后一行输入 EOF 后回车提交：")
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const lines = []
    for await (const line of rl) {
      if (line.trim() === "EOF") break
      lines.push(line)
    }
    code = lines.join("\n")
  }

  if (!code) {
    console.error(`用法: ${usageName} [-p] 'code'`)
    console.error(`       ${usageName} [-p]`)
    console.error("       （进入交互模式，输入 EOF 结束）")
    process.exit(1)
  }

  const apiUrl = process.env.EVAL_API_URL || defaultUrl
  const url = pretty ? apiUrl + "&pretty" : apiUrl

  try {
    const output = await postWithFallback(url, code)
    console.log(output)
  } catch (err) {
    console.error("请求失败:", err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

async function postWithFallback(url, code) {
  const urls = [url]

  if (url.startsWith("https://")) {
    urls.push(url.replace(/^https:\/\//, "http://"))
  }

  const wslHost = getWslHostIp()
  if (wslHost && (/localhost|127\.0\.0\.1/).test(url)) {
    const wslHttps = url.replace(/localhost|127\.0\.0\.1/, wslHost)
    if (!urls.includes(wslHttps)) {
      urls.push(wslHttps)
    }
    const wslHttp = wslHttps.replace(/^https:\/\//, "http://")
    if (!urls.includes(wslHttp)) {
      urls.push(wslHttp)
    }
  }

  const errors = []
  let triedInsecure = false

  for (const u of urls) {
    try {
      return await doFetch(u, code)
    } catch (e) {
      const cause = e.cause?.message || ""
      if (cause.includes("self-signed certificate") && !triedInsecure) {
        triedInsecure = true
        try {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
          return await doFetch(u, code)
        } catch (e2) {
          errors.push(`${u} (insecure) -> ${e2.message}`)
        }
      } else {
        errors.push(`${u} -> ${e.message}`)
      }
    }
  }

  throw new Error(errors.join("; "))
}

function getWslHostIp() {
  try {
    const content = readFileSync("/etc/resolv.conf", "utf8")
    const m = content.match(/nameserver\s+([\d.]+)/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

async function doFetch(url, code) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: code,
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return text
}
