import Cube from 'cubejs'
import { FACE_ORDER, type CubeState, type ValidationResult } from './types'
import { validateCubeState } from './state'

const parity = (permutation: readonly number[]) => {
  let inversions = 0
  for (let left = 0; left < permutation.length; left += 1) {
    for (let right = left + 1; right < permutation.length; right += 1) if (permutation[left] > permutation[right]) inversions += 1
  }
  return inversions % 2
}

export function validatePhysicalState(state: CubeState): ValidationResult {
  const inventory = validateCubeState(state)
  const errors = [...inventory.errors]
  if (!inventory.valid) return { valid: false, errors }

  FACE_ORDER.forEach((face, index) => {
    if (state.stickers[index * 9 + 4] !== face) errors.push(`${face} must be the center of the ${face} face.`)
  })
  if (errors.length) return { valid: false, errors }

  const cube = Cube.fromString(state.stickers.join(''))
  if (new Set(cube.cp).size !== 8) errors.push('Corner color combinations contain a duplicate or impossible piece.')
  if (new Set(cube.ep).size !== 12) errors.push('Edge color combinations contain a duplicate or impossible piece.')
  if (cube.co.reduce((sum, value) => sum + value, 0) % 3 !== 0) errors.push('Corner orientation is impossible: a single corner cannot be twisted.')
  if (cube.eo.reduce((sum, value) => sum + value, 0) % 2 !== 0) errors.push('Edge orientation is impossible: a single edge cannot be flipped.')
  if (parity(cube.cp) !== parity(cube.ep)) errors.push('Permutation parity is impossible: two pieces cannot be swapped alone.')
  return { valid: errors.length === 0, errors }
}
