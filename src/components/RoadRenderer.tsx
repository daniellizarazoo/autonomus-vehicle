import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { OSMWay, OSMNode } from "../osm/OsmParser";
import { getRoadWidth } from "../osm/RoadConfig";
import { buildRoadGeometry } from "./Roadgeometry";

interface RoadRendererProps {
    way: OSMWay;
    nodes: Map<string, OSMNode>;
    color: string;
    /** Round off bends. Turns sharper than 70 degrees stay as corners. */
    smooth?: boolean;
}

type OSMNodeWithWorld = OSMNode & { x: number; z: number };

export default function RoadRenderer({ way, nodes, color, smooth = true }: RoadRendererProps) {
    const geometry = useMemo(() => {
        const points = way.nodes
            .map(id => nodes.get(id))
            .filter((node): node is OSMNodeWithWorld =>
                node !== undefined && node.x !== undefined && node.z !== undefined
            );

        if (points.length < 2) return null;

        const halfWidth = getRoadWidth(way.tags.highway) / 2;

        return buildRoadGeometry(points, halfWidth, { smooth });
    }, [way, nodes, smooth]);

    // free GPU memory when the way changes or the component unmounts
    useEffect(() => () => geometry?.dispose(), [geometry]);

    if (!geometry) return null;

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
    );
}
