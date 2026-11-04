import { useState } from 'react'
import { type Move } from '../cube/engine'
import { useCubeStore } from '../store/cubeStore'
import { Icon } from './Icon'

const MOVES: readonly Move[] = ['U', "U'", 'D', "D'", 'L', "L'", 'R', "R'", 'F', "F'", 'B', "B'", 'M', 'E', 'S']

export function MoveControls() {
  const { apply, runAlgorithm, undo, redo, reset, history, future } = useCubeStore()
  const [algorithm, setAlgorithm] = useState("R U R' U'")
  const [error, setError] = useState('')

  const run = () => {
    try { runAlgorithm(algorithm); setError('') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Invalid algorithm') }
  }

  return <section className="control-panel">
    <div className="panel-heading"><div><p className="eyebrow">Move engine</p><h2>Manual turns</h2></div><span className="engine-badge">54 stickers</span></div>
    <div className="move-grid">{MOVES.map((move) => <button key={move} onClick={() => apply(move)}>{move}</button>)}</div>
    <div className="algorithm-row">
      <label htmlFor="algorithm">Algorithm notation</label>
      <div><input id="algorithm" value={algorithm} onChange={(event) => setAlgorithm(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && run()} /><button onClick={run}>Run</button></div>
      {error && <p className="input-error" role="alert">{error}</p>}
    </div>
    <div className="history-actions">
      <button onClick={undo} disabled={!history.length}><Icon name="undo" size={17}/> Undo</button>
      <button onClick={redo} disabled={!future.length}><Icon name="redo" size={17}/> Redo</button>
      <button onClick={reset}><Icon name="reset" size={17}/> Reset</button>
    </div>
  </section>
}
