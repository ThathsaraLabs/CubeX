import Cube from 'cubejs'
import 'cubejs/lib/solve'
import { beforeAll, describe, expect, it } from 'vitest'
import { applyMoves, createSolvedState, isSolved, parseAlgorithm } from '../../cube/engine'
import { toSolverFacelets } from './validation'

describe('Kociemba two-phase integration', () => {
  beforeAll(() => { Cube.initSolver() }, 60_000)

  it('solves an engine-generated scrambled state', () => {
    const scrambled = applyMoves(createSolvedState(), parseAlgorithm("R U2 F' L D2 B R2 U' F2 D"))
    const notation = Cube.fromString(toSolverFacelets(scrambled)).solve()
    const solved = applyMoves(scrambled, parseAlgorithm(notation))
    expect(notation.length).toBeGreaterThan(0)
    expect(isSolved(solved)).toBe(true)
  }, 30_000)
})
