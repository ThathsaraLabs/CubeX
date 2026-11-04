import type { Move } from '../cube/engine'
import type { GestureLandmark } from '../store/gestureStore'

export interface PinchPoint { x: number; y: number }
export interface PinchState { active: boolean; point: PinchPoint; distance: number }

const PINCH_ON = .055
const PINCH_OFF = .075

export function readPinch(hand: GestureLandmark[], wasActive = false): PinchState {
  const thumb = hand[4]
  const index = hand[8]
  if (!thumb || !index) return { active: false, point: { x: 0, y: 0 }, distance: 1 }
  const distance = Math.hypot(index.x - thumb.x, index.y - thumb.y)
  return {
    active: distance < (wasActive ? PINCH_OFF : PINCH_ON),
    point: { x: (index.x + thumb.x) / 2, y: (index.y + thumb.y) / 2 },
    distance,
  }
}

export function faceAtPoint(point: PinchPoint): Move[0] {
  if (point.y < .34) return 'U'
  if (point.y > .66) return 'D'
  if (point.x < .32) return 'L'
  if (point.x > .68) return 'R'
  return 'F'
}

export function moveFromPinchDrag(start: PinchPoint, end: PinchPoint, minimumDistance = .075): Move | null {
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (Math.hypot(dx, dy) < minimumDistance) return null
  const face = faceAtPoint(start)
  const horizontal = Math.abs(dx) >= Math.abs(dy)
  const positive = horizontal ? dx > 0 : dy > 0
  const inverse = face === 'D' || face === 'L' ? positive : !positive
  return `${face}${inverse ? "'" : ''}` as Move
}
