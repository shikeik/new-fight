import type { GameConfig } from "../types/game.ts"

export const CFG: GameConfig = {
  g: -60,
  floorY: 0,
  dodgeSpeed: 30,
  enableEnemyAI: false,
  cameraSafeRatio: 0.75,
  cameraLerpX: 0.1,
  cameraLerpZ: 0.05,
  cameraLerpY: 0.1,
  justWindow: 0.12,
  slowMoFactor: 0.2,
  slowMoDuration: 0.3,
}

export const ST = {
  IDLE: 0,
  WALK: 1,
  JUMP: 2,
  FALL: 3,
  ATK1: 4,
  ATK2: 5,
  ATK3: 6,
  DASH: 7,
  SKILL: 8,
  BLOCK: 9,
  HURT: 10,
  DEAD: 11,
  WIN: 12,
  JUMP_ATK: 13,
  DASH_ATK: 14,
}

export const CHARACTER_NAMES = ["格斗家", "拳击手", "浪人"]
