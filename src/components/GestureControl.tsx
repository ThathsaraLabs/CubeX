import { useEffect, useRef, useState } from 'react'
import type { HandLandmarker, HandLandmarkerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { poseFromHands, smoothPose, type GestureBaseline, type Point } from '../gesture/math'
import { readPinch } from '../gesture/faceTurn'
import { useGestureStore } from '../store/gestureStore'

const CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]] as const

const palmCenter = (landmarks: NormalizedLandmark[]): Point => {
  const indices = [0, 5, 9, 13, 17]
  return indices.reduce((point, index) => ({ x: point.x + (1 - landmarks[index].x) / indices.length, y: point.y + landmarks[index].y / indices.length }), { x: 0, y: 0 })
}

function drawHands(canvas: HTMLCanvasElement, result: HandLandmarkerResult) {
  const context = canvas.getContext('2d'); if (!context) return
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.save(); context.translate(canvas.width, 0); context.scale(-1, 1)
  result.landmarks.forEach((hand) => {
    context.strokeStyle = '#83f5aa'; context.fillStyle = '#b7f34a'; context.lineWidth = 2
    CONNECTIONS.forEach(([from, to]) => { context.beginPath(); context.moveTo(hand[from].x * canvas.width, hand[from].y * canvas.height); context.lineTo(hand[to].x * canvas.width, hand[to].y * canvas.height); context.stroke() })
    hand.forEach((landmark, index) => { context.beginPath(); context.arc(landmark.x * canvas.width, landmark.y * canvas.height, index === 4 || index === 8 ? 4 : 2.5, 0, Math.PI * 2); context.fill() })
  })
  context.restore()
}

