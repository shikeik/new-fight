export interface TickTask {
  id: string | number
  fn: (dt: number) => void
}

const tasks: TickTask[] = []

export const modTick = {
  add(id: string | number, fn: (dt: number) => void) {
    tasks.push({ id, fn })
    return id
  },
  remove(id: string | number) {
    const idx = tasks.findIndex((t) => t.id === id)
    if (idx >= 0) tasks.splice(idx, 1)
  },
  clear() {
    tasks.length = 0
  },
  list() {
    return tasks.map((t) => t.id)
  },
  getTasks() {
    return tasks
  },
}

// 保持 eval-api 向后兼容
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).modTick = modTick
}
