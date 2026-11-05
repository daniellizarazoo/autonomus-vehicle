import type { OSMNode } from "./OsmParser";

export type WorldPosition = [number, number]

const EARTH_RADIUS = 6378137;

export function latLonToWorld(
    lat : number,
    lon: number,
    originLat: number,
    originLon: number,
) : WorldPosition {
    const latRad = originLat * Math.PI / 180;

    const x = EARTH_RADIUS *
    (lon - originLon) * 
    Math.PI / 180 * 
    Math.cos(latRad);

    const z = -EARTH_RADIUS * 
    (lat - originLat) *
    Math.PI / 180;

    return [x,z];
}

export function convertNodes (
    nodes: Map<string,OSMNode>
) {

    const values  = Array.from(nodes.values());

    if (values.length === 0) {
        throw new Error('No OSM nodes available');
    }

    const originLat = 
        values.reduce((sum, n) => sum + n.lat, 0) / values.length;

    const originLon = 
        values.reduce((sum, n) => sum + n.lon, 0) / values.length;

    for (const [id, node] of nodes) {
        [node.x, node.z] = latLonToWorld(node.lat, node.lon, originLat, originLon);
    }

}