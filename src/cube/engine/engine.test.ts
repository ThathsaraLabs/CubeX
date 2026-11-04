import { describe, expect, it } from 'vitest'
import { applyMove, applyMoves, createScramble, createSolvedState, FACE_ORDER, invertAlgorithm, isSolved, parseAlgorithm, statesEqual, validateCubeState, type Move } from '.'

const ALL_BASES = [...FACE_ORDER, 'M', 'E', 'S'] as const

describe('cube move engine', () => {
  it.each(ALL_BASES)('%s repeated four times is identity', (base) => {
    const moves = Array<Move>(4).fill(base)
    expect(statesEqual(applyMoves(createSolvedState(), moves), createSolvedState())).toBe(true)
  })

  it.each(ALL_BASES)('%s followed by its inverse is identity', (base) => {
    expect(isSolved(applyMoves(createSolvedState(), [base, `${base}'` as Move]))).toBe(true)
  })

  it('restores an arbitrary algorithm with its inverse', () => {
    const algorithm = parseAlgorithm("R U R' U' F2 M E' S")
    const transformed = applyMoves(createSolvedState(), [...algorithm, ...invertAlgorithm(algorithm)])
    expect(statesEqual(transformed, createSolvedState())).toBe(true)
  })

  it('preserves the sticker inventory for every move', () => {
    let state = createSolvedState()
    for (const base of ALL_BASES) state = applyMove(state, `${base}2` as Move)
    expect(validateCubeState(state)).toEqual({ valid: true, errors: [] })
  })

  it('rejects invalid notation', () => {
    expect(() => parseAlgorithm('R X U3')).toThrow(/Invalid move/)
  })

  it('creates a scramble without consecutive moves on the same axis', () => {
    const scramble = createScramble(30)
    const axis = (move: Move) => 'UD'.includes(move[0]) ? 'y' : 'LR'.includes(move[0]) ? 'x' : 'z'
    expect(scramble).toHaveLength(30)
    scramble.slice(1).forEach((move, index) => expect(axis(move)).not.toBe(axis(scramble[index])))
  })
})
