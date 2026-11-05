import type { OSMNode } from "../osm/OsmParser"

interface NodeMarkerProps {
    node : OSMNode,
    color: string
}

export default function NodeMarker({node, color} : NodeMarkerProps) {
    return (
        <mesh position={[node.x ?? 0, 0.3, node.z ?? 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color={color} />
        </mesh>
    );
}