import { coordinateAt, destinationIndex, STICKER_SLOTS } from './geometry'
import type { CubeState, Move, MoveDefinition, TurnBase } from './types'

export const MOVE_DEFINITIONS: Readonly<Record<TurnBase, MoveDefinition>> = {
  U: { axis: 'y', layer: 1, quarterTurns: -1 },
  D: { axis: 'y', layer: -1, quarterTurns: 1 },
  L: { axis: 'x', layer: -1, quarterTurns: 1 },
  R: { axis: 'x', layer: 1, quarterTurns: -1 },
  F: { axis: 'z', layer: 1, quarterTurns: -1 },
  B: { axis: 'z', layer: -1, quarterTurns: 1 },
  M: { axis: 'x', layer: 0, quarterTurns: 1 },
  E: { axis: 'y', layer: 0, quarterTurns: 1 },
  S: { axis: 'z', layer: 0, quarterTurns: -1 },
}

const parseMove = (move: Move) => ({
  base: move[0] as TurnBase,
  turns: move.endsWith('2') ? 2 : move.endsWith("'") ? 3 : 1,
})

function applyQuarterTurn(state: CubeState, base: TurnBase): CubeState {
  const definition = MOVE_DEFINITIONS[base]
  const stickers = [...state.stickers]

  for (const slot of STICKER_SLOTS) {
    if (coordinateAt(slot.position, definition.axis) === definition.layer) {
      const destination = destinationIndex(slot, definition.axis, definition.quarterTurns)
      stickers[destination] = state.stickers[slot.index]
    }
  }
  return { stickers }
}

export function applyMove(state: CubeState, move: Move): CubeState {
  const { base, turns } = parseMove(move)
  let next = state
  for (let turn = 0; turn < turns; turn += 1) next = applyQuarterTurn(next, base)
  return next
}

export function applyMoves(state: CubeState, moves: readonly Move[]): CubeState {
  return moves.reduce(applyMove, state)
}

export function invertMove(move: Move): Move {
  if (move.endsWith('2')) return move
  return move.endsWith("'") ? (move[0] as Move) : (`${move}'` as Move)
}

export const invertAlgorithm = (moves: readonly Move[]): Move[] => [...moves].reverse().map(invertMove)
