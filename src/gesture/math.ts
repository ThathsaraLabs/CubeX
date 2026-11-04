import type { GesturePose } from '../store/gestureStore'

export interface Point { x: number; y: number }
export interface TwoHandFrame { left: Point; right: Point }
export interface GestureBaseline { frame: TwoHandFrame; pose: GesturePose }

const midpoint = ({ left, right }: TwoHandFrame): Point => ({ x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 })
const distance = ({ left, right }: TwoHandFrame) => Math.hypot(right.x - left.x, right.y - left.y)
const angle = ({ left, right }: TwoHandFrame) => Math.atan2(right.y - left.y, right.x - left.x)
const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value))
export const deadZone = (value: number, threshold: number) => Math.abs(value) <= threshold ? 0 : Math.sign(value) * (Math.abs(value) - threshold)

export function poseFromHands(frame: TwoHandFrame, baseline: GestureBaseline, sensitivity = 1): GesturePose {
  const currentMidpoint = midpoint(frame)
  const startMidpoint = midpoint(baseline.frame)
  const startDistance = Math.max(.08, distance(baseline.frame))
  return {
    x: baseline.pose.x + deadZone(currentMidpoint.y - startMidpoint.y, .018) * 3.4 * sensitivity,
    y: baseline.pose.y + deadZone(currentMidpoint.x - startMidpoint.x, .018) * 4.2 * sensitivity,
    z: baseline.pose.z + deadZone(angle(frame) - angle(baseline.frame), .035) * sensitivity,
    scale: clamp(baseline.pose.scale * (1 + deadZone(distance(frame) / startDistance - 1, .035) * sensitivity), .72, 1.38),
  }
}

export function smoothPose(previous: GesturePose, next: GesturePose, alpha = .18): GesturePose {
  return {
    x: previous.x + (next.x - previous.x) * alpha,
    y: previous.y + (next.y - previous.y) * alpha,
    z: previous.z + (next.z - previous.z) * alpha,
    scale: previous.scale + (next.scale - previous.scale) * alpha,
  }
}
