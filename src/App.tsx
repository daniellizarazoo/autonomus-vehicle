
import './App.css'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import Forklift from './components/Forklift'
import {useEffect, useState} from 'react';
import { parseOSM } from './osm/OsmParser';
import mapData from './osm/methode.json';
import type { OSMData, OSMNode } from './osm/OsmParser';
import { convertNodes } from './osm/CoordinateConverter';
import Map3D from './components/Map3D';
import { createGraphNode } from './osm/graphNode';
import type { GraphNode } from './osm/graphNode';
import MapClickHandler from './components/MapClickHandler';
import NodeMarker from './components/NodeMarker';
import { getPathToDest } from './components/routing';

function Scene({data} : {data: OSMData | null}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.7} />

      <directionalLight
        position={[5, 10, 5]}
        intensity={2}
        castShadow
      />

      {data && <Map3D data={data}/>}
  

      {/* Forklift */}
      <Forklift 
        position = {[-29.862212259107505, 0.02, 58.50418208124047]}
        rotation = {[0, Math.PI, 0]}
      />
      <Forklift 
        position={[63.11884621914039, 0.02, -50]}
        rotation={[0, Math.PI, 0]}
      />

      <Forklift 
        position={[-23, 0.02, 22]}
        rotation={[0, Math.PI, 0]}
      />


      {/* Camera controls */}
      <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={500}
          target={[0, 0, 0]}
      />
    </>
  )
}

async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const xml = await file.text();
    const osmData = parseOSM(xml);

    const jsonData = {
      nodes : Object.fromEntries(osmData.nodes),
      ways: osmData.ways
    }

    const json = JSON.stringify(jsonData, null, 2)

    const blob = new Blob([json], {
        type: 'application/json'
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'map.json';
    a.click();

    URL.revokeObjectURL(url);

  }  catch (error) {
    console.error('OSM loading failed:', error);
  }
}

function App() {
  const [jsonData, setJsonData] = useState<OSMData | null>(null);
  const [graphNode, setGraphNode] = useState<Map<string, GraphNode> | null>(null);
  const [navigationMode, setNavigationMode] = useState(false);
  const [startNode, setStartNode] = useState<OSMNode | null>(null);
  const [endNode, setEndNode] = useState<OSMNode | null>(null);

  useEffect(() => {
    const data : OSMData = {
      nodes: new Map(Object.entries(mapData.nodes)),
      ways: mapData.ways.map(way => ({
        ...way,
        tags: Object.fromEntries(
          Object.entries(way.tags).filter(([, value]) => typeof value === 'string')
        )
      }))
    }

    convertNodes(data.nodes);

    const graph : Map<string, GraphNode>  = createGraphNode(data);
    console.log("graph", graph)
    if (graph) {
      setGraphNode(graph);
    }
    
    console.log("246518886",data.nodes.get('246518886'));
    console.log("4537443253",data.nodes.get('4537443253'));

    setJsonData(data);
    
  },[]);
  
  useEffect(() => {
    const handleKeyPressed = (e: { key: string; }) => {
      if (e.key === 'n' ) {
        setNavigationMode(v => !v);
      }
    }

    window.addEventListener('keydown', handleKeyPressed);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPressed);
    }

  }, []);

  const setNavNode = (nodeID : string) => {
    if (nodeID) {
      
      const dataHasNode = (id : string) => jsonData?.nodes.has(id);
      const dataGetNode = (id : string) => jsonData?.nodes.get(id);
      
      if (startNode && endNode) {
        const node = dataGetNode(nodeID);
        setStartNode(node ?? null);
        setEndNode(null);
      }

      if (!startNode && dataHasNode(nodeID)) {
          const node = dataGetNode(nodeID);
          setStartNode(node ?? null);
      } else if (startNode && !endNode && dataHasNode(nodeID)) {
        setEndNode(dataGetNode(nodeID) ?? null);
        getPathToDest(startNode, dataGetNode(nodeID) ?? null, graphNode)
      }
    }
  }

  return (
    <div id="main-app">
      {/* <input type="file" accept='.osm,.xml' onChange={handleFileChange}/> */}
      
      {/* Navigation information */}
      <div className="navigation-info">
          <p>Start: {JSON.stringify(startNode) ?? 'Not selected'}</p>
          <p>Destination: {JSON.stringify(endNode) ?? 'Not selected'}</p>
      </div>
      
      <Canvas camera={{ position: [30, 30, 30], fov: 50 }}>
        <Scene data={jsonData} />

        {navigationMode && 
        <MapClickHandler 
          nodes={jsonData?.nodes ?? null} 
          onSelectNode={setNavNode}
        />}

        {startNode && (
          <NodeMarker node = {startNode} color='limegreen'/>
        )}

        {endNode && (
          <NodeMarker node = {endNode} color='red'/>
        )}

      </Canvas>
      
    </div>
  )
}

export default App
