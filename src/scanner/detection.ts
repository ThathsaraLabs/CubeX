import type { RGB, ScanResult } from './types'

interface Rect { x: number; y: number; width: number; height: number }

let cvPromise: Promise<any> | null = null

async function getOpenCv(): Promise<any> {
  if (!cvPromise) cvPromise = import('@techstark/opencv-js').then(async ({ default: module }) => {
    const cv = module instanceof Promise ? await module : module
    if (cv.Mat) return cv
    await new Promise<void>((resolve) => { cv.onRuntimeInitialized = () => resolve() })
    return cv
  })
  return cvPromise
}

function fallbackRects(width: number, height: number): Rect[] {
  const size = Math.min(width, height) * .66
  const cell = size / 3
  const offsetX = (width - size) / 2
  const offsetY = (height - size) / 2
  return Array.from({ length: 9 }, (_, index) => ({ x: offsetX + index % 3 * cell, y: offsetY + Math.floor(index / 3) * cell, width: cell, height: cell }))
}

function sampleRect(context: CanvasRenderingContext2D, rect: Rect): RGB {
  const inset = .28
  const x = Math.round(rect.x + rect.width * inset)
  const y = Math.round(rect.y + rect.height * inset)
  const width = Math.max(1, Math.round(rect.width * (1 - inset * 2)))
  const height = Math.max(1, Math.round(rect.height * (1 - inset * 2)))
  const pixels = context.getImageData(x, y, width, height).data
  let r = 0; let g = 0; let b = 0; let count = 0
  for (let index = 0; index < pixels.length; index += 16) { r += pixels[index]; g += pixels[index + 1]; b += pixels[index + 2]; count += 1 }
  return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) }
}

function normalizeGrid(rects: Rect[]): Rect[] | null {
  if (rects.length < 9) return null
  const largest = [...rects].sort((a, b) => b.width * b.height - a.width * a.height).slice(0, 14)
  const deduplicated = largest.filter((rect, index) => !largest.slice(0, index).some((other) => {
    const dx = rect.x + rect.width / 2 - (other.x + other.width / 2)
    const dy = rect.y + rect.height / 2 - (other.y + other.height / 2)
    return Math.hypot(dx, dy) < Math.min(rect.width, other.width) * .45
  })).slice(0, 9)
  if (deduplicated.length !== 9) return null
  const rows = [...deduplicated].sort((a, b) => a.y + a.height / 2 - (b.y + b.height / 2))
  return [0, 1, 2].flatMap((row) => rows.slice(row * 3, row * 3 + 3).sort((a, b) => a.x - b.x))
}

export async function detectFace(canvas: HTMLCanvasElement): Promise<ScanResult> {
  const cv = await getOpenCv()
  const source = cv.imread(canvas)
  const gray = new cv.Mat(); const blurred = new cv.Mat(); const edges = new cv.Mat()
  const contours = new cv.MatVector(); const hierarchy = new cv.Mat()
  try {
    cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0)
    cv.Canny(blurred, edges, 45, 130)
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)
    const minSize = Math.min(canvas.width, canvas.height) * .08
    const maxSize = Math.min(canvas.width, canvas.height) * .4
    const candidates: Rect[] = []
    for (let index = 0; index < contours.size(); index += 1) {
      const contour = contours.get(index)
      const perimeter = cv.arcLength(contour, true)
      const polygon = new cv.Mat()
      cv.approxPolyDP(contour, polygon, .035 * perimeter, true)
      if (polygon.rows === 4) {
        const rect = cv.boundingRect(polygon)
        const aspect = rect.width / rect.height
        if (rect.width >= minSize && rect.width <= maxSize && aspect > .72 && aspect < 1.28) candidates.push(rect)
      }
      polygon.delete(); contour.delete()
    }
    const grid = normalizeGrid(candidates)
    const rects = grid ?? fallbackRects(canvas.width, canvas.height)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Camera sampling canvas is unavailable.')
    return { samples: rects.map((rect) => sampleRect(context, rect)), detectedGrid: Boolean(grid), confidence: grid ? 1 : .55 }
  } finally {
    source.delete(); gray.delete(); blurred.delete(); edges.delete(); contours.delete(); hierarchy.delete()
  }
}
