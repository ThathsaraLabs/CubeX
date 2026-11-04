import { create } from 'zustand'
import {
  applyMove,
  applyMoves,
  createScramble,
  createSolvedState,
  invertMove,
  parseAlgorithm,
  type CubeState,
  type Move,
} from '../cube/engine'

interface CubeStore {
  state: CubeState
  history: Move[]
  future: Move[]
  lastMove: Move | null
  transition: { id: number; from: CubeState; move: Move } | null
  apply: (move: Move) => void
  runAlgorithm: (notation: string) => void
  scramble: () => void
  reset: () => void
  undo: () => void
  redo: () => void
  replaceState: (state: CubeState) => void
  setSticker: (index: number, color: CubeState['stickers'][number]) => void
}

let transitionId = 0

export const useCubeStore = create<CubeStore>((set, get) => ({
  state: createSolvedState(),
  history: [],
  future: [],
  lastMove: null,
  transition: null,
  apply: (move) => set(({ state, history }) => ({
    state: applyMove(state, move),
    history: [...history, move],
    future: [],
    lastMove: move,
    transition: { id: ++transitionId, from: state, move },
  })),
  runAlgorithm: (notation) => {
    const moves = parseAlgorithm(notation)
    set(({ state, history }) => ({
      state: applyMoves(state, moves),
      history: [...history, ...moves],
      future: [],
      lastMove: moves.at(-1) ?? null,
      transition: null,
    }))
  },
  scramble: () => {
    const moves = createScramble()
    set({ state: applyMoves(createSolvedState(), moves), history: moves, future: [], lastMove: moves.at(-1) ?? null, transition: null })
  },
  reset: () => set({ state: createSolvedState(), history: [], future: [], lastMove: null, transition: null }),
  undo: () => {
    const { history, state, future } = get()
    const move = history.at(-1)
    if (!move) return
    set({
      state: applyMove(state, invertMove(move)),
      history: history.slice(0, -1),
      future: [move, ...future],
      lastMove: invertMove(move),
      transition: { id: ++transitionId, from: state, move: invertMove(move) },
    })
  },
  redo: () => {
    const { history, state, future } = get()
    const move = future[0]
    if (!move) return
    set({ state: applyMove(state, move), history: [...history, move], future: future.slice(1), lastMove: move, transition: { id: ++transitionId, from: state, move } })
  },
  replaceState: (state) => set({ state: { stickers: [...state.stickers] }, history: [], future: [], lastMove: null, transition: null }),
  setSticker: (index, color) => set(({ state }) => {
    const stickers = [...state.stickers]
    stickers[index] = color
    return { state: { stickers }, history: [], future: [], lastMove: null, transition: null }
  }),
}))
