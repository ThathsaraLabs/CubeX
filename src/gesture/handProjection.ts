import type { GestureLandmark } from '../store/gestureStore'

export type ScenePoint = [number, number, number]
export const HAND_CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]] as const
const PALM = [0, 5, 9, 13, 17]
const TIPS = [4, 8, 12, 16, 20]
const CUBE_EDGE = 1.58
const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value))

const palmX = (hand: GestureLandmark[]) => PALM.reduce((sum, index) => sum + hand[index].x, 0) / PALM.length

export function projectHands(hands: GestureLandmark[][]): ScenePoint[][] {
  if (hands.length !== 2) return []
  const centers = hands.map(palmX)
  const middle = (centers[0] + centers[1]) / 2
  const span = Math.max(.18, Math.abs(centers[1] - centers[0]))
  return hands.map((hand) => hand.map((point) => [
    (point.x - middle) * (4.8 / span),
    -(point.y - .5) * 5.6,
    -.45 - point.z * 5.5,
  ]))
}

function nearestCubeSurface(point: ScenePoint): ScenePoint {
  const projected: ScenePoint = [clamp(point[0], CUBE_EDGE), clamp(point[1], CUBE_EDGE), clamp(point[2], CUBE_EDGE)]
  const distances = projected.map((value, axis) => Math.abs(CUBE_EDGE - Math.abs(value)) + Math.max(0, Math.abs(point[axis]) - CUBE_EDGE))
  const axis = distances.indexOf(Math.min(...distances))
  projected[axis] = Math.sign(point[axis] || 1) * CUBE_EDGE
  return projected
}

export function handContacts(projected: ScenePoint[][]) {
  return projected.flatMap((hand, handIndex) => TIPS.map((index) => {
    const point = hand[index]
    const surface = nearestCubeSurface(point)
    return { handIndex, index, point, surface, distance: Math.hypot(point[0] - surface[0], point[1] - surface[1], point[2] - surface[2]) }
  }).sort((a, b) => a.distance - b.distance).slice(0, 3))
}
