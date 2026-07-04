/**
 * Force-directed graph layout algorithm.
 *
 * Replaces the random / circular layout previously used in Graph.tsx with a
 * deterministic, physics-based simulation that produces readable, stable
 * layouts for small-to-medium knowledge graphs.
 */

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Simple deterministic hash → [0, 1) from a string id. */
function hashToFloat(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  // Map to [0, 1)
  return ((h & 0x7fffffff) % 10007) / 10007;
}

interface Vec2 {
  x: number;
  y: number;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export interface ForceLayoutEdge {
  source: string;
  target: string;
  strength?: number;
}

export interface ForceLayoutOptions {
  width?: number;
  height?: number;
  iterations?: number;
  centralNodeId?: string;
}

/**
 * Compute a force-directed layout for a set of nodes and edges.
 *
 * @returns A record mapping each node id to its `{ x, y }` position.
 */
export function forceDirectedLayout(
  nodeIds: string[],
  edges: ForceLayoutEdge[],
  options?: ForceLayoutOptions,
): Record<string, Vec2> {
  const width = options?.width ?? 800;
  const height = options?.height ?? 600;
  const iterations = options?.iterations ?? 150;
  const centralNodeId = options?.centralNodeId;

  // --- Edge cases -------------------------------------------------------
  if (nodeIds.length === 0) return {};

  if (nodeIds.length === 1) {
    return { [nodeIds[0]]: { x: width / 2, y: height / 2 } };
  }

  // --- Simulation constants ---------------------------------------------
  const REPULSION = 5000; // Coulomb constant
  const SPRING_LENGTH = 120; // Ideal spring rest length
  const SPRING_K = 0.3; // Spring stiffness (Hooke)
  const GRAVITY = 0.05; // Pull toward center
  const DAMPING = 0.85; // Velocity damping per tick
  const COOLING = 0.95; // Temperature decay per tick
  const MIN_DIST = 1; // Avoid division by zero

  // --- Initialise positions & velocities --------------------------------
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;

  const pos: Record<string, Vec2> = {};
  const vel: Record<string, Vec2> = {};

  nodeIds.forEach((id) => {
    const angle = hashToFloat(id) * Math.PI * 2;
    const r = radius * (0.4 + hashToFloat(id + '_r') * 0.6);
    pos[id] = { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    vel[id] = { x: 0, y: 0 };
  });

  // Place central node at the centre if specified
  if (centralNodeId && pos[centralNodeId]) {
    pos[centralNodeId] = { x: cx, y: cy };
  }

  // --- Build adjacency lookup for O(1) edge queries ---------------------
  const edgeStrength: Record<string, number> = {};
  for (const e of edges) {
    const key = `${e.source}|${e.target}`;
    edgeStrength[key] = e.strength ?? 0.5;
  }

  // --- Simulation loop --------------------------------------------------
  let temperature = 1;

  for (let iter = 0; iter < iterations; iter++) {
    // Accumulate forces per node
    const force: Record<string, Vec2> = {};
    for (const id of nodeIds) {
      force[id] = { x: 0, y: 0 };
    }

    // 1) Repulsive forces between all node pairs (Coulomb)
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const a = nodeIds[i];
        const b = nodeIds[j];
        const dx = pos[a].x - pos[b].x;
        const dy = pos[a].y - pos[b].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_DIST);
        const f = REPULSION / (dist * dist);
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        force[a].x += fx;
        force[a].y += fy;
        force[b].x -= fx;
        force[b].y -= fy;
      }
    }

    // 2) Attractive forces along edges (Hooke / spring)
    for (const e of edges) {
      if (!pos[e.source] || !pos[e.target]) continue;
      const dx = pos[e.target].x - pos[e.source].x;
      const dy = pos[e.target].y - pos[e.source].y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_DIST);
      const strength = e.strength ?? 0.5;
      const displacement = dist - SPRING_LENGTH;
      const f = SPRING_K * displacement * strength;
      const fx = (dx / dist) * f;
      const fy = (dy / dist) * f;
      force[e.source].x += fx;
      force[e.source].y += fy;
      force[e.target].x -= fx;
      force[e.target].y -= fy;
    }

    // 3) Center gravity
    for (const id of nodeIds) {
      force[id].x += (cx - pos[id].x) * GRAVITY;
      force[id].y += (cy - pos[id].y) * GRAVITY;
    }

    // 4) Apply forces, damping, and cooling
    for (const id of nodeIds) {
      vel[id].x = (vel[id].x + force[id].x) * DAMPING * temperature;
      vel[id].y = (vel[id].y + force[id].y) * DAMPING * temperature;
      pos[id].x += vel[id].x;
      pos[id].y += vel[id].y;
    }

    temperature *= COOLING;
  }

  return pos;
}
