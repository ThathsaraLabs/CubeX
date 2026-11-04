import { describe, expect, it } from 'vitest'
import { Matrix4, PerspectiveCamera, Vector3 } from 'three'
import { hitCube, surfaceMove } from './surface'

const camera = new PerspectiveCamera(45, 1, .1, 100)
camera.position.set(0, 0, 8); camera.lookAt(0, 0, 0); camera.updateMatrixWorld()
describe('camera-aligned cube contact', () => {
  it('rejects points outside the cube instead of inventing contacts', () => {
    expect(hitCube({ x: .02, y: .02 }, camera, new Matrix4())).toBeNull()
  })
  it('selects F, R and B as the cube rotates', () => {
    for (const [angle, face] of [[0, 'F'], [-Math.PI / 2, 'R'], [Math.PI, 'B']] as const) {
      expect(hitCube({ x: .5, y: .5 }, camera, new Matrix4().makeRotationY(angle))?.face).toBe(face)
    }
  })
  it('respects cube scale', () => {
    expect(hitCube({ x: .8, y: .5 }, camera, new Matrix4())).toBeNull()
    expect(hitCube({ x: .8, y: .5 }, camera, new Matrix4().makeScale(1.38, 1.38, 1.38))?.face).toBe('F')
  })
  it('maps opposite tangential drags to inverse moves and ignores radial jitter', () => {
    const local = new Vector3(1, 0, 1.551)
    const hit = { face: 'F' as const, local, world: local.clone() }
    const start = { x: .65, y: .5 }
    expect(surfaceMove(hit, start, { x: .65, y: .6 }, camera, new Matrix4())).toBe('F')
    expect(surfaceMove(hit, start, { x: .65, y: .4 }, camera, new Matrix4())).toBe("F'")
    expect(surfaceMove(hit, start, { x: .7, y: .51 }, camera, new Matrix4())).toBeNull()
  })
})
