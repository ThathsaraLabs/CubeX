import type { CubeState, Move } from '../cube/engine'
import type { SolverRequest, SolverResponse } from './messages'
import { toSolverFacelets } from './kociemba/validation'

interface SolutionResult { moves: Move[]; elapsedMs: number }

let worker: Worker | null = null
let requestId = 0
let rejectPending: (() => void) | null = null

function createWorker(): Worker {
  if (!worker) worker = new Worker(new URL('./solver.worker.ts', import.meta.url), { type: 'module' })
  return worker
}

export function solveCube(state: CubeState, onReady?: () => void): Promise<SolutionResult> {
  rejectPending?.()
  const facelets = toSolverFacelets(state)
  const id = ++requestId
  const activeWorker = createWorker()
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent<SolverResponse>) => {
      const message = event.data
      if (message.type === 'ready') { onReady?.(); return }
      if ('id' in message && message.id !== undefined && message.id !== id) return
      if (message.type === 'solution') { cleanup(); resolve({ moves: message.moves, elapsedMs: message.elapsedMs }) }
      if (message.type === 'error') { cleanup(); reject(new Error(message.message)) }
    }
    const onError = () => { cleanup(); reject(new Error('Solver worker failed to load.')) }
    const cleanup = () => { activeWorker.removeEventListener('message', onMessage); activeWorker.removeEventListener('error', onError); rejectPending = null }
    rejectPending = () => { cleanup(); reject(new Error('Solving cancelled.')) }
    activeWorker.addEventListener('message', onMessage)
    activeWorker.addEventListener('error', onError)
    activeWorker.postMessage({ type: 'solve', id, facelets } satisfies SolverRequest)
  })
}

export function cancelSolver() {
  rejectPending?.()
  worker?.terminate()
  worker = null
  requestId += 1
}
