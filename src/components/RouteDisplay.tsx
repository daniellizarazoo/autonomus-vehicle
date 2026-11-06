import * as THREE from 'three';
import type { OSMNode } from '../osm/OsmParser';
import { useMemo } from 'react';

interface RouteProps {
    routeNodes : string[];
    nodes: Map<string, OSMNode>
}

export default function RouteDisplay ({routeNodes, nodes}: RouteProps) {
    
    if (!routeNodes || !nodes || routeNodes.length < 2) return null;

    const lineGeometry = useMemo(() => {
        const threePoints: THREE.Vector3[] = [];

        for (const route of routeNodes) {
            const node = nodes.get(route);
            if (node) {
                const {x,z} = node;
                if ( x !== undefined && z !== undefined) {
                    threePoints.push(new THREE.Vector3(x, 0.15, z));
                }
            }
        }

        return new THREE.BufferGeometry().setFromPoints(threePoints);
    }, [routeNodes, nodes]);

    return (
        <primitive
            object={new THREE.Line(
                lineGeometry,
                new THREE.LineBasicMaterial({ color: 'red' })
            )}
        />
    )
}