import { describe, expect, it } from 'vitest'
import { applyMoves, createSolvedState, parseAlgorithm } from '../../cube/engine'
import { toSolverFacelets } from './validation'

describe('solver facelet adapter', () => {
  it('exports the standard URFDLB facelet order', () => {
    expect(toSolverFacelets(createSolvedState())).toBe('U'.repeat(9) + 'R'.repeat(9) + 'F'.repeat(9) + 'D'.repeat(9) + 'L'.repeat(9) + 'B'.repeat(9))
  })

  it('accepts states produced by face turns', () => {
    expect(toSolverFacelets(applyMoves(createSolvedState(), parseAlgorithm("R U F2 L' D")))).toHaveLength(54)
  })

  it('rejects center orientations unsupported by the solver', () => {
    expect(() => toSolverFacelets(applyMoves(createSolvedState(), ['M']))).toThrow(/center stickers/)
  })
})
