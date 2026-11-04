import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Canvas, type ThreeEvent, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Group, Mesh } from 'three'
import {
  MOVE_DEFINITIONS,
  STICKER_SLOTS,
  coordinateAt,
  type ColorId,
  type CubeState,
  type Face,
  type Move,
  type StickerSlot,
  type TurnBase,
} from '../engine'
import { useCubeStore } from '../../store/cubeStore'
import { useGestureStore } from '../../store/gestureStore'
import { HandInteraction } from './HandInteraction'

const COLORS: Record<ColorId, string> = {
  U: '#f0f4ee', R: '#e4524d', F: '#58d488', D: '#efd34d', L: '#f08a3d', B: '#527ce5',
}

const CUBIE_COORDINATES = [-1, 0, 1].flatMap((x) =>
  [-1, 0, 1].flatMap((y) => [-1, 0, 1].map((z) => [x, y, z] as const)),
).filter(([x, y, z]) => x !== 0 || y !== 0 || z !== 0)

const positionKey = (position: readonly number[]) => position.join(',')

function stickerTransform(slot: StickerSlot): { position: [number, number, number]; rotation: [number, number, number] } {
  const [nx, ny, nz] = slot.normal
  if (nx === 1) return { position: [.511, 0, 0], rotation: [0, Math.PI / 2, 0] }
  if (nx === -1) return { position: [-.511, 0, 0], rotation: [0, -Math.PI / 2, 0] }
  if (ny === 1) return { position: [0, .511, 0], rotation: [-Math.PI / 2, 0, 0] }
  if (ny === -1) return { position: [0, -.511, 0], rotation: [Math.PI / 2, 0, 0] }
  if (nz === -1) return { position: [0, 0, -.511], rotation: [0, Math.PI, 0] }
  return { position: [0, 0, .511], rotation: [0, 0, 0] }
}

function Cubie({ coordinate, slots, state, onTurn }: {
  coordinate: readonly [number, number, number]
  slots: readonly StickerSlot[]
  state: CubeState
  onTurn: (face: Face, inverse?: boolean) => void
}) {
  const body = useRef<Mesh>(null)
  const activeFace = useGestureStore((store) => store.activeFace)
  return <group position={[coordinate[0] * 1.04, coordinate[1] * 1.04, coordinate[2] * 1.04]}>
    <mesh ref={body} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#0b0e0d" roughness={.72} metalness={.08} />
    </mesh>
    {slots.map((slot) => {
      const transform = stickerTransform(slot)
      const turn = (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); if (event.delta < 5) onTurn(slot.face, event.nativeEvent.shiftKey) }
      return <mesh key={slot.index} position={transform.position} rotation={transform.rotation}
        onClick={turn}>
        <planeGeometry args={[.84, .84]} />
        <meshStandardMaterial color={COLORS[state.stickers[slot.index]]} emissive={activeFace === slot.face ? '#b7f34a' : '#000000'} emissiveIntensity={.3} roughness={.48} metalness={.03} />
      </mesh>
    })}
  </group>
}

function CubieSet({ state, filter, onTurn }: {
  state: CubeState
  filter: (coordinate: readonly [number, number, number]) => boolean
  onTurn: (face: Face, inverse?: boolean) => void
}) {
  const slotsByPosition = useMemo(() => {
    const map = new Map<string, StickerSlot[]>()
    for (const slot of STICKER_SLOTS) map.set(positionKey(slot.position), [...(map.get(positionKey(slot.position)) ?? []), slot])
    return map
  }, [])
  return <>{CUBIE_COORDINATES.filter(filter).map((coordinate) =>
    <Cubie key={positionKey(coordinate)} coordinate={coordinate} slots={slotsByPosition.get(positionKey(coordinate)) ?? []} state={state} onTurn={onTurn} />,
  )}</>
}

function AnimatedCube() {
  const { state, transition, apply } = useCubeStore()
  const rotating = useRef<Group>(null)
  const progress = useRef(1)
  const [completedId, setCompletedId] = useState(0)
  const active = transition && transition.id !== completedId ? transition : null

  useEffect(() => { if (active) progress.current = 0 }, [active?.id])

  useFrame((_, delta) => {
    if (!active || !rotating.current) return
    progress.current = Math.min(1, progress.current + delta / .34)
    const eased = 1 - Math.pow(1 - progress.current, 3)
    const definition = MOVE_DEFINITIONS[active.move[0] as TurnBase]
    const modifier = active.move.endsWith("'") ? -1 : active.move.endsWith('2') ? 2 : 1
    const angle = definition.quarterTurns * modifier * Math.PI / 2 * eased
    rotating.current.rotation.set(0, 0, 0)
    rotating.current.rotation[definition.axis] = angle
    if (progress.current === 1) setCompletedId(active.id)
  })

  const onTurn = (face: Face, inverse = false) => apply(`${face}${inverse ? "'" : ''}` as Move)
  if (!active) return <CubieSet state={state} filter={() => true} onTurn={onTurn} />

  const definition = MOVE_DEFINITIONS[active.move[0] as TurnBase]
  const affected = (coordinate: readonly [number, number, number]) => coordinateAt(coordinate, definition.axis) === definition.layer
  return <>
    <CubieSet state={active.from} filter={(coordinate) => !affected(coordinate)} onTurn={onTurn} />
    <group ref={rotating}><CubieSet state={active.from} filter={affected} onTurn={onTurn} /></group>
  </>
}

export function CubeScene() {
  const enabled = useGestureStore((store) => store.enabled)
  const tracking = useGestureStore((store) => store.tracking)
  const pose = useGestureStore((store) => store.pose)
  const cube = useRef<Group>(null)
  return <Canvas className="cube-canvas" camera={{ position: [5.4, 4.4, 6.4], fov: 34 }} shadows dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
    <ambientLight intensity={1.25} />
    <directionalLight position={[4, 7, 5]} intensity={3.2} castShadow shadow-mapSize={[1024, 1024]} />
    <pointLight position={[-5, 1, -2]} intensity={8} color="#79e7b1" />
    <group ref={cube} rotation={[pose.x, pose.y, pose.z]} scale={pose.scale}><AnimatedCube /></group>
    <HandInteraction cube={cube}/>
    <ContactShadows position={[0, -2.25, 0]} opacity={.48} scale={8} blur={2.8} far={5} color="#000000" />
    <OrbitControls makeDefault enabled={!tracking} enablePan={false} minDistance={5.5} maxDistance={11} autoRotate={!enabled} autoRotateSpeed={.28} dampingFactor={.07} />
  </Canvas>
}
