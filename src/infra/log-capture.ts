interface LogEntry {
  time: string
  level: string
  message: string
}

const allLogs: LogEntry[] = []

function serialize(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === "object") {
        try {
          return JSON.stringify(a)
        } catch {
          return String(a)
        }
      }
      return String(a)
    })
    .join(" ")
}

function pushLog(level: string, message: string) {
  allLogs.push({ time: new Date().toLocaleTimeString(), level, message })
}

function hook(level: string, orig: (...args: unknown[]) => void) {
  return function (this: unknown, ...args: unknown[]) {
    orig.apply(this, args)
    pushLog(level, serialize(args))
  }
}

if (typeof console !== "undefined") {
  console.log = hook("log", console.log)
  console.info = hook("info", console.info)
  console.warn = hook("warn", console.warn)
  console.error = hook("error", console.error)

  const origTable = console.table
  console.table = function (data: unknown, columns?: string[]) {
    const args: [unknown, string[] | undefined] = [data, columns]
    origTable.apply(this, args)
    try {
      pushLog("table", JSON.stringify({ data, columns }))
    } catch {
      // ignore
    }
  }
}

if (typeof window !== "undefined") {
  window.onerror = (msg, url, line, col, err) => {
    const text = err && err.stack ? err.stack : `${msg} at ${url}:${line}:${col}`
    pushLog("error", "[UNCAUGHT] " + text)
  }
  window.onunhandledrejection = (e: { reason?: { stack?: string } }) => {
    const reason = e.reason && e.reason.stack ? e.reason.stack : String(e.reason)
    pushLog("error", "[UNHANDLED REJECTION] " + reason)
  }
}

export const logs = {
  all() {
    return [...allLogs]
  },
  last(n = 10) {
    return allLogs.slice(-n)
  },
  first(n = 10) {
    return allLogs.slice(0, n)
  },
  byLevel(level: string) {
    return allLogs.filter((l) => l.level === level)
  },
  byTime(start: string, end: string) {
    return allLogs.filter((l) => l.time >= start && l.time <= end)
  },
  search(kw: string) {
    return allLogs.filter((l) => l.message.includes(kw))
  },
  clear() {
    allLogs.length = 0
    return true
  },
}

if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).logs = logs
}
