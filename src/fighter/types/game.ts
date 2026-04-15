export interface InputState {
  x: number
  a: boolean
  b: boolean
  c: boolean
  s: boolean
  d: boolean
}

export interface GameConfig {
  g: number
  floorY: number
  dodgeSpeed: number
  enableEnemyAI: boolean
  cameraSafeRatio: number
  cameraLerpX: number
  cameraLerpZ: number
  cameraLerpY: number
  justWindow: number
  slowMoFactor: number
  slowMoDuration: number
  showRain: boolean
}

export type AppState = "MENU" | "PLAY" | "OVER"

