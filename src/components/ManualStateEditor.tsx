import { useState } from 'react'
import { FACE_ORDER, validatePhysicalState, type ColorId, type Face } from '../cube/engine'
import { useCubeStore } from '../store/cubeStore'

const COLOR_NAMES: Record<ColorId, string> = { U: 'White', R: 'Red', F: 'Green', D: 'Yellow', L: 'Orange', B: 'Blue' }
const COLOR_CLASS: Record<ColorId, string> = { U: 'sticker-white', R: 'sticker-red', F: 'sticker-green', D: 'sticker-yellow', L: 'sticker-orange', B: 'sticker-blue' }

function EditorFace({ face, selected }: { face: Face; selected: ColorId }) {
  const { state, setSticker } = useCubeStore()
  const offset = FACE_ORDER.indexOf(face) * 9
  return <div className={`editor-face editor-face-${face.toLowerCase()}`}><label>{face}</label><div>
    {state.stickers.slice(offset, offset + 9).map((color, index) => <button key={index} className={COLOR_CLASS[color]} onClick={() => setSticker(offset + index, selected)} aria-label={`Set ${face}${index + 1} to ${COLOR_NAMES[selected]}`} />)}
  </div></div>
}

export function ManualStateEditor() {
  const state = useCubeStore((store) => store.state)
  const [selected, setSelected] = useState<ColorId>('U')
  const validation = validatePhysicalState(state)
  const counts = Object.fromEntries(FACE_ORDER.map((color) => [color, state.stickers.filter((sticker) => sticker === color).length])) as Record<ColorId, number>

  return <section className="editor-panel">
    <div className="panel-heading"><div><p className="eyebrow">Manual correction</p><h2>Sticker state editor</h2></div><span className={`editor-validity ${validation.valid ? 'valid' : ''}`}>{validation.valid ? 'Physically valid' : `${validation.errors.length} issues`}</span></div>
    <div className="editor-body">
      <div className="editor-net">{FACE_ORDER.map((face) => <EditorFace key={face} face={face} selected={selected}/>)}</div>
      <aside className="color-palette"><p>Select color</p>{FACE_ORDER.map((color) => <button key={color} className={selected === color ? 'selected' : ''} onClick={() => setSelected(color)}><i className={COLOR_CLASS[color]}/><span>{COLOR_NAMES[color]}</span><em>{counts[color]}/9</em></button>)}</aside>
    </div>
    <div className="validation-strip">{validation.valid ? <p><strong>✓ State is solvable</strong><span>Inventory, pieces, orientation and parity are consistent.</span></p> : <p><strong>Correction required</strong><span>{validation.errors[0]}</span></p>}</div>
  </section>
}
