import type { OSMData } from "./OsmParser";

export interface GraphNode {
    id: string;
    x: number;
    z: number;
    neighbors: {
        nodeId: string;
        cost: number;
    }[]
}

const HIGHWAY_COST: Record<string, number> = {
    unclassified: 1.2,
    residential: 1.2,
    living_street: 1.5,
    service: 1.0,
    tertiary: 1.3,
    secondary: 1.5,
    track: 2.0
};

export function createGraphNode(data: OSMData): Map<string, GraphNode> {

    const graphNode: Map<string, GraphNode> = new Map();

    // Create a graph node if it doesn't already exist
    function addNode(id: string, x: number, z: number) {
        if (!graphNode.has(id)) {
            graphNode.set(id, {
                id,
                x,
                z,
                neighbors: []
            });
        }
    }

    for (const way of data.ways) {

        const highwayType = way.tags.highway;

        // Check whether this road type is allowed
        const penalty = highwayType
            ? HIGHWAY_COST[highwayType]
            : undefined;

        if (penalty === undefined) continue;

        // Check explicit access restrictions
        const denied = ["no", "private"];

        if (
            denied.includes(way.tags.access) ||
            denied.includes(way.tags.vehicle) ||
            denied.includes(way.tags.motor_vehicle)
        ) {
            continue;
        }

        // Determine road direction
        const oneway = way.tags.oneway;
        const isReverseOnly = oneway === "-1";

        const isOneWay =
            ["yes", "1", "true"].includes(oneway) ||
            (oneway === undefined && way.tags.junction === "roundabout");

        for (let j = 0; j < way.nodes.length - 1; j++) {

            const ndA = data.nodes.get(way.nodes[j]);
            const ndB = data.nodes.get(way.nodes[j + 1]);

            if (!ndA || !ndB) continue;

            if (
                ndA.x === undefined || ndB.x === undefined ||
                ndA.z === undefined || ndB.z === undefined
            ) continue;

            const dx = ndB.x - ndA.x;
            const dz = ndB.z - ndA.z;

            const dist = Math.hypot(dx, dz);

            if (!Number.isFinite(dist)) continue;

            // Create both graph nodes
            addNode(ndA.id, ndA.x, ndA.z);
            addNode(ndB.id, ndB.x, ndB.z);

            // Distance multiplied by road penalty
            const edgeCost = dist * penalty;

            const nodeA = graphNode.get(ndA.id)!;
            const nodeB = graphNode.get(ndB.id)!;

            if (isReverseOnly) {

                // B -> A
                nodeB.neighbors.push({
                    nodeId: ndA.id,
                    cost: edgeCost
                });

            } else {

                // A -> B
                nodeA.neighbors.push({
                    nodeId: ndB.id,
                    cost: edgeCost
                });

                // B -> A, only if it is not one-way
                if (!isOneWay) {
                    nodeB.neighbors.push({
                        nodeId: ndA.id,
                        cost: edgeCost
                    });
                }
            }
        }
    }

    return graphNode;
}
