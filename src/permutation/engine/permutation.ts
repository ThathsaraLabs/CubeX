import { coordinateAt, destinationIndex, MOVE_DEFINITIONS, STICKER_SLOTS, type CubeState, type Move, type TurnBase } from '../../cube/engine'

/** Maps each source sticker index to its destination index. */
export type StickerPermutation = readonly number[]

const identity = (): number[] => Array.from({ length: 54 }, (_, index) => index)

function quarterTurnPermutation(base: TurnBase): StickerPermutation {
  const definition = MOVE_DEFINITIONS[base]
  return STICKER_SLOTS.map((slot) =>
    coordinateAt(slot.position, definition.axis) === definition.layer
      ? destinationIndex(slot, definition.axis, definition.quarterTurns)
      : slot.index,
  )
}

export function composePermutations(first: StickerPermutation, second: StickerPermutation): StickerPermutation {
  return first.map((destination) => second[destination])
}

export function permutationForMove(move: Move): StickerPermutation {
  const base = move[0] as TurnBase
  const quarter = quarterTurnPermutation(base)
  const repetitions = move.endsWith('2') ? 2 : move.endsWith("'") ? 3 : 1
  let result: StickerPermutation = identity()
  for (let turn = 0; turn < repetitions; turn += 1) result = composePermutations(result, quarter)
  return result
}

export function cyclesForPermutation(permutation: StickerPermutation): number[][] {
  const visited = new Set<number>()
  const cycles: number[][] = []
  for (let start = 0; start < permutation.length; start += 1) {
    if (visited.has(start) || permutation[start] === start) continue
    const cycle: number[] = []
    let cursor = start
    while (!visited.has(cursor)) {
      visited.add(cursor)
      cycle.push(cursor)
      cursor = permutation[cursor]
    }
    cycles.push(cycle)
  }
  return cycles
}

export const permutationCyclesForMove = (move: Move): number[][] => cyclesForPermutation(permutationForMove(move))

export function applyStickerPermutation(state: CubeState, permutation: StickerPermutation): CubeState {
  const stickers = [...state.stickers]
  permutation.forEach((destination, source) => { stickers[destination] = state.stickers[source] })
  return { stickers }
}

export function stickerLabel(index: number): string {
  const slot = STICKER_SLOTS[index]
  return `${slot.face}${slot.row * 3 + slot.col + 1}`
}

export const formatCycles = (cycles: readonly (readonly number[])[]): string =>
  cycles.map((cycle) => `(${cycle.map(stickerLabel).join(' ')})`).join(' ')
