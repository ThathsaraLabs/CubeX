import { faceStickers, type ColorId, type CubeState, type Face } from '../cube/engine'

const colorClass: Record<ColorId, string> = {
  U: 'sticker-white', R: 'sticker-red', F: 'sticker-green', D: 'sticker-yellow', L: 'sticker-orange', B: 'sticker-blue',
}

function FaceGrid({ face, state }: { face: Face; state: CubeState }) {
  return <div className={`face-grid face-${face.toLowerCase()}`} aria-label={`${face} face`}>
    {faceStickers(state, face).map((color, index) => <span className={`sticker ${colorClass[color]}`} key={index} />)}
  </div>
}

export function CubeNet({ state }: { state: CubeState }) {
  return <div className="cube-net" aria-label="Current cube net">
    <FaceGrid face="U" state={state} />
    <FaceGrid face="L" state={state} />
    <FaceGrid face="F" state={state} />
    <FaceGrid face="R" state={state} />
    <FaceGrid face="B" state={state} />
    <FaceGrid face="D" state={state} />
  </div>
}
