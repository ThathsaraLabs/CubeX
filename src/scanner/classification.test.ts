import { describe, expect, it } from 'vitest'
import { FACE_ORDER } from '../cube/engine'
import { classifyScans } from './classification'

const colors = {
  U: { r: 235, g: 235, b: 230 }, R: { r: 210, g: 45, b: 40 }, F: { r: 50, g: 180, b: 80 },
  D: { r: 235, g: 205, b: 45 }, L: { r: 235, g: 110, b: 35 }, B: { r: 45, g: 90, b: 210 },
}

describe('scan color classification', () => {
  it('calibrates all stickers against the six center samples', () => {
    const scans = Object.fromEntries(FACE_ORDER.map((face) => [face, Array.from({ length: 9 }, () => colors[face])]))
    const result = classifyScans(scans)
    expect(result.stickers).toEqual(FACE_ORDER.flatMap((face) => Array(9).fill(face)))
    expect(result.confidence).toBeGreaterThan(.9)
  })
})
