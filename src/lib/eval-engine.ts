/**
 * 统一的代码执行结果处理与错误分类逻辑
 * 被浏览器端 HMR Bridge 和服务端 /api/eval2 共用
 */

export type EvalResult = {
  success: boolean
  errorType: string | null
  result: unknown
  error: string | null
}

/** 将 eval 原始返回值统一序列化，避免循环引用或不可序列化对象导致后续 JSON 处理失败 */
export function normalizeResult(raw: unknown): unknown {
  if (raw === undefined) return undefined
  if (raw === null) return null
  if (typeof raw === "object") {
    try {
      return JSON.parse(JSON.stringify(raw))
    } catch {
      return String(raw)
    }
  }
  return raw
}

/** 统一错误分类：syntax / timeout / runtime */
export function classifyError(err: unknown): { error: string; errorType: string } {
  const error = err instanceof Error ? err.stack || err.message : String(err)
  const errorType =
    err instanceof SyntaxError
      ? "syntax"
      : err instanceof Error && err.message === "timeout"
        ? "timeout"
        : "runtime"
  return { error, errorType }
}

/** 组装标准 EvalResult（成功时调用） */
export function makeSuccessResult(result: unknown): EvalResult {
  return { success: true, errorType: null, result, error: null }
}

/** 组装标准 EvalResult（失败时调用） */
export function makeErrorResult(err: unknown): EvalResult {
  const { error, errorType } = classifyError(err)
  return { success: false, errorType, result: null, error }
}
