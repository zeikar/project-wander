// The region as a figure in the guide: the village at the bottom, the far
// places at the top. Roads leading on from here carry their names, so the
// list beside the map reads as its legend. All in ink: a road is chosen by
// what its sign says, not by a colour picking it out. The rest is a dot.
import type { Dispatch } from "react";
import type { MapNode } from "../core/map";
import { nextNodes } from "../core/reducer";
import type { GameAction, GameState } from "../core/state";
import { signOf } from "./parts";
import { useStrings } from "./strings";

const W = 340;
const ROW = 54;
const PAD_TOP = 40;
const PAD_BOTTOM = 30;
const MARGIN = 62;

export function MapView({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}) {
  const strings = useStrings();
  const map = state.map!;
  const count = map.layers.length;
  const height = PAD_TOP + PAD_BOTTOM + ROW * (count - 1);

  const place = (node: MapNode) => {
    const width = map.layers[node.layer]!.length;
    const x = width === 1 ? W / 2 : MARGIN + (node.index * (W - 2 * MARGIN)) / (width - 1);
    const y = PAD_TOP + (count - 1 - node.layer) * ROW;
    return { x, y };
  };

  const open = new Set(state.phase === "map" ? nextNodes(state).map((n) => n.id) : []);
  const walked = new Set(state.path.slice(1).map((id, i) => `${state.path[i]}>${id}`));
  const visited = new Set(state.path);
  const nodes = map.layers.flat();

  return (
    <svg className="map" viewBox={`0 0 ${W} ${height}`} role="img" aria-label={strings.ui.whereNext}>
      {nodes.flatMap((from) =>
        (map.next[from.id] ?? []).map((toId) => {
          const to = nodes.find((n) => n.id === toId)!;
          const a = place(from);
          const b = place(to);
          const cls = walked.has(`${from.id}>${toId}`)
            ? "edge walked"
            : from.id === state.at && open.has(toId)
              ? "edge open"
              : "edge";
          return <line key={`${from.id}>${toId}`} className={cls} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        }),
      )}
      {nodes.map((node) => {
        const { x, y } = place(node);
        const isOpen = open.has(node.id);
        const status =
          node.id === state.at ? "current" : isOpen ? "open" : visited.has(node.id) ? "visited" : "unseen";
        const sign = isOpen ? signOf(strings, state, node) : null;
        // Labels sit on the outer side of a node, where no road runs into it;
        // the middle column takes the right.
        const right = x >= W / 2;
        return (
          <g
            key={node.id}
            className={`node ${node.kind} ${status}`}
            onClick={isOpen ? () => dispatch({ type: "MOVE", nodeId: node.id }) : undefined}
            transform={`translate(${x} ${y})`}
          >
            {node.kind === "destination" ? (
              <rect x={-6} y={-6} width={12} height={12} transform="rotate(45)" />
            ) : node.kind === "start" ? (
              <rect x={-6} y={-6} width={12} height={12} />
            ) : (
              <circle r={status === "unseen" ? 3 : status === "visited" ? 4 : 7} />
            )}
            {node.kind === "destination" && (
              <text className="label dest" y={-14} textAnchor="middle">
                {strings.destinations[node.destinationId!]!.name}
              </text>
            )}
            {node.kind === "start" && (
              <text className="label" y={22} textAnchor="middle">
                {strings.regions[state.region].village.name}
              </text>
            )}
            {sign && node.kind !== "destination" && (
              <text className="label road" x={right ? 12 : -12} y={4} textAnchor={right ? "start" : "end"}>
                {sign.place}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
