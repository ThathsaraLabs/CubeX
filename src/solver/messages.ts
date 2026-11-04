import type { Move } from '../cube/engine'

export type SolverRequest =
  | { type: 'initialize' }
  | { type: 'solve'; id: number; facelets: string }

export type SolverResponse =
  | { type: 'ready' }
  | { type: 'solution'; id: number; moves: Move[]; elapsedMs: number }
  | { type: 'error'; id?: number; message: string }
