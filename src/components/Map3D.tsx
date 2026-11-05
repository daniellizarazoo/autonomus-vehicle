import type { OSMData, OSMWay } from "../osm/OsmParser";
import RoadRenderer from "./RoadRenderer";
interface Map3DProps {
    data: OSMData
}

const HIGHWAY_COLORS: Record<string, string> = {
    motorway: "#ff7043",    // Naranja brillante para autopistas
    trunk: "#ffb74d",       // Naranja claro
    primary: "#fdd835",     // Amarillo para avenidas principales
    secondary: "#fff176",   // Amarillo claro
    tertiary: "#f1f8e9",    // Blanco verdoso
    residential: "#ffffff", // Blanco para calles residenciales
    service: "#e0e0e0",     // Gris claro para vías de servicio
    footway: "#81c784",     // Verde para caminos peatonales
};

const getRoadColor = (way: OSMWay): string => {
    const type = way.tags.highway || "default";
    return HIGHWAY_COLORS[type] || "#b0bec5"; // Color gris azulado por defecto si no coincide ninguno
};

export default function Map3D({data} : Map3DProps) {
    const roads = data.ways.filter(
        way => way.tags.highway !== undefined
    );

    return (
        <group>
            {roads.map(way => (
                <RoadRenderer
                    key = {way.id}
                    way={way}
                    nodes={data.nodes}
                    color= {getRoadColor(way)}
                />
            ))}
        </group>
    )
}