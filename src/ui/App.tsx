import { useReducer } from "react";
import type { Dispatch } from "react";
import { canChooseOption, reduce } from "../core/reducer";
import { HUNGRY_TRAVEL_HP_LOSS, createInitialState } from "../core/game-state";
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

// Shows food and preparation exactly; says only THAT an option costs hp, never
// how much. Exported for its unit test: this file has no JSX-rendering harness,
// so the pure string function is tested directly, the same way `leavesNoFood` is.
export function costHint(
  state: GameState,
  option: EncounterOption,
): string {
  const costs: string[] = [];
  // The sign of an hp cost, never its size. While only food and preparation were
  // labelled, all five options carrying a `costs` clause were hp-neutral and three
  // of the five carrying none drew blood, so a missing COST read as "harmless".
  // At the hollow that inverted the real ordering: `reach-in — gains 2 food` looked
  // strictly better than `smoke-them`, which pays preparation for the same food,
  // while quietly costing 3 hp. How big the wound is, is still found by taking it.
  if (option.hpDelta < 0) {
    costs.push("blood");
  }
  if (option.foodDelta < 0) {
    costs.push(`${-option.foodDelta} food`);
  }
  if (option.preparationDelta < 0) {
    costs.push(`${-option.preparationDelta} preparation`);
  }

  // Gains were unlabelled while costs were spelled out, and nobody had decided
  // that — hiding HP is deliberate design, hiding a payout was just an omission.
  // A planning reader under-predicted the hollow's return twice in a row:
  // "Costs are stated on the label; gains are not stated anywhere."
  const gains: string[] = [];
  if (option.foodDelta > 0) {
    gains.push(`${option.foodDelta} food`);
  }
  if (option.preparationDelta > 0) {
    gains.push(`${option.preparationDelta} preparation`);
  }

  // Spending preparation is the one cost whose real consequence is invisible at
  // the moment you pay it: it can shut a door at a LATER encounter that asks
  // what you are still carrying. Playtest found nobody connected the two —
  // "a single smoke-them at the bees would have silently deleted it. I never
  // saw the game warn about that anywhere." Naming what SURVIVES the spend puts
  // the opportunity cost on the screen where the choice is made. Only
  // preparation gets this: food's own consequence is already covered by the
  // leg-toll warning, so repeating it there would be noise.
  // Guarded by canChooseOption for the same reason `leavesNoFood` is: on an
  // option the player cannot afford, the arithmetic runs negative and a cold
  // reader saw "costs 1 preparation (-1 left in hand)". A remainder is only
  // meaningful for a spend that can actually happen.
  // "leaves" rather than "left": at preparation 2 the phrase "1 left in hand"
  // reads equally as "you hold 1" and "1 will remain", and the reader could not
  // tell which until a different count disambiguated it.
  const remaining =
    option.preparationDelta < 0 && canChooseOption(state, option)
      ? ` (leaves ${state.preparation + option.preparationDelta} in hand)`
      : "";

  // Costs and gains are the same ledger, so they share one clause; the
  // requirement is a different kind of statement and keeps its own.
  const ledger = [
    costs.length > 0 ? `costs ${costs.join(" and ")}${remaining}` : "",
    gains.length > 0 ? `gains ${gains.join(" and ")}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  // A requirement is not a cost and must not read like one. Playtest found the
  // distinction was legible but not TRUSTED: a hoarder read it correctly and
  // still took a 4 HP wound rather than risk being billed. So say outright that
  // it spends nothing, rather than leaving the reader to infer it from the
  // absence of the word "costs".
  const requires = option.requiresPreparation
    ? ` — needs ${option.requiresPreparation} preparation in hand, spends none`
    : "";

  return `${ledger ? ` — ${ledger}` : ""}${requires}`;
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
      {/* The road's charge gets its own line, directly under the animal's, so
          the player can tell which of the two took what. */}
      {state.lastRoadToll && (
        <p className="result-line">{state.lastRoadToll}</p>
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
          Finishing the leg without food will cost you {HUNGRY_TRAVEL_HP_LOSS}{" "}
          HP.
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
            {costHint(state, option)}
            {leavesNoFood(state, option) && (
              <span className="warning">
                {" "}
                — finishing the leg will cost you {HUNGRY_TRAVEL_HP_LOSS} HP
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
      {state.lastRoadToll && (
        <p className="result-line">{state.lastRoadToll}</p>
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
      {/* Whichever of the two actually finished you says so in its own words:
          an animal death carries the encounter's line, a starvation death
          carries the road's. Exactly one is always set — pinned by
          reducer.test.ts — so there is deliberately no fallback here. A generic
          hunger line would mislabel an animal death as starvation, which is the
          attribution error this whole change exists to remove. */}
      {state.lastEncounterResult && (
        <p className="result-line">{state.lastEncounterResult}</p>
      )}
      {state.lastRoadToll && (
        <p className="result-line">{state.lastRoadToll}</p>
      )}
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
