import { useRef, type RefObject } from "react"
import * as THREE from 'three'
import { useFrame } from "@react-three/fiber"
import type { controlKeysType } from "../App"

interface BoxProps {
  position: [number, number, number]
  args?: [number, number, number]
  color?: string
  rotation?: [number, number, number]
}

interface WheelProps {
  position: [number, number, number]
}

interface ForkLiftProps {
    position: [number, number, number],
    rotation: [number, number, number],
    controllable?: boolean,
    controls? : RefObject<controlKeysType>
}

function Box({ position , args, color, rotation = [0, 0, 0] } : BoxProps) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function Wheel({ position } : WheelProps) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.35, 0.35, 0.22, 32]} />
      <meshStandardMaterial color="#202020" />
    </mesh>
  )
}

export default function Forklift({ position, rotation, controllable = false, controls }: ForkLiftProps) {
  
  const group = useRef<THREE.Group>(null);

  const motion = useRef({
    x: position[0],
    z: position[2],
    yaw : rotation[1],
    speed: 2,
    steering: 0.15, // radians: fixed for the test
    wheelbase: 1.5 // aproximate distance between wheel axles
  });
  
  useFrame((_, delta) => {
    if (!controllable) return;
    
    const groupObject = group.current;
    if (!groupObject) return;
    const dt = Math.min(delta, 0.05);

    const input  = controls?.current;
    if (!input) return;

    const {forward, backward, left, right} = controls.current;

    const speedSet = 2 * ((forward ? 1 : 0) - (backward ? 1 : 0));
    const steeringAngle = 0.15 * ((right ? 1 : 0) - (left ? 1 : 0));

    const {x , z , yaw, wheelbase} = motion.current;

    const nextYaw = yaw - (speedSet / wheelbase) * Math.tan(steeringAngle) * dt;
    const nextX = x + speedSet * Math.sin(yaw) * dt;
    const nextZ = z + speedSet * Math.cos(yaw) * dt;

    motion.current.x = nextX;
    motion.current.z = nextZ;
    motion.current.yaw = nextYaw;

    groupObject.position.set(nextX, position[1], nextZ);
    groupObject.rotation.y = nextYaw;
  });
  
  return (
    <group ref={group} position={position} rotation={rotation}>

      {/* Main chassis */}
      <Box
        position={[0, 0.7, 0]}
        args={[1.5, 0.5, 2.2]}
        color="#e6a817"
      />

      {/* Rear counterweight */}
      <Box
        position={[0, 0.85, -0.95]}
        args={[1.55, 0.8, 0.45]}
        color="#d99500"
      />

      {/* Wheels */}
      <Wheel position={[-0.8, 0.4, -0.75]} />
      <Wheel position={[0.8, 0.4, -0.75]} />
      <Wheel position={[-0.8, 0.4, 0.75]} />
      <Wheel position={[0.8, 0.4, 0.75]} />

      {/* Cabin protective frame */}
      <Box position={[-0.65, 1.8, -0.45]}
        args={[0.12, 2.2, 0.12]} color="#333333" />

      <Box position={[0.65, 1.8, -0.45]}
        args={[0.12, 2.2, 0.12]} color="#333333" />

      <Box position={[-0.65, 1.8, 0.65]}
        args={[0.12, 2.2, 0.12]} color="#333333" />

      <Box position={[0.65, 1.8, 0.65]}
        args={[0.12, 2.2, 0.12]} color="#333333" />

      {/* Protective roof */}
      <Box
        position={[0, 2.9, 0.1]}
        args={[1.55, 0.15, 1.5]}
        color="#333333"
      />

      {/* Driver seat */}
      <Box position={[0, 1.15, -0.15]}
        args={[0.55, 0.15, 0.5]} color="#222222" />

      <Box position={[0, 1.45, -0.4]}
        args={[0.55, 0.55, 0.12]} color="#222222" />

      {/* Steering wheel support */}
      <Box position={[0, 1.45, 0.45]}
        args={[0.08, 0.6, 0.08]} color="#333333" />

      {/* Mast - two vertical rails */}
      <Box position={[-0.55, 1.65, 1.15]}
        args={[0.15, 2.5, 0.18]} color="#555555" />

      <Box position={[0.55, 1.65, 1.15]}
        args={[0.15, 2.5, 0.18]} color="#555555" />

      {/* Mast crossbar */}
      <Box position={[0, 2.8, 1.15]}
        args={[1.25, 0.15, 0.2]} color="#555555" />

      {/* Forks */}
      <Box position={[-0.4, 0.35, 2.0]}
        args={[0.18, 0.12, 1.7]} color="#777777" />

      <Box position={[0.4, 0.35, 2.0]}
        args={[0.18, 0.12, 1.7]} color="#777777" />

      {/* Fork vertical heels */}
      <Box position={[-0.4, 0.55, 1.2]}
        args={[0.18, 0.45, 0.15]} color="#777777" />

      <Box position={[0.4, 0.55, 1.2]}
        args={[0.18, 0.45, 0.15]} color="#777777" />

    </group>
  )
}
