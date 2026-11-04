import { useEffect, useRef, useState } from 'react'
import { FACE_ORDER, type Face } from '../cube/engine'
import { classifyScans } from '../scanner/classification'
import { detectFace } from '../scanner/detection'
import type { FaceScans } from '../scanner/types'
import { useCubeStore } from '../store/cubeStore'

const INSTRUCTIONS: Record<Face, string> = {
  U: 'White center facing camera', R: 'Red center facing camera', F: 'Green center facing camera',
  D: 'Yellow center facing camera', L: 'Orange center facing camera', B: 'Blue center facing camera',
}

export function CameraScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const replaceState = useCubeStore((store) => store.replaceState)
  const [faceIndex, setFaceIndex] = useState(0)
  const [scans, setScans] = useState<FaceScans>({})
  const [status, setStatus] = useState<'idle' | 'camera' | 'processing' | 'complete' | 'error'>('idle')
  const [message, setMessage] = useState('Camera remains on-device. No images are uploaded.')
  const [confidence, setConfidence] = useState<number | null>(null)
  const face = FACE_ORDER[faceIndex]

  const stopCamera = () => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null }
  useEffect(() => () => stopCamera(), [])

  const startCamera = async () => {
    try {
      stopCamera()
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setStatus('camera'); setMessage('Align all nine stickers inside the guide.'); setFaceIndex(0); setScans({}); setConfidence(null)
    } catch (cause) {
      setStatus('error'); setMessage(cause instanceof Error ? cause.message : 'Camera access was denied.')
    }
  }

  const capture = async () => {
    const video = videoRef.current; const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth) return
    setStatus('processing'); setMessage('Detecting sticker grid with OpenCV…')
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    try {
      const result = await detectFace(canvas)
      const updated = { ...scans, [face]: result.samples }
      setScans(updated)
      if (faceIndex === FACE_ORDER.length - 1) {
        const classified = classifyScans(updated)
        replaceState({ stickers: classified.stickers })
        setConfidence(classified.confidence * result.confidence)
        setStatus('complete'); setMessage('Six faces imported. Review and correct the sticker editor.'); stopCamera()
      } else {
        setFaceIndex((index) => index + 1); setStatus('camera')
        setMessage(result.detectedGrid ? 'Grid detected. Rotate to the next face.' : 'Used guide sampling. Verify colors in the editor afterward.')
      }
    } catch (cause) {
      setStatus('error'); setMessage(cause instanceof Error ? cause.message : 'Unable to process this frame.')
    }
  }

  return <section className="scanner-panel">
    <div className="panel-heading"><div><p className="eyebrow">Browser camera + OpenCV.js</p><h2>Six-face scanner</h2></div><span className="privacy-badge">On-device</span></div>
    <div className="scanner-view">
      <video ref={videoRef} playsInline muted />
      {status !== 'camera' && status !== 'processing' && <div className="camera-placeholder"><span>◎</span><p>{status === 'complete' ? 'Scan complete' : 'Camera preview'}</p></div>}
      {(status === 'camera' || status === 'processing') && <div className="scan-guide"><div/><div/><div/><div/><div/><div/><div/><div/><div/></div>}
      {status === 'processing' && <div className="processing-overlay"><i/>Analyzing frame</div>}
      <canvas ref={canvasRef} hidden />
    </div>
    <div className="scan-progress">{FACE_ORDER.map((item, index) => <span key={item} className={index < faceIndex || status === 'complete' ? 'done' : index === faceIndex && status !== 'idle' ? 'active' : ''}>{item}</span>)}</div>
    <div className="scan-copy"><strong>{status === 'camera' || status === 'processing' ? `Face ${faceIndex + 1}/6 · ${face}` : status === 'complete' ? `Confidence ${Math.round((confidence ?? 0) * 100)}%` : 'Ready to scan'}</strong><span>{status === 'camera' ? INSTRUCTIONS[face] : message}</span></div>
    <div className="scan-actions">{status === 'camera' ? <><button onClick={() => { stopCamera(); setStatus('idle'); setMessage('Scan cancelled.') }}>Cancel</button><button className="primary" onClick={() => void capture()}>Capture {face}</button></> : <button className="primary" onClick={() => void startCamera()}>{status === 'complete' ? 'Scan again' : 'Start camera'}</button>}</div>
  </section>
}
