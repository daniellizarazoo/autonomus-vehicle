import type { GraphNode } from '../osm/graphNode';

export function findClosestNode(
    point: { x: number; z: number },
    nodes: ReadonlyMap<string, GraphNode>
): string | null {
    let closestId: string | null = null;
    let minDistance = Infinity;

    for (const node of nodes.values()) {
        const distance = Math.hypot(point.x - node.x, point.z - node.z);
        if (distance < minDistance) {
            closestId = node.id;
            minDistance = distance;
        }
    }

    return closestId;
}
