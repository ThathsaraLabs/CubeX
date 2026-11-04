import type { Move, TurnBase } from './types'

const MOVE_PATTERN = /^([UDLRFBMES])([2']?)$/

export function parseAlgorithm(input: string): Move[] {
  const tokens = input.trim().split(/\s+/).filter(Boolean)
  return tokens.map((token) => {
    const match = token.toUpperCase().match(MOVE_PATTERN)
    if (!match) throw new Error(`Invalid move “${token}”. Use U D L R F B M E S with optional ' or 2.`)
    return `${match[1] as TurnBase}${match[2]}` as Move
  })
}

export const formatAlgorithm = (moves: readonly Move[]): string => moves.join(' ')
