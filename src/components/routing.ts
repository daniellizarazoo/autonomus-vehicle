import type { GraphNode } from "../osm/graphNode";

interface PathEntry {
    distance: number;
    cameFrom: string | null;
}

/** Returns node IDs from start to destination, or null when no route exists. */
export function getPathToDest(
    startNode: GraphNode | null,
    endNode: GraphNode | null,
    graph: ReadonlyMap<string, GraphNode> | null
): string[] | null {
    if (!startNode || !endNode || !graph ||
        !graph.has(startNode.id) || !graph.has(endNode.id)) return null;

    const path = new Map<string, PathEntry>([
        [startNode.id, { distance: 0, cameFrom: null }]
    ]);
    const visited = new Set<string>();

    while (true) {
        let currentNodeId: string | null = null;
        let shortestDistance = Infinity;

        for (const [nodeId, entry] of path) {
            if (!visited.has(nodeId) && entry.distance < shortestDistance) {
                shortestDistance = entry.distance;
                currentNodeId = nodeId;
            }
        }

        if (currentNodeId === null) return null;
        if (currentNodeId === endNode.id) return reconstructPath(path, endNode.id);
        visited.add(currentNodeId);

        for (const neighbor of graph.get(currentNodeId)!.neighbors) {
            if (!Number.isFinite(neighbor.cost) || neighbor.cost < 0) {
                throw new Error("Dijkstra requires finite, non-negative edge costs");
            }
            if (!graph.has(neighbor.nodeId) || visited.has(neighbor.nodeId)) continue;

            const newDistance = shortestDistance + neighbor.cost;
            const oldDistance = path.get(neighbor.nodeId)?.distance ?? Infinity;

            if (newDistance < oldDistance) {
                path.set(neighbor.nodeId, {
                    distance: newDistance,
                    cameFrom: currentNodeId
                });
            }
        }
    }
}

function reconstructPath(path: ReadonlyMap<string, PathEntry>, finalNodeId: string): string[] {
    const route: string[] = [];
    let currentNodeId: string | null = finalNodeId;

    while (currentNodeId !== null) {
        route.push(currentNodeId);
        currentNodeId = path.get(currentNodeId)!.cameFrom;
    }

    console.log("route", route);

    return route.reverse();
}
