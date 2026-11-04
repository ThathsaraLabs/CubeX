import { describe, expect, it } from 'vitest'
import { applyMove, createSolvedState, FACE_ORDER, statesEqual, type Move } from '../../cube/engine'
import { applyStickerPermutation, permutationCyclesForMove, permutationForMove } from './permutation'

const MOVES = FACE_ORDER.flatMap((face) => [face, `${face}'`, `${face}2`] as Move[])
  .concat(['M', "M'", 'M2', 'E', "E'", 'E2', 'S', "S'", 'S2']) as Move[]

describe('sticker permutation engine', () => {
  it.each(MOVES)('%s exactly reproduces the cube engine', (move) => {
    const state = createSolvedState()
    expect(statesEqual(applyStickerPermutation(state, permutationForMove(move)), applyMove(state, move))).toBe(true)
  })

  it.each(MOVES)('%s is a bijection of all 54 sticker slots', (move) => {
    const permutation = permutationForMove(move)
    expect(new Set(permutation).size).toBe(54)
    expect(permutation.every((destination) => destination >= 0 && destination < 54)).toBe(true)
  })

  it('represents a face quarter turn as five nontrivial cycles', () => {
    expect(permutationCyclesForMove('R').map((cycle) => cycle.length).sort()).toEqual([4, 4, 4, 4, 4])
  })
})
