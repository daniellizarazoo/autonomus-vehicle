import * as THREE from 'three';
import type { OSMNode } from '../osm/OsmParser';
import { calculateDistance } from '../utils/distanceUtils';

function findClosestNode(
    point: THREE.Vector3,
    nodesMap: Map<string, OSMNode> // 1. Cambiado de Arreglo a Map
): string | null {

    if (!nodesMap || nodesMap.size === 0) return null;
    
    let nodeID: string | null = null;
    let minDist: number = Infinity;

    for (const node of nodesMap.values()) {
        if (!node || node.x === undefined || node.z === undefined) continue;

        // Opcional: El filtro de rango de 5 unidades que tenías antes
        const inXRange = node.x > (point.x - 5) && node.x < (point.x + 5);
        const inZRange = node.z > (point.z - 5) && node.z < (point.z + 5);
        
        // Si no está en el rango cercano, saltamos al siguiente para ahorrar procesamiento
        if (!inXRange || !inZRange) continue;

        const dist = calculateDistance(point.x, point.z, node.x, node.z);

        if (dist < minDist) {
            nodeID = node.id;
            minDist = dist;
        }
    }

    if (!nodeID) {
        for (const node of nodesMap.values()) {
            if (!node || node.x === undefined || node.z === undefined) continue;
            const dist = calculateDistance(point.x, point.z, node.x, node.z);
            if (dist < minDist) {
                nodeID = node.id;
                minDist = dist;
            }
        }
    }

    return nodeID;
}

export default function MapClickHandler({
    nodes = null,
    onSelectNode
}: {
    nodes: Map<string, OSMNode> | null;
    onSelectNode: (id: string) => void;
}) {
    
    function handlePointerDown(event: any) {
        const point: THREE.Vector3 = event.point;
        console.log("point", point);
        
        if (nodes) {
            const closestId = findClosestNode(point, nodes);
            
            if (closestId) {
                onSelectNode(closestId); 
            }
        }
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
                color={"blue"}
                depthWrite={false}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}
