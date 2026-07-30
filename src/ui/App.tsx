import { useReducer } from "react";
import type { Dispatch } from "react";
import { canChooseOption, reduce } from "../core/reducer";
import { createInitialState } from "../core/game-state";
import { arrivalEnding } from "../core/arrival";
import type { GameState } from "../core/game-state";
import type { GameAction } from "../core/actions";
import { journey } from "../content/journey";
import { encounters } from "../content/encounters";
import type { EncounterOption } from "../content/encounters";

// The UI boundary is the only place `Math.random` is allowed (CLAUDE.md §7):
// the core takes the seed as data, so every journey stays reproducible.
function newSeed(): number {
  return (Math.random() * 0x100000000) >>> 0;
}

// Only what an option spends, so the player can weigh the price. What it costs
// in blood is left to be discovered.
// Exported for its unit test: this file has no JSX-rendering harness, so the
// pure string function is tested directly, the same way `leavesNoFood` is.
export function costHint(option: EncounterOption): string {
  const costs: string[] = [];
  if (option.foodDelta < 0) {
    costs.push(`${-option.foodDelta} food`);
  }
  if (option.preparationDelta < 0) {
    costs.push(`${-option.preparationDelta} preparation`);
  }
  const spends = costs.length > 0 ? ` — costs ${costs.join(" and ")}` : "";
  // A requirement is not a cost, and must not read like one: it asks what is
  // still in the pack and takes none of it. Phrased separately so a player can
  // tell "this is spent" from "this is what lets you do it at all" — and so a
  // disabled option still explains why it is closed.
  const requires = option.requiresPreparation
    ? ` — needs ${option.requiresPreparation} preparation in hand`
    : "";
  return `${spends}${requires}`;
}

// Unlike an option's authored hp cost, the leg's toll is a hazard this
// milestone created by moving it to completion: choosing an option that
// leaves no food behind means finishing this leg costs HP instead, decided at
// the same click. Truthful warning about that, not about the hidden delta.
// Guarded by canChooseOption so a disabled (unaffordable) option is never
// described as costing HP it can't actually be chosen to spend.
export function leavesNoFood(
  state: GameState,
  option: EncounterOption,
): boolean {
  return (
    canChooseOption(state, option) && state.food + option.foodDelta === 0
  );
}

// Deliberately kept as local components in this one file: at this size,
// separate screen files would be fragmentation, not organization.

function StatRow({ state }: { state: GameState }) {
  return (
    <div className="stat-row">
      <span>HP: {state.hp}</span>
      <span>Food: {state.food}</span>
      <span>Preparation: {state.preparation}</span>
    </div>
  );
}

function TitleScreen({ dispatch }: { dispatch: Dispatch<GameAction> }) {
  return (
    <div className="screen">
      <h1>Project Wander</h1>
      <p className="premise">
        You leave your hometown simply because the world is larger than you
        imagined.
      </p>
      <button
        onClick={() => dispatch({ type: "START_JOURNEY", seed: newSeed() })}
      >
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
      <StatRow state={state} />
      {state.lastEncounterResult && (
        <p className="result-line">{state.lastEncounterResult}</p>
      )}
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
        <p className="warning">
          Finishing the leg without food will cost you HP.
        </p>
      )}
      <button onClick={() => dispatch({ type: "TRAVEL" })}>Travel</button>
    </div>
  );
}

function EncounterScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}) {
  // The encounter phase is only ever entered with an id the reducer just picked
  // out of this same list, so a miss here is a broken invariant, not a state the
  // player can reach. Assert rather than render a fallback: a screen with no
  // options would soft-lock the journey.
  const encounter = encounters.find(
    (candidate) => candidate.id === state.activeEncounterId,
  )!;

  return (
    <div className="screen">
      <StatRow state={state} />
      <p className="leg-progress">
        Leg {state.legIndex + 1} of {journey.legs.length}
      </p>
      <h2>{encounter.title}</h2>
      <p>{encounter.description}</p>
      <div className="encounter-options">
        {encounter.options.map((option) => (
          <button
            key={option.id}
            disabled={!canChooseOption(state, option)}
            onClick={() =>
              dispatch({
                type: "CHOOSE_ENCOUNTER_OPTION",
                optionId: option.id,
              })
            }
          >
            {option.label}
            {costHint(option)}
            {leavesNoFood(state, option) && (
              <span className="warning">
                {" "}
                — finishing the leg will cost you HP
              </span>
            )}
          </button>
        ))}
      </div>
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
  const ending = journey.arrival.endings[arrivalEnding(state)];

  return (
    <div className="screen">
      <h1>{journey.arrival.name}</h1>
      {state.lastEncounterResult && (
        <p className="result-line">{state.lastEncounterResult}</p>
      )}
      <h2>{ending.label}</h2>
      <p>{ending.text}</p>
      {state.log.length > 0 && (
        <p>The road behind you: {state.log.join("; ")}.</p>
      )}
      <StatRow state={state} />
      <button
        onClick={() => dispatch({ type: "START_JOURNEY", seed: newSeed() })}
      >
        Begin another journey
      </button>
    </div>
  );
}

function DefeatedScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}) {
  return (
    <div className="screen">
      <h1>The Road Ends Here</h1>
      <p className="result-line">
        {state.lastEncounterResult ??
          "Hunger and the miles take the last of your strength."}
      </p>
      <p>
        You never see {journey.arrival.name}. It stays a name in other people's
        stories.
      </p>
      <StatRow state={state} />
      <button
        onClick={() => dispatch({ type: "START_JOURNEY", seed: newSeed() })}
      >
        Set out again
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
    case "encounter":
      return <EncounterScreen state={state} dispatch={dispatch} />;
    case "arrived":
      return <JourneyCompleteScreen state={state} dispatch={dispatch} />;
    case "defeated":
      return <DefeatedScreen state={state} dispatch={dispatch} />;
  }
}
