import type { ColorId, Face } from '../cube/engine'

export interface RGB { r: number; g: number; b: number }
export interface ScanResult { samples: RGB[]; detectedGrid: boolean; confidence: number }
export type FaceScans = Partial<Record<Face, RGB[]>>
export interface ClassifiedScan { stickers: ColorId[]; confidence: number }
