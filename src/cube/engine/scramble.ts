import type { Move, TurnBase } from './types'

const BASES: readonly TurnBase[] = ['U', 'D', 'L', 'R', 'F', 'B']
const SUFFIXES = ['', "'", '2'] as const
const axisOf = (base: TurnBase) => base === 'U' || base === 'D' ? 'y' : base === 'L' || base === 'R' ? 'x' : 'z'

export function createScramble(length = 20, random = Math.random): Move[] {
  const moves: Move[] = []
  while (moves.length < length) {
    const base = BASES[Math.floor(random() * BASES.length)]
    const previous = moves.at(-1)?.[0] as TurnBase | undefined
    if (previous && axisOf(previous) === axisOf(base)) continue
    const suffix = SUFFIXES[Math.floor(random() * SUFFIXES.length)]
    moves.push(`${base}${suffix}` as Move)
  }
  return moves
}
