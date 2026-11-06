import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getPathToDest } from '../src/components/routing.ts';
import { createGraphNode } from '../src/osm/graphNode.ts';
import { convertNodes } from '../src/osm/CoordinateConverter.ts';
import { findClosestNode } from '../src/utils/findClosestNode.ts';

function makeGraph(edges) {
    return new Map(Object.entries(edges).map(([id, neighbors]) => [id, {
        id, x: 0, z: 0,
        neighbors: neighbors.map(([nodeId, cost]) => ({ nodeId, cost }))
    }]));
}

function route(graph, start, end) {
    return getPathToDest(graph.get(start) ?? null, graph.get(end) ?? null, graph);
}

test('reconstructs the cheapest route after improving an already discovered node', () => {
    const graph = makeGraph({ A: [['B', 10], ['C', 1]], B: [['D', 1]], C: [['B', 1], ['D', 9]], D: [] });
    assert.deepEqual(route(graph, 'A', 'D'), ['A', 'C', 'B', 'D']);
});

test('handles identical endpoints, disconnected nodes, and missing graph inputs', () => {
    const graph = makeGraph({ A: [], B: [] });
    assert.deepEqual(route(graph, 'A', 'A'), ['A']);
    assert.equal(route(graph, 'A', 'B'), null);
    const missing = { id: 'missing', x: 0, z: 0, neighbors: [] };
    assert.equal(getPathToDest(missing, graph.get('A'), graph), null);
    assert.equal(getPathToDest(graph.get('A'), missing, graph), null);
    assert.equal(getPathToDest(null, graph.get('A'), graph), null);
    assert.equal(getPathToDest(graph.get('A'), null, graph), null);
    assert.equal(getPathToDest(graph.get('A'), graph.get('A'), null), null);
});

test('zero-cost cycles terminate and dangling edges do not create routes', () => {
    const graph = makeGraph({ A: [['B', 0], ['missing', 1]], B: [['A', 0], ['C', 2]], C: [], D: [] });
    assert.deepEqual(route(graph, 'A', 'C'), ['A', 'B', 'C']);
    assert.equal(route(graph, 'A', 'D'), null);
});

test('rejects invalid traversed edge costs', () => {
    for (const cost of [-1, NaN, Infinity]) {
        const graph = makeGraph({ A: [['B', cost]], B: [] });
        assert.throws(() => route(graph, 'A', 'B'), /non-negative edge costs/);
    }
});

function roadGraph(tags = {}, coordinates = [[0, 0], [3, 4], [6, 8]]) {
    const nodes = new Map(coordinates.map(([x, z], index) => {
        const id = String(index);
        return [id, { id, lat: 0, lon: 0, x, z }];
    }));
    return createGraphNode({ nodes, ways: [{ id: 'road', nodes: [...nodes.keys()], tags: { highway: 'service', ...tags } }] });
}

test('graph respects forward, reverse, and two-way travel', () => {
    const forward = roadGraph({ oneway: 'yes' });
    assert.deepEqual(route(forward, '0', '2'), ['0', '1', '2']);
    assert.equal(route(forward, '2', '0'), null);
    const reverse = roadGraph({ oneway: '-1' });
    assert.deepEqual(route(reverse, '2', '0'), ['2', '1', '0']);
    assert.equal(route(reverse, '0', '2'), null);
    assert.deepEqual(route(roadGraph(), '2', '0'), ['2', '1', '0']);
});

test('explicit two-way tag overrides the roundabout default', () => {
    assert.equal(route(roadGraph({ junction: 'roundabout' }), '2', '0'), null);
    assert.deepEqual(route(roadGraph({ junction: 'roundabout', oneway: 'no' }), '2', '0'), ['2', '1', '0']);
});

test('graph preserves coincident-node connections and excludes invalid coordinates', () => {
    const graph = roadGraph({}, [[0, 0], [0, 0], [3, 4]]);
    assert.deepEqual(route(graph, '0', '2'), ['0', '1', '2']);
    assert.equal(graph.get('0').neighbors[0].cost, 0);
    assert.equal(roadGraph({}, [[0, 0], [Infinity, 0]]).size, 0);
});

test('graph excludes restricted and unsupported roads and applies road weights', () => {
    for (const tags of [{ access: 'private' }, { vehicle: 'no' }, { motor_vehicle: 'no' }, { highway: 'footway' }]) {
        assert.equal(roadGraph(tags).size, 0);
    }
    assert.equal(roadGraph({ highway: 'track' }).get('0').neighbors[0].cost, 10);
});

test('selection finds the actual nearest graph node, including outside the old square shortcut', () => {
    const graph = new Map([
        ['corner', { id: 'corner', x: 4.9, z: 4.9, neighbors: [] }],
        ['nearer', { id: 'nearer', x: 5.1, z: 0, neighbors: [] }]
    ]);
    assert.equal(findClosestNode({ x: 0, z: 0 }, graph), 'nearer');
    assert.equal(findClosestNode({ x: 0, z: 0 }, new Map()), null);
});

test('bundled map builds a routable graph whose selected endpoints belong to it', () => {
    const raw = JSON.parse(readFileSync(new URL('../src/osm/methode.json', import.meta.url), 'utf8'));
    const data = { nodes: new Map(Object.entries(raw.nodes)), ways: raw.ways };
    convertNodes(data.nodes);
    const graph = createGraphNode(data);
    assert.ok(graph.size > 0);
    assert.ok(graph.size < data.nodes.size);
    const start = [...graph.values()].find(node => node.neighbors.some(edge => edge.nodeId !== node.id));
    const end = graph.get(start.neighbors.find(edge => edge.nodeId !== start.id).nodeId);
    assert.ok(graph.has(findClosestNode(start, graph)));
    const result = getPathToDest(start, end, graph);
    assert.equal(result[0], start.id);
    assert.equal(result.at(-1), end.id);
    for (let index = 1; index < result.length; index++) {
        assert.ok(graph.get(result[index - 1]).neighbors.some(edge => edge.nodeId === result[index]));
    }
});