export function GestureControl() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const landmarkerRef = useRef<HandLandmarker | null>(null)
  const frameRef = useRef<number | null>(null)
  const baselineRef = useRef<GestureBaseline | null>(null)
  const stableFrames = useRef(0)
  const pinchActive = useRef([false, false])
  const generation = useRef(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { enabled, tracking, handCount, confidence, pose, sensitivity, calibrationId, pinching, activeFace, setEnabled, setTracking, setPose, setHands, setSensitivity, recenter, setPinch, reset } = useGestureStore()

  useEffect(() => { baselineRef.current = null; stableFrames.current = 0; pinchActive.current = [false, false] }, [calibrationId])

  const stop = () => {
    generation.current += 1
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null; baselineRef.current = null; stableFrames.current = 0
    pinchActive.current = [false, false]
    if (videoRef.current) videoRef.current.srcObject = null
    setEnabled(false); reset()
  }

  useEffect(() => () => { generation.current += 1; streamRef.current?.getTracks().forEach((track) => track.stop()); if (frameRef.current) cancelAnimationFrame(frameRef.current); landmarkerRef.current?.close(); landmarkerRef.current = null; useGestureStore.getState().setEnabled(false); useGestureStore.getState().reset() }, [])

  const start = async () => {
    const session = ++generation.current
    setLoading(true); setError('')
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access requires HTTPS or localhost and a supported browser.')
      const [{ FilesetResolver, HandLandmarker }] = await Promise.all([import('@mediapipe/tasks-vision')])
      const vision = await FilesetResolver.forVisionTasks(`${import.meta.env.BASE_URL}mediapipe`)
      const createTracker = (delegate: 'GPU' | 'CPU') => HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: `${import.meta.env.BASE_URL}models/hand_landmarker.task`, delegate },
        runningMode: 'VIDEO', numHands: 2, minHandDetectionConfidence: .6, minHandPresenceConfidence: .6, minTrackingConfidence: .55,
      })
      if (!landmarkerRef.current) {
        const tracker = await createTracker('GPU').catch(() => createTracker('CPU'))
        if (session !== generation.current) { tracker.close(); return }
        landmarkerRef.current = tracker
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 540 } }, audio: false })
      if (session !== generation.current || !videoRef.current) { stream.getTracks().forEach((track) => track.stop()); return }
      streamRef.current = stream
      if (!videoRef.current) return
      videoRef.current.srcObject = stream; await videoRef.current.play()
      if (session !== generation.current) { stream.getTracks().forEach((track) => track.stop()); return }
      setEnabled(true)

      let lastVideoTime = -1
      let lastDetection = 0
      const detect = () => {
        if (session !== generation.current) return
        const video = videoRef.current; const canvas = canvasRef.current; const landmarker = landmarkerRef.current
        if (!video || !canvas || !landmarker || !streamRef.current) return
        try {
        if (video.readyState >= 2 && video.currentTime !== lastVideoTime && performance.now() - lastDetection >= 33) {
          lastDetection = performance.now()
          lastVideoTime = video.currentTime
          canvas.width = video.videoWidth; canvas.height = video.videoHeight
          const result = landmarker.detectForVideo(video, performance.now())
          drawHands(canvas, result)
          const order = result.landmarks.map((_, index) => index).sort((a, b) => (result.handedness[a]?.[0]?.categoryName ?? '').localeCompare(result.handedness[b]?.[0]?.categoryName ?? ''))
          const mirroredHands = order.map((index) => result.landmarks[index].map((point) => ({ x: 1 - point.x, y: point.y, z: point.z })))
          setHands(mirroredHands)
          const scores = result.handedness.map((categories) => categories[0]?.score ?? 0)
          setTracking(result.landmarks.length, scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0)
          if (result.landmarks.length === 2) {
            const wasPinching = pinchActive.current.some(Boolean)
            pinchActive.current = mirroredHands.map((hand, index) => readPinch(hand, pinchActive.current[index]).active)
            const anyPinch = pinchActive.current.some(Boolean)
            stableFrames.current += 1
            const centers = result.landmarks.map(palmCenter).sort((a, b) => a.x - b.x)
            const handFrame = { left: centers[0], right: centers[1] }
            if (wasPinching && !anyPinch) baselineRef.current = { frame: handFrame, pose: useGestureStore.getState().pose }
            if (!baselineRef.current && stableFrames.current > 8) baselineRef.current = { frame: handFrame, pose: useGestureStore.getState().pose }
            if (baselineRef.current && !anyPinch) setPose(smoothPose(useGestureStore.getState().pose, poseFromHands(handFrame, baselineRef.current, useGestureStore.getState().sensitivity), .14))
          } else { stableFrames.current = 0; baselineRef.current = null; pinchActive.current = [false, false]; setPinch(false) }
        }
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'Tracking stopped. Try enabling the camera again.'); stop(); return }
        frameRef.current = requestAnimationFrame(detect)
      }
      frameRef.current = requestAnimationFrame(detect)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to start gesture tracking.'); stop()
    } finally { setLoading(false) }
  }

  return <div className={`gesture-control ${enabled ? 'enabled' : ''}`}>
    <div className="gesture-head"><div><span className="gesture-icon">⌁</span><p><strong>Play with your hands</strong><small>{tracking ? 'Both hands found — you’re ready' : enabled ? `${handCount}/2 hands found. Show both palms.` : 'Start your camera to begin'}</small></p></div><button onClick={enabled ? stop : () => void start()} disabled={loading}>{loading ? 'Getting ready…' : enabled ? 'Stop camera' : 'Start camera'}</button></div>
    <div className="gesture-feed"><video ref={videoRef} muted playsInline/><canvas ref={canvasRef}/>{!enabled && <span>Two-hand live control</span>}</div>
    <div className="gesture-tools">
      <label>Sensitivity<select value={sensitivity} onChange={(event) => setSensitivity(Number(event.target.value))} aria-label="Gesture sensitivity"><option value="0.65">Gentle</option><option value="1">Balanced</option><option value="1.35">Fast</option></select></label>
      <button onClick={recenter} disabled={!enabled}>Reset view</button>
    </div>
    <div role="status" className={`gesture-action ${activeFace ? 'active' : ''}`}><span>{activeFace ? `GRABBED ${activeFace} · RELEASE AFTER TURN` : pinching ? 'AIM AT A CUBE EDGE, THEN PINCH' : 'PINCH + DRAG AROUND THE FACE'}</span><i /></div>
    <ol className="gesture-help"><li>Show both open hands to move the cube.</li><li>Put your finger over a cube edge.</li><li>Pinch and drag, then let go to finish the turn.</li></ol>
    <div className="gesture-stats"><span className={tracking ? 'live' : ''}><i/>{tracking ? 'LIVE' : 'WAITING'}</span><span>{Math.round(confidence * 100)}% confidence</span><span>{pose.scale.toFixed(2)}× zoom</span></div>
    {error && <p role="alert" className="gesture-error">{error}</p>}
  </div>
}
