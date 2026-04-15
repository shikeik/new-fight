import { ST } from "@/fighter/config/game-config.ts"
import type { Character } from "@/fighter/game/character.ts"

export type PartKey =
  | "body"
  | "head"
  | "armL"
  | "armR"
  | "legL"
  | "legR"

export type PartTransform = {
  x?: number
  y?: number
  z?: number
  px?: number
  py?: number
  pz?: number
}

export type AnimKeyFrame = {
  t: number
  parts: Partial<Record<PartKey, PartTransform>>
}

export type AnimTrack = {
  keyframes: AnimKeyFrame[]
  loop?: boolean
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function getPartValue(
  kfs: AnimKeyFrame[],
  part: PartKey,
  field: keyof PartTransform,
  t: number
): number | undefined {
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i]
    const b = kfs[i + 1]
    if (t >= a.t && t <= b.t) {
      const va = a.parts[part]?.[field]
      const vb = b.parts[part]?.[field]
      if (va === undefined && vb === undefined) return undefined
      if (va === undefined) return vb
      if (vb === undefined) return va
      const ratio = (t - a.t) / (b.t - a.t)
      return lerp(va, vb, ratio)
    }
  }
  const last = kfs[kfs.length - 1]
  return last.parts[part]?.[field]
}

export function applyAnim(
  char: Character,
  t: number,
  track: AnimTrack
): void {
  const kfs = track.keyframes
  if (!kfs.length) return

  const parts: PartKey[] = ["body", "head", "armL", "armR", "legL", "legR"]
  const partObj = {
    body: char.body,
    head: char.head,
    armL: char.armL,
    armR: char.armR,
    legL: char.legL,
    legR: char.legR,
  }

  for (const part of parts) {
    const obj = partObj[part]
    const rx = getPartValue(kfs, part, "x", t)
    const ry = getPartValue(kfs, part, "y", t)
    const rz = getPartValue(kfs, part, "z", t)
    if (rx !== undefined) obj.rotation.x = rx
    if (ry !== undefined) obj.rotation.y = ry
    if (rz !== undefined) obj.rotation.z = rz

    const px = getPartValue(kfs, part, "px", t)
    const py = getPartValue(kfs, part, "py", t)
    const pz = getPartValue(kfs, part, "pz", t)
    if (px !== undefined) obj.position.x = px
    if (py !== undefined) obj.position.y = py
    if (pz !== undefined) obj.position.z = pz
  }
}

// ================= 通用动画表 =================

const IDLE: AnimTrack = {
  loop: true,
  keyframes: [
    { t: 0, parts: { body: { py: 1.5 }, armL: { x: 0 }, armR: { x: 0 } } },
    { t: 0.3, parts: { body: { py: 1.56 }, armL: { x: 0.1 }, armR: { x: -0.1 } } },
    { t: 0.6, parts: { body: { py: 1.5 }, armL: { x: 0 }, armR: { x: 0 } } },
  ],
}

const WALK: AnimTrack = {
  loop: true,
  keyframes: [
    { t: 0, parts: { body: { py: 1.5 }, armL: { x: 0 }, armR: { x: 0 }, legL: { x: 0 }, legR: { x: 0 } } },
    { t: 0.1, parts: { body: { py: 1.65 }, armL: { x: 1.2 }, armR: { x: -1.2 }, legL: { x: -1.2 }, legR: { x: 1.2 } } },
    { t: 0.2, parts: { body: { py: 1.5 }, armL: { x: 0 }, armR: { x: 0 }, legL: { x: 0 }, legR: { x: 0 } } },
    { t: 0.3, parts: { body: { py: 1.65 }, armL: { x: -1.2 }, armR: { x: 1.2 }, legL: { x: 1.2 }, legR: { x: -1.2 } } },
    { t: 0.4, parts: { body: { py: 1.5 }, armL: { x: 0 }, armR: { x: 0 }, legL: { x: 0 }, legR: { x: 0 } } },
  ],
}

const JUMP: AnimTrack = {
  keyframes: [
    { t: 0, parts: { legL: { x: 0.5 }, legR: { x: -0.2 }, armL: { x: 0.8 }, armR: { x: -0.8 } } },
  ],
}

const FALL = JUMP

const BLOCK: AnimTrack = {
  keyframes: [
    { t: 0, parts: { armL: { x: -1.8, z: 0.6 }, armR: { x: -1.8, z: -0.6 }, body: { x: 0.3 } } },
  ],
}

const DASH: AnimTrack = {
  keyframes: [
    { t: 0, parts: { body: { x: 0.7 }, armL: { x: 1.2 }, armR: { x: 1.2 }, head: { x: -0.6 } } },
  ],
}

const HURT: AnimTrack = {
  keyframes: [
    { t: 0, parts: { body: { x: -0.8 }, head: { x: 0.5 }, armL: { x: -0.5 }, armR: { x: -0.5 } } },
  ],
}

const DEAD: AnimTrack = {
  keyframes: [
    { t: 0, parts: { body: { x: -1.57, py: 0.6 }, legL: { x: 0 }, legR: { x: 0 } } },
  ],
}

const WIN: AnimTrack = {
  loop: true,
  keyframes: [
    { t: 0, parts: { body: { x: 0 }, armL: { z: 3.0 }, armR: { z: -3.0 }, head: { x: 0 } } },
    { t: 0.25, parts: { head: { x: 0.15 } } },
    { t: 0.5, parts: { head: { x: 0 } } },
  ],
}

