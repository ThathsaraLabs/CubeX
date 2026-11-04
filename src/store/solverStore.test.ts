import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('../solver/client', () => ({ cancelSolver: vi.fn(), solveCube: vi.fn() }))
import { solveCube } from '../solver/client'
import { useCubeStore } from './cubeStore'
import { useSolverStore } from './solverStore'

beforeEach(() => { useCubeStore.getState().reset(); useSolverStore.getState().clear(); vi.clearAllMocks() })
describe('solution ownership', () => {
  it('invalidates a solution after an external cube edit', () => {
    useSolverStore.setState({ status: 'ready', solution: ['R'], cursor: 0 })
    useCubeStore.getState().apply('U')
    expect(useSolverStore.getState().solution).toEqual([])
    expect(useSolverStore.getState().status).toBe('idle')
  })
  it('keeps the solution when stepping forward and backward', () => {
    useSolverStore.setState({ status: 'ready', solution: ['R', 'U'], cursor: 0 })
    useSolverStore.getState().stepForward()
    expect(useSolverStore.getState().cursor).toBe(1)
    expect(useSolverStore.getState().solution).toEqual(['R', 'U'])
    useSolverStore.getState().stepBackward()
    expect(useSolverStore.getState().cursor).toBe(0)
  })
  it('discards an asynchronous result after cancellation', async () => {
    useCubeStore.getState().apply('R')
    let resolve!: (value: { moves: ['R']; elapsedMs: number }) => void
    vi.mocked(solveCube).mockImplementationOnce(() => new Promise((done) => { resolve = done }))
    const pending = useSolverStore.getState().solve()
    useSolverStore.getState().cancel()
    resolve({ moves: ['R'], elapsedMs: 20 }); await pending
    expect(useSolverStore.getState().status).toBe('idle')
    expect(useSolverStore.getState().solution).toEqual([])
  })
})
