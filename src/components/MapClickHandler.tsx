import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { GraphNode } from '../osm/graphNode';
import { findClosestNode } from '../utils/findClosestNode';

export default function MapClickHandler({ nodes, onSelectNode }: {
    nodes: ReadonlyMap<string, GraphNode> | null;
    onSelectNode: (id: string) => void;
}) {
    function handlePointerDown(event: ThreeEvent<PointerEvent>) {
        if (!nodes) return;
        const closestId = findClosestNode(event.point, nodes);
        if (closestId !== null) onSelectNode(closestId);
    }

    return (
        <mesh
            position={[0, 0.1, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerDown={handlePointerDown}
        >
            <planeGeometry args={[1000, 1000]} />
            <meshBasicMaterial
                transparent
                opacity={0}
                color="blue"
                depthWrite={false}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}
