import * as THREE from "three";

export interface XZ {
    x: number;
    z: number;
}

export interface RoadOptions {
    /** Round off bends with a Catmull-Rom curve that passes through every node. */
    smooth?: boolean;
    /** Turns sharper than this (degrees) stay real corners, e.g. a city block. */
    cornerAngle?: number;
    /** Distance between samples on a smoothed curve, in world units. */
    spacing?: number;
    /** Longest mitre, as a multiple of half the road width. Stops spikes on tight turns. */
    miterLimit?: number;
    /** Height of the road above the ground. */
    y?: number;
}

/** Drops consecutive points at the same spot (they would give a zero-length segment). */
function dedupe(points: XZ[]): XZ[] {
    const out: XZ[] = [];
    for (const p of points) {
        const last = out[out.length - 1];
        if (!last || Math.hypot(p.x - last.x, p.z - last.z) > 1e-3) {
            out.push({ x: p.x, z: p.z });
        }
    }
    return out;
}

/** Cuts the path into runs wherever the turn is sharper than maxTurnDeg. */
function splitAtCorners(points: XZ[], maxTurnDeg: number): XZ[][] {
    const limit = THREE.MathUtils.degToRad(maxTurnDeg);
    const runs: XZ[][] = [];
    let run: XZ[] = [points[0]];

    for (let i = 1; i < points.length; i++) {
        run.push(points[i]);

        if (i < points.length - 1) {
            const a = Math.atan2(points[i].z - points[i - 1].z, points[i].x - points[i - 1].x);
            const b = Math.atan2(points[i + 1].z - points[i].z, points[i + 1].x - points[i].x);
            let turn = Math.abs(b - a);
            if (turn > Math.PI) turn = 2 * Math.PI - turn;

            if (turn > limit) {
                runs.push(run);
                run = [points[i]];
            }
        }
    }
    runs.push(run);
    return runs;
}

/** Resamples one run with a centripetal Catmull-Rom spline. Original nodes are kept exactly. */
function smoothRun(run: XZ[], spacing: number): XZ[] {
    if (run.length < 3) return run;

    const curve = new THREE.CatmullRomCurve3(
        run.map(p => new THREE.Vector3(p.x, 0, p.z)),
        false,
        "centripetal"
    );

    const spans = run.length - 1;
    const out: XZ[] = [];

    for (let i = 0; i < spans; i++) {
        const chord = Math.hypot(run[i + 1].x - run[i].x, run[i + 1].z - run[i].z);
        const steps = Math.max(1, Math.ceil(chord / spacing));

        for (let s = 0; s < steps; s++) {
            const v = curve.getPoint((i + s / steps) / spans);
            out.push({ x: v.x, z: v.z });
        }
    }

    out.push({ x: run[spans].x, z: run[spans].z });
    return out;
}

export function smoothPath(points: XZ[], cornerAngle = 70, spacing = 2): XZ[] {
    const clean = dedupe(points);
    if (clean.length < 3) return clean;

    const runs = splitAtCorners(clean, cornerAngle).map(r => smoothRun(r, spacing));

    // runs share their end/start node, so skip the duplicate when joining
    const out: XZ[] = [...runs[0]];
    for (let i = 1; i < runs.length; i++) out.push(...runs[i].slice(1));
    return out;
}

/**
 * Builds one continuous road strip. Each point gets a left and a right vertex,
 * pushed out along the averaged normal of its two neighbouring segments (a mitre join),
 * so there are no gaps or overlaps at bends.
 */
export function buildRoadGeometry(
    points: XZ[],
    halfWidth: number,
    options: RoadOptions = {}
): THREE.BufferGeometry | null {
    const { smooth = true, cornerAngle = 70, spacing = 2, miterLimit = 2, y = 0.02 } = options;

    const path = smooth ? smoothPath(points, cornerAngle, spacing) : dedupe(points);
    const n = path.length;
    if (n < 2) return null;

    // unit perpendicular of every segment: (dz, -dx) / length
    const nx: number[] = [];
    const nz: number[] = [];
    for (let i = 0; i < n - 1; i++) {
        const dx = path[i + 1].x - path[i].x;
        const dz = path[i + 1].z - path[i].z;
        const length = Math.hypot(dx, dz);
        nx.push(dz / length);
        nz.push(-dx / length);
    }

    const vertices: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < n; i++) {
        let mx: number;
        let mz: number;
        let scale = 1;

        if (i === 0) {
            mx = nx[0];
            mz = nz[0];
        } else if (i === n - 1) {
            mx = nx[n - 2];
            mz = nz[n - 2];
        } else {
            // average the normals of the segment before and the segment after this point
            mx = nx[i - 1] + nx[i];
            mz = nz[i - 1] + nz[i];
            const ml = Math.hypot(mx, mz);

            if (ml < 1e-6) {
                // path doubles back on itself, fall back to one segment's normal
                mx = nx[i];
                mz = nz[i];
            } else {
                mx /= ml;
                mz /= ml;
                // the offset must be longer on a bend to keep the road the same width
                const cos = mx * nx[i] + mz * nz[i];
                scale = Math.min(1 / cos, miterLimit);
            }
        }

        const o = halfWidth * scale;
        const p = path[i];

        vertices.push(
            p.x + mx * o, y, p.z + mz * o, // left  = 2i
            p.x - mx * o, y, p.z - mz * o  // right = 2i + 1
        );
    }

    for (let i = 0; i < n - 1; i++) {
        const l0 = 2 * i;
        const r0 = l0 + 1;
        const l1 = l0 + 2;
        const r1 = l0 + 3;

        // same winding as before, both triangles face up (+y)
        indices.push(l0, r0, l1, r0, r1, l1);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}
