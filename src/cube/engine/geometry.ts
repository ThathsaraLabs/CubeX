import { FACE_ORDER, type Axis, type Face, type StickerSlot, type Vec3 } from './types'

const range = [-1, 0, 1] as const

function slotGeometry(face: Face, row: number, col: number): Pick<StickerSlot, 'position' | 'normal'> {
  const a = range[col]
  const b = range[row]
  switch (face) {
    case 'U': return { position: [a, 1, b], normal: [0, 1, 0] }
    case 'D': return { position: [a, -1, -b], normal: [0, -1, 0] }
    case 'F': return { position: [a, -b, 1], normal: [0, 0, 1] }
    case 'B': return { position: [-a, -b, -1], normal: [0, 0, -1] }
    case 'R': return { position: [1, -b, -a], normal: [1, 0, 0] }
    case 'L': return { position: [-1, -b, a], normal: [-1, 0, 0] }
  }
}

export const STICKER_SLOTS: readonly StickerSlot[] = FACE_ORDER.flatMap((face, faceIndex) =>
  Array.from({ length: 9 }, (_, localIndex) => {
    const row = Math.floor(localIndex / 3)
    const col = localIndex % 3
    return { index: faceIndex * 9 + localIndex, face, row, col, ...slotGeometry(face, row, col) }
  }),
)

const slotKey = (position: Vec3, normal: Vec3) => `${position.join(',')}|${normal.join(',')}`
const SLOT_LOOKUP = new Map(STICKER_SLOTS.map((slot) => [slotKey(slot.position, slot.normal), slot.index]))

export function rotateVector([x, y, z]: Vec3, axis: Axis, direction: 1 | -1): Vec3 {
  if (axis === 'x') return direction === 1 ? [x, -z, y] : [x, z, -y]
  if (axis === 'y') return direction === 1 ? [z, y, -x] : [-z, y, x]
  return direction === 1 ? [-y, x, z] : [y, -x, z]
}

export function destinationIndex(slot: StickerSlot, axis: Axis, direction: 1 | -1): number {
  const key = slotKey(rotateVector(slot.position, axis, direction), rotateVector(slot.normal, axis, direction))
  const destination = SLOT_LOOKUP.get(key)
  if (destination === undefined) throw new Error(`No sticker slot for transformed coordinate ${key}`)
  return destination
}

export const coordinateAt = (vector: Vec3, axis: Axis): number => vector[axis === 'x' ? 0 : axis === 'y' ? 1 : 2]
