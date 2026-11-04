import { create } from 'zustand'
import { invertMove, isSolved, type Move } from '../cube/engine'
import { cancelSolver, solveCube } from '../solver/client'
import { useCubeStore } from './cubeStore'

type SolverStatus = 'idle' | 'initializing' | 'solving' | 'ready' | 'playing' | 'paused' | 'complete' | 'error'

interface SolverStore {
  status: SolverStatus
  solution: Move[]
  cursor: number
  speed: number
  elapsedMs: number | null
  error: string | null
  solve: () => Promise<void>
  play: () => void
  pause: () => void
  stepForward: () => void
  stepBackward: () => void
  setSpeed: (speed: number) => void
  clear: () => void
  cancel: () => void
}

let playbackTimer: ReturnType<typeof setTimeout> | null = null
let internalMove = false
let requestId = 0
function applyPlaybackMove(move: Move) {
  internalMove = true
  try { useCubeStore.getState().apply(move) } finally { internalMove = false }
}
const stopTimer = () => { if (playbackTimer) clearTimeout(playbackTimer); playbackTimer = null }

function advance() {
  const store = useSolverStore.getState()
  const move = store.solution[store.cursor]
  if (!move) { stopTimer(); useSolverStore.setState({ status: 'complete' }); return }
  applyPlaybackMove(move)
  const cursor = store.cursor + 1
  const complete = cursor >= store.solution.length
  useSolverStore.setState({ cursor, status: complete ? 'complete' : store.status })
  if (!complete && store.status === 'playing') playbackTimer = setTimeout(advance, store.speed)
}

export const useSolverStore = create<SolverStore>((set, get) => ({
  status: 'idle', solution: [], cursor: 0, speed: 600, elapsedMs: null, error: null,
  solve: async () => {
    stopTimer()
    const request = ++requestId
    const state = useCubeStore.getState().state
    if (isSolved(state)) { set({ status: 'complete', solution: [], cursor: 0, elapsedMs: 0, error: null }); return }
    set({ status: 'initializing', solution: [], cursor: 0, elapsedMs: null, error: null })
    try {
      const result = await solveCube(state, () => { if (request === requestId) set({ status: 'solving' }) })
      if (request !== requestId) return
      set({ status: 'ready', solution: result.moves, cursor: 0, elapsedMs: result.elapsedMs, error: null })
    } catch (cause) {
      if (request !== requestId) return
      set({ status: 'error', error: cause instanceof Error ? cause.message : 'Unable to solve this cube.' })
    }
  },
  play: () => {
    if (!get().solution.length || get().cursor >= get().solution.length) return
    stopTimer(); set({ status: 'playing' }); advance()
  },
  pause: () => { stopTimer(); set({ status: 'paused' }) },
  stepForward: () => { stopTimer(); if (get().cursor < get().solution.length) { set({ status: 'paused' }); advance() } },
  stepBackward: () => {
    stopTimer()
    const cursor = get().cursor
    if (cursor === 0) return
    applyPlaybackMove(invertMove(get().solution[cursor - 1]))
    set({ cursor: cursor - 1, status: 'paused' })
  },
  setSpeed: (speed) => set({ speed }),
  clear: () => { requestId += 1; stopTimer(); set({ status: 'idle', solution: [], cursor: 0, elapsedMs: null, error: null }) },
  cancel: () => { requestId += 1; stopTimer(); cancelSolver(); set({ status: 'idle', solution: [], cursor: 0, elapsedMs: null, error: null }) },
}))

// A solution only belongs to the state it was computed for.
useCubeStore.subscribe((next, previous) => {
  if (!internalMove && next.state !== previous.state) useSolverStore.getState().cancel()
})
