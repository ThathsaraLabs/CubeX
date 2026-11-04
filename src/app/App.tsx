import { isSolved, validateCubeState } from '../cube/engine'
import { useEffect, useState } from 'react'
import { CubeScene } from '../cube/renderer/CubeScene'
import { Icon } from '../components/Icon'
import { MoveControls } from '../components/MoveControls'
import { SolverPanel } from '../components/SolverPanel'
import { CameraScanner } from '../components/CameraScanner'
import { ManualStateEditor } from '../components/ManualStateEditor'
import { GestureControl } from '../components/GestureControl'
import { PermutationDiagram } from '../permutation/visualization/PermutationDiagram'
import { useCubeStore } from '../store/cubeStore'
import knuLogo from '../../Logos/images.jpeg'
import smartSoftwareLabLogo from '../../Logos/New.png'

export function App() {
  const [view, setView] = useState('Play')
  const [hands, setHands] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const { state, history, lastMove, scramble, apply, transition, undo, reset } = useCubeStore()
  const solved = isSolved(state)
  const validation = validateCubeState(state)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (view === 'Scan a cube') return
      if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, button, [contenteditable="true"]')) return
      const key = event.key.toUpperCase()
      if (/^[UDLRFBMES]$/.test(key)) { event.preventDefault(); apply(`${key}${event.shiftKey ? "'" : ''}` as Parameters<typeof apply>[0]) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [apply, view])

  return <div className="app-shell friendly-app">
    <main id="workspace">
      <header className="simple-header"><a className="simple-brand" href="#workspace" onClick={() => setView('Play')}><Icon name="cube" size={28}/>CubeX</a><nav aria-label="Workspace">{['Play', 'Scan a cube', 'Learn'].map((item) => <button key={item} aria-current={view === item ? 'page' : undefined} onClick={() => { setView(item); if (item !== 'Play') setHands(false) }}>{item}</button>)}</nav></header>
      <div className="welcome"><h1>{view === 'Play' ? 'Let’s solve your cube.' : view === 'Scan a cube' ? 'Bring your real cube in.' : 'A few moves. A little magic.'}</h1><p>{view === 'Play' ? 'Mix it up, explore a few turns, then follow the solution.' : view === 'Scan a cube' ? 'Scan all six sides, or enter the colours yourself.' : 'Start with the basics. Explore the maths when you’re ready.'}</p></div>

      <div className="dashboard-grid" hidden={view !== 'Play'}>
        <section className="hero-panel">
          <div className="panel-heading"><h2>Your cube</h2><span className={`state-pill ${solved ? 'solved' : ''}`}>{solved ? '✓ Solved' : `${history.length} moves`}</span></div>
          <div className="cube-stage"><div className="stage-grid"/><div className="ambient-ring"/><CubeScene/><div className="interaction-hint"><span>DRAG</span> orbit <i/> <span>HANDS</span> rotate + zoom <i/> <span>CLICK</span> turn</div><span className="axis-label axis-x">X</span><span className="axis-label axis-y">Y</span><span className="axis-label axis-z">Z</span></div>
          <div className="easy-actions"><button className="primary-action" onClick={scramble}><Icon name="spark" size={18}/>Mix up</button><button onClick={undo} disabled={!history.length}><Icon name="undo" size={18}/>Undo</button><button onClick={reset}><Icon name="reset" size={18}/>Start over</button></div>
          <p className="plain-hint">Drag to look around · Click a colour to turn that side</p>
          <button className="hands-toggle" aria-expanded={hands} onClick={() => setHands(!hands)}>{hands ? 'Close hand controls' : '✋ Try hand control'}<span>{hands ? 'Camera stops when closed' : 'Optional · uses your camera'}</span></button>
          {hands && <GestureControl/>}
          {!validation.valid && <p role="alert" className="plain-hint">Check your sticker colours in “Scan a cube”.</p>}
        </section>

        <div className="right-column">
          <SolverPanel />
          <div className="quick-guide"><h2>New here?</h2><ol><li><strong>Mix up</strong><span>Give yourself a fresh puzzle.</span></li><li><strong>Find a solution</strong><span>We’ll work out the moves for you.</span></li><li><strong>Watch or go step by step</strong><span>Pause whenever you want.</span></li></ol></div>
          <button className="advanced-toggle" aria-expanded={advanced} onClick={() => setAdvanced(!advanced)}>{advanced ? '− Hide move controls' : '+ More controls & notation'}</button>
          {advanced && <MoveControls />}
        </div>
      </div>
      {view === 'Scan a cube' && <><section className="capture-workspace" id="scanner"><CameraScanner/><ManualStateEditor/></section><button className="primary-action back-play" onClick={() => setView('Play')}>Use this cube →</button></>}
      {view === 'Learn' && <><section className="math-panel" id="permutations"><div className="panel-heading"><h2>See how the stickers move</h2></div><PermutationDiagram move={lastMove} state={state} sourceState={transition?.from} transitionId={transition?.id}/><MoveControls/></section>
      <section id="guide" className="control-guide"><h2>Make your first move</h2><div>
        <article><h3>Mouse & keyboard</h3><p>Drag to orbit, scroll to zoom, click a sticker to turn its face. Hold Shift for inverse turns. U D L R F B M E S keys also work.</p></article>
        <article><h3>Hands in the scene</h3><p>Enable the camera and show both hands. Open hands rotate and zoom. Aim near a face edge, pinch for a moment and drag around its centre. Release after each turn. Recenter restores a comfortable view.</p></article>
        <article><h3>Explore the mathematics</h3><p>Every face turn updates the sticker permutation. Scramble, solve, then step through the solution. Camera-based contact is an estimated screen projection; use Gentle sensitivity for fine movements.</p></article>
      </div></section></>}
    </main>
    <footer className="developed-by" aria-label="Developed by">
      <div className="developer-credit">
        <p className="developed-by-label">Developed by</p>
        <div className="developer-logos" aria-label="Smart Software Lab and Kyungpook National University">
          <div className="developer-logo-card"><img src={smartSoftwareLabLogo} alt="Smart Software Lab" /></div>
          <span className="developer-collab-mark" aria-hidden="true">×</span>
          <div className="developer-logo-card"><img src={knuLogo} alt="Kyungpook National University" /></div>
        </div>
      </div>
    </footer>
  </div>
}
