import type { GraphNode } from "../osm/graphNode"

interface NodeMarkerProps {
    node : Pick<GraphNode, 'x' | 'z'>,
    color: string
}

export default function NodeMarker({node, color} : NodeMarkerProps) {
    const radio = 1.2; // Cambia este valor para ajustar el tamaño general

    return (
        <mesh position={[node.x, radio, node.z]}>
            <sphereGeometry args={[radio, 32, 32]} /> 
            <meshBasicMaterial color={color} />
        </mesh>
    );
}
