import { describe, expect, it } from 'vitest'
import { applyMoves, createSolvedState, parseAlgorithm } from '.'
import { validatePhysicalState } from './physicalValidation'

describe('physical cube validation', () => {
  it('accepts a legal scrambled state', () => {
    expect(validatePhysicalState(applyMoves(createSolvedState(), parseAlgorithm("R U2 F' L D B2"))).valid).toBe(true)
  })

  it('rejects a single flipped edge', () => {
    const stickers = [...createSolvedState().stickers]
    ;[stickers[5], stickers[10]] = [stickers[10], stickers[5]]
    const result = validatePhysicalState({ stickers })
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/edge/i)
  })
})
