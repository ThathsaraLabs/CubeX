import { FACE_ORDER, type ColorId } from '../cube/engine'
import type { ClassifiedScan, FaceScans, RGB } from './types'

const distance = (left: RGB, right: RGB) => {
  const red = left.r - right.r
  const green = left.g - right.g
  const blue = left.b - right.b
  return red * red * .3 + green * green * .59 + blue * blue * .11
}

export function classifyScans(scans: FaceScans): ClassifiedScan {
  const missing = FACE_ORDER.filter((face) => !scans[face] || scans[face]?.length !== 9)
  if (missing.length) throw new Error(`Scan all six faces before importing: ${missing.join(', ')} remaining.`)
  const centers = new Map(FACE_ORDER.map((face) => [face, scans[face]![4]]))
  let totalConfidence = 0
  const stickers = FACE_ORDER.flatMap((face) => scans[face]!.map((sample, index) => {
    if (index === 4) return face
    const ranked = FACE_ORDER.map((color) => ({ color, distance: distance(sample, centers.get(color)!) })).sort((a, b) => a.distance - b.distance)
    const separation = ranked[1].distance - ranked[0].distance
    totalConfidence += Math.max(0, Math.min(1, separation / Math.max(1, ranked[1].distance)))
    return ranked[0].color
  })) as ColorId[]
  return { stickers, confidence: totalConfidence / 48 }
}
