import { useReducer } from "react";
import type { Dispatch } from "react";
import { reduce } from "../core/reducer";
import { createInitialState } from "../core/game-state";
import type { GameState } from "../core/game-state";
import type { GameAction } from "../core/actions";
import { journey } from "../content/journey";

// Deliberately kept as local components in this one file: at this size,
// separate screen files would be fragmentation, not organization.

function TitleScreen({ dispatch }: { dispatch: Dispatch<GameAction> }) {
  return (
    <div className="screen">
      <h1>Project Wander</h1>
      <p className="premise">
        You leave your hometown simply because the world is larger than you
        imagined.
      </p>
      <button onClick={() => dispatch({ type: "START_JOURNEY" })}>
        Set out
      </button>
    </div>
  );
}

function TravelScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}) {
  const leg = journey.legs[state.legIndex];

  return (
    <div className="screen">
      <div className="stat-row">
        <span>HP: {state.hp}</span>
        <span>Food: {state.food}</span>
        <span>Preparation: {state.preparation}</span>
      </div>
      <p className="leg-progress">
        Leg {state.legIndex + 1} of {journey.legs.length}
      </p>
      {leg ? (
        <>
          <h2>{leg.name}</h2>
          <p>{leg.description}</p>
        </>
      ) : (
        <p>The road ahead is unclear.</p>
      )}
      {state.food === 0 && (
        <p className="warning">Traveling hungry will cost you HP.</p>
      )}
      <button onClick={() => dispatch({ type: "TRAVEL" })}>Travel</button>
    </div>
  );
}

function JourneyCompleteScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}) {
  return (
    <div className="screen">
      <h1>{journey.arrival.name}</h1>
      <p>{journey.arrival.description}</p>
      <div className="stat-row">
        <span>HP: {state.hp}</span>
        <span>Food: {state.food}</span>
        <span>Preparation: {state.preparation}</span>
      </div>
      <button onClick={() => dispatch({ type: "START_JOURNEY" })}>
        Begin another journey
      </button>
    </div>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(reduce, undefined, createInitialState);

  switch (state.phase) {
    case "title":
      return <TitleScreen dispatch={dispatch} />;
    case "traveling":
      return <TravelScreen state={state} dispatch={dispatch} />;
    case "arrived":
      return <JourneyCompleteScreen state={state} dispatch={dispatch} />;
  }
}
