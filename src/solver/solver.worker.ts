/// <reference lib="webworker" />
import Cube from 'cubejs'
import 'cubejs/lib/solve'
import { parseAlgorithm } from '../cube/engine'
import type { SolverRequest, SolverResponse } from './messages'

let ready = false

function respond(message: SolverResponse) {
  self.postMessage(message)
}

self.onmessage = (event: MessageEvent<SolverRequest>) => {
  const request = event.data
  try {
    if (!ready) {
      Cube.initSolver()
      ready = true
      respond({ type: 'ready' })
    }
    if (request.type === 'solve') {
      const started = performance.now()
      const algorithm = Cube.fromString(request.facelets).solve()
      respond({ type: 'solution', id: request.id, moves: algorithm ? parseAlgorithm(algorithm) : [], elapsedMs: performance.now() - started })
    }
  } catch (cause) {
    respond({ type: 'error', id: request.type === 'solve' ? request.id : undefined, message: cause instanceof Error ? cause.message : 'The solver could not resolve this state.' })
  }
}
