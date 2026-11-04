import { Box3, Matrix4, Raycaster, Vector2, Vector3, type Camera } from 'three'
import { MOVE_DEFINITIONS, type Face, type Move } from '../cube/engine'
import type { PinchPoint } from './faceTurn'

const bounds = new Box3(new Vector3(-1.551, -1.551, -1.551), new Vector3(1.551, 1.551, 1.551))
export interface SurfaceHit { face: Face; local: Vector3; world: Vector3 }

/** Intersect the camera ray with the actual rotated and scaled cube. */
export function hitCube(point: PinchPoint, camera: Camera, matrix: Matrix4): SurfaceHit | null {
  const caster = new Raycaster()
  caster.setFromCamera(new Vector2(point.x * 2 - 1, 1 - point.y * 2), camera)
  const ray = caster.ray.clone().applyMatrix4(matrix.clone().invert())
  const local = ray.intersectBox(bounds, new Vector3())
  if (!local) return null
  const values = [Math.abs(local.x), Math.abs(local.y), Math.abs(local.z)]
  const axis = values.indexOf(Math.max(...values))
  const face: Face = axis === 0 ? (local.x > 0 ? 'R' : 'L') : axis === 1 ? (local.y > 0 ? 'U' : 'D') : (local.z > 0 ? 'F' : 'B')
  return { face, local, world: local.clone().applyMatrix4(matrix) }
}

/** Compare the drag to the projected tangent of a positive engine quarter turn. */
export function surfaceMove(hit: SurfaceHit, start: PinchPoint, end: PinchPoint, camera: Camera, matrix: Matrix4): Move | null {
  const definition = MOVE_DEFINITIONS[hit.face]
  const axis = new Vector3(); axis[definition.axis] = definition.quarterTurns
  const tangent = axis.cross(hit.local).multiplyScalar(.15)
  if (tangent.length() < .035) return null // face centre has no meaningful rotation tangent
  const origin = hit.local.clone().applyMatrix4(matrix).project(camera)
  const target = hit.local.clone().add(tangent).applyMatrix4(matrix).project(camera)
  const direction = new Vector2(target.x - origin.x, -(target.y - origin.y)).normalize()
  const drag = new Vector2(end.x - start.x, end.y - start.y)
  const distance = drag.dot(direction)
  if (Math.abs(distance) < .055) return null
  return `${hit.face}${distance < 0 ? "'" : ''}` as Move
}

export function cameraPoint(point: PinchPoint, camera: Camera): Vector3 {
  const caster = new Raycaster()
  caster.setFromCamera(new Vector2(point.x * 2 - 1, 1 - point.y * 2), camera)
  return caster.ray.at(camera.position.length(), new Vector3())
}
