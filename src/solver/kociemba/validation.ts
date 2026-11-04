import { FACE_ORDER, type CubeState } from '../../cube/engine'

export function toSolverFacelets(state: CubeState): string {
  if (state.stickers.length !== 54) throw new Error('The solver requires exactly 54 stickers.')
  const facelets = state.stickers.join('')
  for (let face = 0; face < FACE_ORDER.length; face += 1) {
    if (state.stickers[face * 9 + 4] !== FACE_ORDER[face]) {
      throw new Error('Reorient the cube before solving: center stickers must be U, R, F, D, L, B.')
    }
  }
  for (const color of FACE_ORDER) {
    if ([...facelets].filter((value) => value === color).length !== 9) throw new Error(`The solver requires exactly nine ${color} stickers.`)
  }
  return facelets
}
