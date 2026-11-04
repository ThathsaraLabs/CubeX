import { FACE_ORDER, type ColorId, type CubeState, type Face, type ValidationResult } from './types'

export const createSolvedState = (): CubeState => ({
  stickers: FACE_ORDER.flatMap((face) => Array<ColorId>(9).fill(face)),
})

export const isSolved = (state: CubeState): boolean => FACE_ORDER.every((_, faceIndex) => {
  const start = faceIndex * 9
  return state.stickers.slice(start, start + 9).every((color) => color === state.stickers[start])
})

export function faceStickers(state: CubeState, face: Face): readonly ColorId[] {
  const start = FACE_ORDER.indexOf(face) * 9
  return state.stickers.slice(start, start + 9)
}

export function validateCubeState(state: CubeState): ValidationResult {
  const errors: string[] = []
  if (state.stickers.length !== 54) errors.push(`Expected 54 stickers, received ${state.stickers.length}.`)

  const counts = new Map<ColorId, number>(FACE_ORDER.map((color) => [color, 0]))
  for (const color of state.stickers) {
    if (!FACE_ORDER.includes(color)) errors.push(`Unknown sticker color: ${String(color)}.`)
    else counts.set(color, (counts.get(color) ?? 0) + 1)
  }
  for (const color of FACE_ORDER) {
    if (counts.get(color) !== 9) errors.push(`${color} must occur exactly 9 times; found ${counts.get(color) ?? 0}.`)
  }
  return { valid: errors.length === 0, errors }
}

export const statesEqual = (a: CubeState, b: CubeState): boolean =>
  a.stickers.length === b.stickers.length && a.stickers.every((color, index) => color === b.stickers[index])
