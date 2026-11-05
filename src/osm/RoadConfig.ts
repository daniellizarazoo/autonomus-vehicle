export type OSMTags = Record<string, string | undefined>;

/** Fallback for highway types that are not listed below. */
const DEFAULT_WIDTH = 4;

/**
 * Typical width in metres of the paved surface a vehicle (or walker) uses.
 * Two-way unless noted. Motorway and trunk are one carriageway, because OSM
 * maps each direction of a dual carriageway as its own way.
 */
const BASE_WIDTH: Record<string, number> = {
    motorway: 7.5,
    motorway_link: 5,
    trunk: 7,
    trunk_link: 5,
    primary: 7,
    primary_link: 4.5,
    secondary: 6.5,
    secondary_link: 4,
    tertiary: 6,
    tertiary_link: 3.5,
    unclassified: 5,
    residential: 5.5,
    living_street: 4.5,
    service: 9,
    pedestrian: 4,
    track: 3,
    bridleway: 2.5,
    cycleway: 2.5,
    footway: 2,
    steps: 2,
    corridor: 2,
    path: 1.5
};

/** highway=service has a service=* subtype that says what kind of lane it is. */
const SERVICE_WIDTH: Record<string, number> = {
    driveway: 3,
    parking_aisle: 5,
    alley: 3,
    "drive-through": 3,
    emergency_access: 3.5
};

/** Width of one lane, used when a way carries a lanes=* tag. */
const LANE_WIDTH: Record<string, number> = {
    motorway: 3.5,
    trunk: 3.5,
    primary: 3.25,
    secondary: 3.25
};
const DEFAULT_LANE_WIDTH = 3;

/** Only roads that carry traffic in lanes use the lanes tag. */
const LANE_ROADS = new Set([
    "motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential"
]);

const FEET_TO_METRES = 0.3048;

/** Reads an OSM width value such as "6", "6.5", "6 m" or "20'" and returns metres, or null. */
function parseWidth(value: string | undefined): number | null {
    if (!value) return null;

    const first = value.split(";")[0].trim().toLowerCase();
    const match = first.match(/^(\d+(?:[.,]\d+)?)\s*(m|ft|')?$/);
    if (!match) return null;

    let metres = parseFloat(match[1].replace(",", "."));
    if (match[2] === "ft" || match[2] === "'") metres *= FEET_TO_METRES;

    // anything outside this range is a tagging mistake, not a real road
    return metres >= 0.5 && metres <= 60 ? metres : null;
}

/**
 * Width in metres of a way. Order of preference:
 *  1. the way's own width tag, then est_width
 *  2. lanes tag times a lane width (traffic roads only)
 *  3. service subtype (driveway, parking_aisle, ...)
 *  4. typical width for the highway type
 *
 * A plain highway string still works, so older callers keep running.
 */
export function getRoadWidth(input: string | OSMTags | undefined): number {
    const tags: OSMTags = typeof input === "string" ? { highway: input } : input ?? {};
    const highway = tags.highway ?? "";

    const explicit = parseWidth(tags.width) ?? parseWidth(tags.est_width);
    if (explicit !== null) return explicit;

    if (LANE_ROADS.has(highway)) {
        const lanes = parseInt(tags.lanes ?? "", 10);
        if (Number.isFinite(lanes) && lanes >= 1 && lanes <= 8) {
            return Math.max(2.5, lanes * (LANE_WIDTH[highway] ?? DEFAULT_LANE_WIDTH));
        }
    }

    if (highway === "service" && tags.service && SERVICE_WIDTH[tags.service] !== undefined) {
        return SERVICE_WIDTH[tags.service];
    }

    return BASE_WIDTH[highway] ?? DEFAULT_WIDTH;
}