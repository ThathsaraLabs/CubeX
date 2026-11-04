import { useSolverStore } from '../store/solverStore'
import { useCubeStore } from '../store/cubeStore'
import { isSolved } from '../cube/engine'

const LABELS = {
  idle: 'Ready when you are', initializing: 'Getting ready', solving: 'Finding your moves', ready: 'Solution ready',
  playing: 'Playing solution', paused: 'Playback paused', complete: 'Cube solved', error: 'Solver error',
} as const

export function SolverPanel() {
  const { status, solution, cursor, speed, error, solve, play, pause, stepForward, stepBackward, setSpeed, cancel } = useSolverStore()
  const solved = useCubeStore((store) => isSolved(store.state))
  const busy = status === 'initializing' || status === 'solving'
  const progress = solution.length ? cursor / solution.length * 100 : status === 'complete' ? 100 : 0

  return <section className="solver-panel">
    <div className="panel-heading"><h2>Your solution</h2></div>
    <p className="solution-message" role="status">{solved ? 'Looking good — your cube is solved!' : LABELS[status]}</p>
    {solution.length > 0 && <><div className="solver-summary">
      <div><small>SOLUTION</small><strong>{solution.length ? `${solution.length} moves` : '—'}</strong></div>
      <div><small>POSITION</small><strong>{solution.length ? `${cursor} / ${solution.length}` : '—'}</strong></div>
    </div>
    <div className="solution-track"><span style={{ width: `${progress}%` }} /></div></>}
    <div className="solution-sequence" aria-label="Solution moves">
      {busy && <div className="solver-loading"><i/><span>{status === 'initializing' ? 'Getting things ready. The first time takes a little longer…' : 'Finding a way back to solved…'}</span></div>}
      {!busy && !solution.length && !error && <p>{solved ? 'Choose “Mix up” to try a new puzzle.' : 'Stuck? Find a solution, then watch each move.'}</p>}
      {solution.map((move, index) => <span key={`${move}-${index}`} className={index === cursor ? 'current' : index < cursor ? 'complete' : ''}>{move}</span>)}
      {error && <p className="solver-error" role="alert">{error}</p>}
    </div>
    <div className="player-row">
      {solution.length > 0 && <><button onClick={stepBackward} disabled={cursor === 0} aria-label="Previous move">← Back</button>
      {status === 'playing' ? <button className="play-button" onClick={pause} aria-label="Pause">Ⅱ Pause</button> : <button className="play-button" onClick={play} disabled={cursor >= solution.length} aria-label="Play">▶ Watch</button>}
      <button onClick={stepForward} disabled={cursor >= solution.length} aria-label="Next move">Next →</button>
      <label>Speed<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value="900">Slow</option><option value="600">Normal</option><option value="420">Fast</option><option value="350">Very fast</option></select></label></>}
      {busy ? <button className="solve-button secondary" onClick={cancel}>Cancel</button> : !solution.length && <button className="solve-button" disabled={solved} onClick={() => void solve()}>Find a solution</button>}
    </div>
  </section>
}
