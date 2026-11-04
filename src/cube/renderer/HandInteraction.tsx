import { useRef, useState, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Quaternion, Vector3, type Group } from 'three'
import { HAND_CONNECTIONS, type ScenePoint } from '../../gesture/handProjection'
import { readPinch, type PinchPoint } from '../../gesture/faceTurn'
import { cameraPoint, hitCube, surfaceMove, type SurfaceHit } from '../../gesture/surface'
import { useGestureStore } from '../../store/gestureStore'
import { useCubeStore } from '../../store/cubeStore'
import { useSolverStore } from '../../store/solverStore'

function Bone({ from, to }: { from: ScenePoint; to: ScenePoint }) {
  const start = new Vector3(...from); const end = new Vector3(...to)
  const direction = end.clone().sub(start)
  return <mesh position={start.add(end).multiplyScalar(.5)} quaternion={new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize())}>
    <cylinderGeometry args={[.025, .025, direction.length(), 6]} />
    <meshBasicMaterial color="#62d8ff" transparent opacity={.55} depthWrite={false}/>
  </mesh>
}

interface Grab { hand: number; start: PinchPoint; hit: SurfaceHit; since: number; done: boolean }
interface Visuals { hands: ScenePoint[][]; contacts: SurfaceHit[] }
const NORMALS = { R: [1,0,0], L: [-1,0,0], U: [0,1,0], D: [0,-1,0], F: [0,0,1], B: [0,0,-1] } as const

export function HandInteraction({ cube }: { cube: RefObject<Group | null> }) {
  const grab = useRef<Grab | null>(null)
  const previous = useRef([false, false])
  const lastHands = useRef<unknown>(null)
  const calibration = useRef(-1)
  const [visuals, setVisuals] = useState<Visuals>({ hands: [], contacts: [] })
  const lastTurn = useRef(0)

  useFrame(({ camera }) => {
    const state = useGestureStore.getState()
    if (!cube.current) return
    if (calibration.current !== state.calibrationId || !state.tracking) {
      calibration.current = state.calibrationId
      grab.current = null; previous.current = [false, false]
      state.setPinch(false)
    }
    if (lastHands.current === state.hands) return
    lastHands.current = state.hands
    if (!state.tracking) { setVisuals({ hands: [], contacts: [] }); return }
    cube.current.updateWorldMatrix(true, false)
    const matrix = cube.current.matrixWorld
    const now = performance.now()
    const pinches = state.hands.map((hand, index) => readPinch(hand, previous.current[index]))
    const solver = useSolverStore.getState()
    const blocked = ['playing', 'solving', 'initializing'].includes(solver.status)
    const contacts: SurfaceHit[] = []
    const hands = state.hands.map((hand) => hand.map((point, index) => {
      const hit = [4, 8, 12, 16, 20].includes(index) ? hitCube(point, camera, matrix) : null
      if (hit) contacts.push(hit)
      return (hit?.world ?? cameraPoint(point, camera)).toArray() as ScenePoint
    }))
    if (blocked || (grab.current && !pinches[grab.current.hand]?.active)) grab.current = null
    if (!blocked && !grab.current) {
      const index = pinches.findIndex((pinch, i) => pinch.active && !previous.current[i])
      if (index >= 0) {
        const hit = hitCube(pinches[index].point, camera, matrix)
        if (hit) grab.current = { hand: index, start: pinches[index].point, hit, since: now, done: false }
      }
    }
    const held = grab.current
    if (held && !held.done && now - held.since >= 180 && now - lastTurn.current >= 450) {
      const move = surfaceMove(held.hit, held.start, pinches[held.hand].point, camera, matrix)
      if (move) {
        solver.clear(); useCubeStore.getState().apply(move)
        held.done = true; lastTurn.current = now
      }
    }
    previous.current = pinches.map((pinch) => pinch.active)
    state.setPinch(pinches.some((pinch) => pinch.active), held?.hit.face ?? null)
    setVisuals({ hands, contacts })
  })

  return <group>
    {visuals.hands.map((hand, handIndex) => <group key={handIndex}>
      {HAND_CONNECTIONS.map(([from, to]) => <Bone key={`${from}-${to}`} from={hand[from]} to={hand[to]}/>)}
      {hand.map((point, index) => <mesh key={index} position={point}><sphereGeometry args={[.055, 8, 6]}/><meshBasicMaterial color="#8eeaff" transparent opacity={.7}/></mesh>)}
    </group>)}
    {visuals.contacts.map((hit, index) => {
      const normal = new Vector3(...NORMALS[hit.face]).transformDirection(cube.current!.matrixWorld)
      return <mesh key={index} position={hit.world.clone().addScaledVector(normal, .015)} quaternion={new Quaternion().setFromUnitVectors(new Vector3(0,0,1), normal)}>
        <ringGeometry args={[.07, .11, 24]}/><meshBasicMaterial color="#caff63" side={2} depthWrite={false}/>
      </mesh>
    })}
  </group>
}
