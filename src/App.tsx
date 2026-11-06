import './App.css'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Forklift from './components/Forklift'
import {useEffect, useState, useRef, type RefObject} from 'react';
import mapData from './osm/methode.json';
import { convertNodes } from './osm/CoordinateConverter';
import Map3D from './components/Map3D';
import { createGraphNode } from './osm/graphNode';
import MapClickHandler from './components/MapClickHandler';
import NodeMarker from './components/NodeMarker';
import { getPathToDest } from './components/routing';
import RouteDisplay from './components/RouteDisplay';

import type { OSMData } from './osm/OsmParser';
import type { GraphNode } from './osm/graphNode';

export type controlKeysType = {
  forward: boolean,
  backward: boolean,
  right: boolean,
  left: boolean
}

interface SceneProps {
  data : OSMData | null;
  controls: RefObject<controlKeysType>
}

function Scene({data, controls} : SceneProps) {
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
        controllable
        controls={controls}
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

function App() {
  const [{ jsonData, graphNode }] = useState(() => {
    const data : OSMData = {
      nodes: new Map(Object.entries(mapData.nodes).map(([id, node]) => [id, { ...node }])),
      ways: mapData.ways.map(way => ({
        ...way,
        tags: Object.fromEntries(
          Object.entries(way.tags).filter(([, value]) => typeof value === 'string')
        )
      }))
    }
    convertNodes(data.nodes);
    return { jsonData: data, graphNode: createGraphNode(data) };
  });
  const [navigationMode, setNavigationMode] = useState(false);
  const [startNode, setStartNode] = useState<GraphNode | null>(null);
  const [endNode, setEndNode] = useState<GraphNode | null>(null);
  const [route, setRoute] = useState<string[] | null>(null);
  const keys = useRef<controlKeysType>({forward: false,backward: false, left: false, right: false});

  useEffect(() => {
    
    const setKey = (e: KeyboardEvent, pressed: boolean) => {
      switch(e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = pressed;
          break;
        
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = pressed;
          break;
        
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = pressed;
          break;

        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = pressed;
          break;
      }
    }
    
    const handleKeyDown = (e:KeyboardEvent) => {
      setKey(e, true);

      if (e.code === 'KeyN' && !e.repeat) {
        setNavigationMode((v) => !v);
      }
    };

    const handleKeyUp = (e: KeyboardEvent)=> setKey(e,false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const setNavNode = (nodeID : string) => {
    const node = graphNode?.get(nodeID);
    if (!node) return;

    if (!startNode || endNode) {
      setStartNode(node);
      setEndNode(null);
      setRoute(null);
      return;
    }

    setEndNode(node);
    setRoute(getPathToDest(startNode, node, graphNode));
  }

  return (
    <div id="main-app">
      
      {/* Navigation information */}
      <div className="navigation-info">
          <p>Start: {startNode?.id ?? 'Not selected'}</p>
          <p>Destination: {endNode?.id ?? 'Not selected'}</p>
          {endNode && <p>{route ? `Route: ${route.join(' → ')}` : 'No route found'}</p>}
          <p>Press 'n' to enable navigation mode {navigationMode ? 'Nav mode: Enabled' : 'Nav mode disabled'}</p>
      </div>
      
      <Canvas camera={{ position: [30, 30, 30], fov: 50 }}>
        <Scene data={jsonData} controls={keys}/>

        {navigationMode && 
        <MapClickHandler 
          nodes={graphNode}
          onSelectNode={setNavNode}
        />}

        {startNode && (
          <NodeMarker node = {startNode} color='limegreen'/>
        )}

        {endNode && (
          <NodeMarker node = {endNode} color='red'/>
        )}

        {startNode && endNode && route && (
          <RouteDisplay 
            nodes={jsonData.nodes} 
            routeNodes={route}
          />
        )}

      </Canvas>
      
    </div>
  )
}

export default App
