import { describe, expect, it } from 'vitest'
import { deadZone, poseFromHands, smoothPose } from './math'

const base = { frame: { left: { x: .3, y: .5 }, right: { x: .7, y: .5 } }, pose: { x: 0, y: 0, z: 0, scale: 1 } }

describe('two-hand gesture mapping', () => {
  it('maps horizontal midpoint movement to yaw', () => {
    expect(poseFromHands({ left: { x: .4, y: .5 }, right: { x: .8, y: .5 } }, base).y).toBeCloseTo(.3444)
  })

  it('maps hand separation to zoom with safety bounds', () => {
    expect(poseFromHands({ left: { x: .1, y: .5 }, right: { x: .9, y: .5 } }, base).scale).toBe(1.38)
  })

  it('smooths noisy pose changes', () => {
    expect(smoothPose(base.pose, { x: 1, y: 1, z: 1, scale: 1.2 }, .2)).toEqual({ x: .2, y: .2, z: .2, scale: 1.04 })
  })

  it('ignores tiny jitter and applies sensitivity', () => {
    expect(deadZone(.01, .02)).toBe(0)
    expect(poseFromHands({ left: { x: .31, y: .5 }, right: { x: .71, y: .5 } }, base).y).toBe(0)
    const gentle = poseFromHands({ left: { x: .4, y: .5 }, right: { x: .8, y: .5 } }, base, .65)
    const fast = poseFromHands({ left: { x: .4, y: .5 }, right: { x: .8, y: .5 } }, base, 1.35)
    expect(fast.y).toBeGreaterThan(gentle.y)
  })
})
