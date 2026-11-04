import { create } from 'zustand'

export interface GesturePose { x: number; y: number; z: number; scale: number }
export interface GestureLandmark { x: number; y: number; z: number }
export type GestureFace = 'U' | 'D' | 'L' | 'R' | 'F' | 'B' | null

interface GestureStore {
  enabled: boolean
  tracking: boolean
  handCount: number
  confidence: number
  hands: GestureLandmark[][]
  sensitivity: number
  calibrationId: number
  pinching: boolean
  activeFace: GestureFace
  pose: GesturePose
  setEnabled: (enabled: boolean) => void
  setTracking: (handCount: number, confidence: number) => void
  setPose: (pose: GesturePose) => void
  setHands: (hands: GestureLandmark[][]) => void
  setSensitivity: (sensitivity: number) => void
  recenter: () => void
  setPinch: (pinching: boolean, activeFace?: GestureFace) => void
  reset: () => void
}

const INITIAL_POSE: GesturePose = { x: -.12, y: .35, z: 0, scale: 1 }

export const useGestureStore = create<GestureStore>((set) => ({
  enabled: false, tracking: false, handCount: 0, confidence: 0, hands: [], sensitivity: 1, calibrationId: 0, pinching: false, activeFace: null, pose: INITIAL_POSE,
  setEnabled: (enabled) => set({ enabled, tracking: false, handCount: 0, confidence: 0, hands: [] }),
  setTracking: (handCount, confidence) => set({ handCount, confidence, tracking: handCount === 2 }),
  setPose: (pose) => set({ pose }),
  setHands: (hands) => set({ hands }),
  setSensitivity: (sensitivity) => set({ sensitivity }),
  recenter: () => set((state) => ({ pose: INITIAL_POSE, calibrationId: state.calibrationId + 1 })),
  setPinch: (pinching, activeFace = null) => set((state) => state.pinching === pinching && state.activeFace === activeFace ? state : { pinching, activeFace }),
  reset: () => set({ tracking: false, handCount: 0, confidence: 0, hands: [], pinching: false, activeFace: null, pose: INITIAL_POSE }),
}))
