import { parseOSM } from './OsmParser';
import type { ChangeEvent } from 'react';

export async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
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
