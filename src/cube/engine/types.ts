export const FACE_ORDER = ['U', 'R', 'F', 'D', 'L', 'B'] as const
export type Face = (typeof FACE_ORDER)[number]
export type ColorId = Face
export type Axis = 'x' | 'y' | 'z'
export type TurnBase = Face | 'M' | 'E' | 'S'
export type Move = `${TurnBase}` | `${TurnBase}'` | `${TurnBase}2`
export type Vec3 = readonly [number, number, number]

export interface StickerSlot {
  readonly index: number
  readonly face: Face
  readonly row: number
  readonly col: number
  readonly position: Vec3
  readonly normal: Vec3
}

export interface CubeState {
  readonly stickers: readonly ColorId[]
}

export interface ValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
}

export interface MoveDefinition {
  readonly axis: Axis
  readonly layer: -1 | 0 | 1
  readonly quarterTurns: 1 | -1
}
