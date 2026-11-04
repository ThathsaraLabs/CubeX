import { describe, expect, it } from 'vitest'
import { faceAtPoint, moveFromPinchDrag, readPinch } from './faceTurn'
import type { GestureLandmark } from '../store/gestureStore'

const hand = (thumb: [number, number], index: [number, number]): GestureLandmark[] => Array.from({ length: 21 }, (_, i) => ({ x: i === 4 ? thumb[0] : i === 8 ? index[0] : .5, y: i === 4 ? thumb[1] : i === 8 ? index[1] : .5, z: 0 }))

describe('pinch face turns', () => {
  it('uses hysteresis to keep a held pinch stable', () => {
    expect(readPinch(hand([.4, .4], [.44, .4])).active).toBe(true)
    expect(readPinch(hand([.4, .4], [.47, .4]), true).active).toBe(true)
    expect(readPinch(hand([.4, .4], [.48, .4]), true).active).toBe(false)
  })

  it('selects the nearest screen-facing cube region', () => {
    expect(faceAtPoint({ x: .5, y: .2 })).toBe('U')
    expect(faceAtPoint({ x: .2, y: .5 })).toBe('L')
    expect(faceAtPoint({ x: .5, y: .5 })).toBe('F')
  })

  it('requires a deliberate drag before emitting a move', () => {
    expect(moveFromPinchDrag({ x: .5, y: .2 }, { x: .52, y: .2 })).toBeNull()
    expect(moveFromPinchDrag({ x: .5, y: .2 }, { x: .62, y: .2 })).toBe('U')
  })
})
