import {XMLParser}  from 'fast-xml-parser';

export interface OSMNode {
    id: string,
    lat: number,
    lon: number,
    x?: number, // World
    z?: number // World coordinate
}

export interface OSMWay {
    id: string,
    nodes: string[],
    tags: Record<string,string>
}

export interface OSMData {
    nodes: Map<string, OSMNode>,
    ways: OSMWay[]
}

export function parseOSM (xml: string): OSMData {
    
    if (!xml || !xml.trim()) throw new Error('OSM File empty');
    
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        isArray: (name) =>
        ['node', 'way', 'nd', 'tag'].includes(name)
    });

    const data = parser.parse(xml)?.osm;
    if (!data) throw new Error('Couldnt parse data');

    const nodes = new Map<string, OSMNode>();
    const ways : OSMWay[] = [];

    for (const node of data.node ?? []) {
        const id  = node?.id;
        const lat = Number(node?.lat);
        const lon = Number(node?.lon);
        if (!id || !Number.isFinite(lat) || !Number.isFinite(lon))
            continue;

        nodes.set(id, {id, lat, lon});
    }
    
    for (const way of data.way) {
        const id  = way?.id;
        const nodes = way?.nd.map((n: { ref: string; }) => n.ref) ?? [];

        const tags : Record<string,string> = {};

        for (const tag of way?.tag ?? []) {
            if (tag?.v && tag?.k !== undefined) {
                tags[tag.k] = tag.v
            }
        }

        if (!id) continue;

        ways.push({id, nodes: nodes, tags});
    }

    return {nodes, ways}

}