import { useMemo } from 'react'
import { Quaternion, Vector3 } from 'three'
import { HAND_CONNECTIONS, handContacts, projectHands, type ScenePoint } from '../../gesture/handProjection'
import { useGestureStore } from '../../store/gestureStore'

function Bone({ from, to, color = '#62d8ff', radius = .028 }: { from: ScenePoint; to: ScenePoint; color?: string; radius?: number }) {
  const transform = useMemo(() => {
    const start = new Vector3(...from); const end = new Vector3(...to); const direction = end.clone().sub(start)
    return { position: start.clone().add(end).multiplyScalar(.5), length: direction.length(), quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()) }
  }, [from, to])
  return <mesh position={transform.position} quaternion={transform.quaternion}><cylinderGeometry args={[radius, radius, transform.length, 7]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.55} transparent opacity={.5} depthWrite={false}/></mesh>
}

export function GestureHands3D() {
  const { hands, tracking, pinching } = useGestureStore()
  const projected = useMemo(() => projectHands(hands), [hands])
  const contacts = useMemo(() => handContacts(projected), [projected])
  if (!tracking || projected.length !== 2) return null
  return <group>
    {projected.map((hand, handIndex) => <group key={handIndex}>
      {HAND_CONNECTIONS.map(([from, to]) => <Bone key={`${from}-${to}`} from={hand[from]} to={hand[to]} />)}
      {hand.map((point, index) => <mesh key={index} position={point}><sphereGeometry args={[index === 0 ? .1 : .065, 10, 8]}/><meshStandardMaterial color="#8eeaff" emissive="#3bc8ff" emissiveIntensity={.7} transparent opacity={.62} depthWrite={false}/></mesh>)}
    </group>)}
    {contacts.map((contact) => <group key={`${contact.handIndex}-${contact.index}`} position={contact.surface}>
      <Bone from={[contact.point[0] - contact.surface[0], contact.point[1] - contact.surface[1], contact.point[2] - contact.surface[2]]} to={[0,0,0]} color="#b7f34a" radius={.018}/>
      <mesh scale={pinching ? 1.35 : 1}><sphereGeometry args={[.11, 14, 10]}/><meshStandardMaterial color={pinching ? '#ffffff' : '#d9ff65'} emissive="#aaff22" emissiveIntensity={pinching ? 4 : 2.4}/></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.18, .018, 8, 24]}/><meshBasicMaterial color="#b7f34a" transparent opacity={.8}/></mesh>
      <pointLight color="#aaff55" intensity={1.2} distance={1.1}/>
    </group>)}
  </group>
}
