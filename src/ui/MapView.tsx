// The region, drawn like a sketch in the back of a notebook. The village sits
// at the bottom and the destinations at the top. Only the roads leading on
// from here show what is on them; the rest is a dot on a page.
import type { Dispatch } from "react";
import type { MapNode } from "../core/map";
import { nextNodes } from "../core/reducer";
import type { GameAction, GameState } from "../core/state";
import { useStrings } from "./strings";

const W = 340;
const ROW = 64;
const PAD_TOP = 40;
const PAD_BOTTOM = 34;
const MARGIN = 64;

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

  const open = new Set(
    state.phase === "map" ? nextNodes(state).map((n) => n.id) : [],
  );
  const walked = new Set(
    state.path.slice(1).map((id, i) => `${state.path[i]}>${id}`),
  );
  const visited = new Set(state.path);
  const nodes = map.layers.flat();

  return (
    <svg
      className="map"
      viewBox={`0 0 ${W} ${height}`}
      role="img"
      aria-label={strings.ui.whereNext}
    >
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
          return (
            <line key={`${from.id}>${toId}`} className={cls} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
          );
        }),
      )}
      {nodes.map((node) => {
        const { x, y } = place(node);
        const status =
          node.id === state.at
            ? "current"
            : open.has(node.id)
              ? "open"
              : visited.has(node.id)
                ? "visited"
                : "unseen";
        const onClick = open.has(node.id)
          ? () => dispatch({ type: "MOVE", nodeId: node.id })
          : undefined;
        return (
          <g
            key={node.id}
            className={`node ${node.kind} ${status}`}
            onClick={onClick}
            transform={`translate(${x} ${y})`}
          >
            {node.kind === "destination" ? (
              <path d="M0 -9 L8 0 L0 9 L-8 0 Z" />
            ) : node.kind === "start" ? (
              <rect x={-7} y={-7} width={14} height={14} rx={2} />
            ) : (
              <circle r={status === "unseen" ? 3.5 : 7} />
            )}
            {node.kind === "destination" && (
              <text className="label" y={-16} textAnchor="middle">
                {strings.destinations[node.destinationId!]!.name}
              </text>
            )}
            {node.kind === "start" && (
              <text className="label" y={24} textAnchor="middle">
                {strings.village.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