const SKILL: AnimTrack = {
  keyframes: [
    { t: 0, parts: { armL: { x: 2.5 }, armR: { x: 2.5 } } },
    { t: 0.2, parts: { armL: { x: -1.5 }, armR: { x: -1.5 } } },
  ],
}

const JUMP_ATK: AnimTrack = {
  keyframes: [
    { t: 0, parts: { legL: { x: -0.5 }, legR: { x: 0.5 }, armR: { x: -3.0 }, body: { x: 0.5 } } },
  ],
}

const DASH_ATK: AnimTrack = {
  keyframes: [
    { t: 0, parts: { body: { x: 0.8 }, armR: { x: -1.8 }, armL: { x: 1.0 }, legL: { x: -0.8 }, legR: { x: 0.5 } } },
  ],
}

// ================= 类型差异化动画 =================

function atk1(type: number): AnimTrack {
  if (type === 2) {
    return {
      keyframes: [
        { t: 0, parts: { armR: { x: 0 }, body: { x: 0 } } },
        { t: 0.1, parts: { armR: { x: -3.0 }, body: { x: 0.3 } } },
        { t: 0.3, parts: { armR: { x: 0 }, body: { x: 0 } } },
      ],
    }
  }
  const isLeft = false // ATK1 默认右手
  const arm: PartKey = isLeft ? "armL" : "armR"
  const bodyY = isLeft ? 0.6 : -0.6
  return {
    keyframes: [
      { t: 0, parts: { [arm]: { x: 0 }, body: { y: 0 } } },
      { t: 0.1, parts: { [arm]: { x: -2.5 }, body: { y: bodyY } } },
      { t: 0.3, parts: { [arm]: { x: 0 }, body: { y: 0 } } },
    ],
  }
}

function atk2(type: number): AnimTrack {
  if (type === 2) {
    return atk1(type)
  }
  const arm: PartKey = "armL"
  return {
    keyframes: [
      { t: 0, parts: { [arm]: { x: 0 }, body: { y: 0 } } },
      { t: 0.1, parts: { [arm]: { x: -2.5 }, body: { y: 0.6 } } },
      { t: 0.3, parts: { [arm]: { x: 0 }, body: { y: 0 } } },
    ],
  }
}

function atk3(type: number): AnimTrack {
  if (type === 2) {
    return {
      keyframes: [
        { t: 0, parts: { armR: { x: 2.5 }, body: { x: -0.4 } } },
        { t: 0.2, parts: { armR: { x: -2.8 }, body: { x: 0.6 } } },
        { t: 0.5, parts: { armR: { x: 0 }, body: { x: 0 } } },
      ],
    }
  }
  return {
    keyframes: [
      { t: 0, parts: { armR: { x: 1.0 }, body: { py: 1.0 } } },
      { t: 0.2, parts: { armR: { x: -3.5 }, body: { py: 2.2 } } },
      { t: 0.5, parts: { armR: { x: 0 }, body: { py: 1.5 } } },
    ],
  }
}

function idle(type: number): AnimTrack {
  if (type === 2) {
    return {
      loop: true,
      keyframes: [
        { t: 0, parts: { body: { py: 1.5 }, armL: { x: 0 }, armR: { x: 0.5 } } },
        { t: 0.3, parts: { body: { py: 1.56 }, armL: { x: 0.1 }, armR: { x: 0.6 } } },
        { t: 0.6, parts: { body: { py: 1.5 }, armL: { x: 0 }, armR: { x: 0.5 } } },
      ],
    }
  }
  return IDLE
}

function walk(type: number): AnimTrack {
  if (type === 2) {
    return {
      loop: true,
      keyframes: [
        { t: 0, parts: { body: { py: 1.5 }, armL: { x: 0 }, armR: { x: 0.5 }, legL: { x: 0 }, legR: { x: 0 } } },
        { t: 0.1, parts: { body: { py: 1.65 }, armL: { x: 1.2 }, armR: { x: -0.7 }, legL: { x: -1.2 }, legR: { x: 1.2 } } },
        { t: 0.2, parts: { body: { py: 1.5 }, armL: { x: 0 }, armR: { x: 0.5 }, legL: { x: 0 }, legR: { x: 0 } } },
        { t: 0.3, parts: { body: { py: 1.65 }, armL: { x: -1.2 }, armR: { x: 1.7 }, legL: { x: 1.2 }, legR: { x: -1.2 } } },
        { t: 0.4, parts: { body: { py: 1.5 }, armL: { x: 0 }, armR: { x: 0.5 }, legL: { x: 0 }, legR: { x: 0 } } },
      ],
    }
  }
  return WALK
}

export function getAnimTrack(state: number, type: number): AnimTrack {
  switch (state) {
    case ST.IDLE:
      return idle(type)
    case ST.WALK:
      return walk(type)
    case ST.JUMP:
      return JUMP
    case ST.FALL:
      return FALL
    case ST.ATK1:
      return atk1(type)
    case ST.ATK2:
      return atk2(type)
    case ST.ATK3:
      return atk3(type)
    case ST.JUMP_ATK:
      return JUMP_ATK
    case ST.DASH_ATK:
      return DASH_ATK
    case ST.BLOCK:
      return BLOCK
    case ST.DASH:
      return DASH
    case ST.SKILL:
      return SKILL
    case ST.HURT:
      return HURT
    case ST.DEAD:
      return DEAD
    case ST.WIN:
      return WIN
    default:
      return IDLE
  }
}
