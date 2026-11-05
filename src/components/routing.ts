import type { GraphNode } from "../osm/graphNode";
import type { OSMNode } from "../osm/OsmParser";

export function getPathToDest(startNode: OSMNode | null,endNode : OSMNode | null, graphNode: Map<string, GraphNode> | null) {
    console.log("1", startNode, endNode, graphNode)
    if (!startNode || !endNode || !graphNode) return;

    console.log("2")

    let path : Map<string,{distance: number, camefrom: string|number|null}> = new Map();
    let visited = new Set();

    if (!graphNode.has(startNode.id)) return;
    
    path.set(startNode.id, {distance : 0, camefrom : null});

    while (true) {
        let currentNodeId = "";
        let shortestDistance = Infinity;

        for (const [nodeId , data] of path) {
            if (!visited.has(nodeId) && data.distance < shortestDistance) {
                shortestDistance = data.distance;
                currentNodeId = nodeId;
            }
        }

        visited.add(currentNodeId);

        if (!currentNodeId) break;
        if (currentNodeId === endNode.id) break;

        const points = graphNode.get(currentNodeId)?.neighbors ?? [];

        for (const point of points){
            if (visited.has(point.nodeId))
                continue;
            
            if (!path.has(currentNodeId)) continue;
            const currentDistance = path.get(currentNodeId)?.distance ?? 0;
            const newDistance = currentDistance + point.cost;

            const oldDistance = 
                path.get(point.nodeId)?.distance ?? Infinity;

            if (newDistance < oldDistance) {
                path.set(point.nodeId, {
                    camefrom: currentNodeId,
                    distance: newDistance
                })
            }
        }
    }

    reconstructPath(path, endNode.id);

}

function reconstructPath (path : Map<string,{distance: number, camefrom: string|number|null}>, finalNodeId : string) {
    
    const route = [];
    
    let currentNodeId = finalNodeId;

    while (currentNodeId !== null) {
        route.unshift(currentNodeId);

        path.get(currentNodeId);
    }

    console.log("route", route);
}