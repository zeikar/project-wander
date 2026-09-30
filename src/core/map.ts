// The region a journey crosses, made once from the seed. Everything that can
// happen on it — which scene stands at each node, and what is actually going
// on there — is decided here, so play itself needs no randomness at all.
import { rollRandom } from "./rng";
import { scenes } from "../content/scenes";
import { species } from "../content/species";
import { NODE_ODDS, ROAD_DAYS, destinations } from "../content/world";

export interface MapNode {
  id: string;
  layer: number; // 0 = the village, ROAD_DAYS + 1 = the destinations
  index: number;
  kind: "start" | "scene" | "quiet" | "destination";
  sceneId?: string;
  variant?: string;
  destinationId?: string;
}

export interface WorldMap {
  layers: readonly (readonly MapNode[])[];
  next: Readonly<Record<string, readonly string[]>>;
}

export function generateMap(seed: number): WorldMap {
  let state = seed >>> 0;
  const roll = () => {
    const r = rollRandom(state);
    state = r.nextState;
    return r.value;
  };
  const pick = <T>(items: readonly T[]): T =>
    items[Math.floor(roll() * items.length)]!;

  const layers: MapNode[][] = [[{ id: "0-0", layer: 0, index: 0, kind: "start" }]];

  for (let layer = 1; layer <= ROAD_DAYS; layer++) {
    const width = roll() < 0.5 ? 2 : 3;
    const row: MapNode[] = [];
    for (let index = 0; index < width; index++) {
      row.push(roadNode(layer, index, roll, pick));
    }
    layers.push(row);
  }

  const shuffled = [...destinations];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(roll() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  layers.push(
    shuffled.map((destination, index) => ({
      id: `${ROAD_DAYS + 1}-${index}`,
      layer: ROAD_DAYS + 1,
      index,
      kind: "destination" as const,
      destinationId: destination.id,
    })),
  );

  const next: Record<string, string[]> = {};
  for (let layer = 0; layer < layers.length - 1; layer++) {
    const from = layers[layer]!;
    const to = layers[layer + 1]!;
    for (const node of from) {
      next[node.id] = [];
    }
    for (const [j, k] of connect(from.length, to.length, roll)) {
      next[from[j]!.id]!.push(to[k]!.id);
    }
  }
  for (const node of layers[layers.length - 1]!) {
    next[node.id] = [];
  }

  return { layers, next };
}

function roadNode(
  layer: number,
  index: number,
  roll: () => number,
  pick: <T>(items: readonly T[]) => T,
): MapNode {
  const id = `${layer}-${index}`;
  const r = roll();
  if (r < NODE_ODDS.animal) {
    // Species first, then its situation, so an animal with more situations is
    // not met more often than the others.
    const animal = pick(species).id;
    const scene = pick(scenes.filter((s) => s.species === animal));
    return { id, layer, index, kind: "scene", sceneId: scene.id, variant: pick(scene.variants) };
  }
  if (r < NODE_ODDS.animal + NODE_ODDS.place) {
    const scene = pick(scenes.filter((s) => s.kind === "place"));
    return { id, layer, index, kind: "scene", sceneId: scene.id, variant: pick(scene.variants) };
  }
  return { id, layer, index, kind: "quiet" };
}

// Roads between two layers: each node reaches the nodes roughly across from
// it, never crossing another road, and every node has a way in and a way out.
function connect(
  a: number,
  b: number,
  roll: () => number,
): [number, number][] {
  const pos = (i: number, n: number) => (n === 1 ? 0.5 : i / (n - 1));
  let edges: [number, number][] = [];
  for (let j = 0; j < a; j++) {
    for (let k = 0; k < b; k++) {
      if (Math.abs(pos(j, a) - pos(k, b)) <= 0.5 + 1e-9) {
        edges.push([j, k]);
      }
    }
  }

  // Two lanes side by side: open one diagonal so the lanes can be switched.
  if (a === 2 && b === 2 && roll() < 0.7) {
    edges.push(roll() < 0.5 ? [0, 1] : [1, 0]);
  }

  // Crossing pairs only come from the diagonals; drop one of each pair.
  const crosses = (p: [number, number], q: [number, number]) =>
    (p[0] < q[0] && p[1] > q[1]) || (p[0] > q[0] && p[1] < q[1]);
  for (;;) {
    const pair = edges
      .flatMap((p, i) => edges.slice(i + 1).map((q) => [p, q] as const))
      .find(([p, q]) => crosses(p, q));
    if (!pair) {
      break;
    }
    const drop = roll() < 0.5 ? pair[0] : pair[1];
    edges = edges.filter((e) => e !== drop);
  }

  return edges;
}
