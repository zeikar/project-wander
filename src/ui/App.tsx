import { useReducer } from "react";
import type { Dispatch } from "react";
import {
  activeScenes,
  canChooseOption,
  codexLayerOf,
  offeredOptions,
  offeredRoutes,
  offeredVillageOptions,
  peekRoad,
  reduce,
  speciesDepth,
  speciesOf,
} from "../core/reducer";
import { HUNGRY_TRAVEL_HP_LOSS, createInitialState } from "../core/game-state";
import { arrivalEnding } from "../core/arrival";
import { effectiveOption, weatherAt } from "../core/weather";
import type { GameState } from "../core/game-state";
import type { GameAction } from "../core/actions";
import { journey } from "../content/journey";
import type { LegRoute } from "../content/journey";
import { village } from "../content/village";
import type { VillageOption } from "../content/village";
import { weatherProse } from "../content/weather";
import { speciesList } from "../content/encounters";
import type { EncounterOption } from "../content/encounters";

// The UI boundary is the only place `Math.random` is allowed (CLAUDE.md §7):
// the core takes the seed as data, so every journey stays reproducible.
function newSeed(): number {
  return (Math.random() * 0x100000000) >>> 0;
}

// Shows food and preparation exactly. An hp cost is given as a relative band —
// how it compares to what a hungry leg takes — and never as a number.
// Exported for its unit test: this file has no JSX-rendering harness, so the
// pure string function is tested directly, the same way `leavesNoFood` is.
export function costHint(state: GameState, option: EncounterOption): string {
  // Reads the EFFECTIVE deltas, not the authored ones — the same call
  // `canChooseOption` and the reducer make — so a repriced option's label
  // always shows the number the reducer will actually charge, never the
  // clear-sky figure underneath it.
  const effective = effectiveOption(
    option,
    weatherAt(state.seed, state.legIndex),
  );
  const costs: string[] = [];
  // The SCALE of an hp cost, never the number. Naming the cost at all came
  // first, because a missing clause read as "harmless" and inverted the real
  // ordering at the hollow. But one flat word for costs running from 1 to 6 was
  // not neutral either — a playtester saw a 2 hp wound three times, generalised
  // it, and bet on a fourth encounter costing the same. It cost 4:
  // "I generalized a fixed value from three matching data points and was wrong
  // the moment the encounter type changed." Silence does not leave the player
  // without a model; it leaves them with a WRONG one.
  // Three bands, hinged on the one hp figure the game already states outright —
  // what a leg costs when there is nothing left to eat. Under it, at it, over
  // it. Exactly how much is still found by taking it.
  if (effective.hpDelta < 0) {
    const wound = -effective.hpDelta;
    costs.push(
      wound < HUNGRY_TRAVEL_HP_LOSS
        ? "a little blood"
        : wound > HUNGRY_TRAVEL_HP_LOSS
          ? "a lot of blood"
          : "blood",
    );
  }
  if (effective.foodDelta < 0) {
    costs.push(`${-effective.foodDelta} food`);
  }
  if (effective.preparationDelta < 0) {
    costs.push(`${-effective.preparationDelta} preparation`);
  }

  // Gains were unlabelled while costs were spelled out, and nobody had decided
  // that — hiding HP is deliberate design, hiding a payout was just an omission.
  // A planning reader under-predicted the hollow's return twice in a row:
  // "Costs are stated on the label; gains are not stated anywhere."
  const gains: string[] = [];
  // Named, never priced — the mirror of the `blood` rule above, and added for
  // the same reason it was: the first option that GIVES hp back read as pure
  // loss on the screen ("Sleep under their lean-to — costs 1 food"), which is
  // the exact shape of the bug that made a missing cost read as harmless.
  // Conditional because the healing is: hp is clamped at the pool the traveler
  // set out with, so at full health resting costs a meal and returns nothing,
  // and promising otherwise is the same lie in the other direction.
  if (effective.hpDelta > 0 && state.hp < journey.start.hp) {
    gains.push("some of yourself back");
  }
  if (effective.foodDelta > 0) {
    gains.push(`${effective.foodDelta} food`);
  }
  if (effective.preparationDelta > 0) {
    gains.push(`${effective.preparationDelta} preparation`);
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
    effective.preparationDelta < 0 && canChooseOption(state, option)
      ? ` (leaves ${state.preparation + effective.preparationDelta} in hand)`
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
// And guarded against a LETHAL option, because the reducer returns `defeated`
// the moment an encounter empties the hp bar and never completes the leg — so
// on a wound the traveler does not survive, the road charges nothing. Warning
// about a toll that cannot arrive is the same false model this label exists to
// stop, told the other way round.
export function leavesNoFood(
  state: GameState,
  option: EncounterOption,
): boolean {
  // Effective deltas again: a repriced option's own warning has to agree with
  // the number costHint just showed above it, on the same button.
  const effective = effectiveOption(
    option,
    weatherAt(state.seed, state.legIndex),
  );
  return (
    canChooseOption(state, option) &&
    state.hp + effective.hpDelta > 0 &&
    state.food + effective.foodDelta === 0
  );
}

// Says which way a route leans and never its odds — the same contract costHint
// keeps for hp, and for the same reason: the player should be able to make the
// bet, not compute it. Derived from the leg's own numbers rather than authored
// beside them, so a label can never drift out of step with the chance it
// describes.
// Total because the content is: every leg carries exactly two routes with
// distinct odds, asserted in reducer.test.ts. There is deliberately no branch
// for equal odds or for a middle route in some future three-way leg — that
// would be flexibility for content this game does not have.
// Takes the ways ACTUALLY OFFERED rather than the leg's whole list: on a leg
// that does not fork there is nothing to be likelier than, and a comparison
// against a road the traveler cannot take is noise.
export function trafficHint(
  routes: readonly LegRoute[],
  route: LegRoute,
): string {
  if (routes.length < 2) {
    return "";
  }
  const busiest = Math.max(
    ...routes.map((candidate) => candidate.encounterChance),
  );

  return route.encounterChance === busiest
    ? " — more likely to turn something up"
    : " — less likely to turn something up";
}

// Names the animal a villager's offer will actually teach, so the choice is
// readable BEFORE it is made. Read off `teachesSpecies`, filled by
// `offeredVillageOptions` — the one place that pick is defined, and the same
// function the reducer calls when the button is pressed. It is pure in
// `state.seed` and `state.known`, neither of which moves between this render
// and that click, so the animal named here is the animal learned. The reducer
// asks again rather than being told, because what was earned is its call.
// Empty for the villagers who teach nothing, the same way costHint's clauses
// are empty for what an option does not touch.
// Exported for its unit test: this file has no JSX-rendering harness, so the
// pure string function is tested directly, the same way `costHint` is.
export function knowledgeHint(option: VillageOption): string {
  if (option.teachesSpecies === undefined) {
    return "";
  }
  // The id is picked out of `speciesList` in the first place, so a miss is a
  // broken invariant rather than a state the player can reach — the same
  // assertion FieldNotes makes on the ids in `known`.
  const species = speciesList.find(
    (candidate) => candidate.id === option.teachesSpecies,
  )!;

  return ` — what he knows about the ${species.name}`;
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

// What the traveler has learned, one species at a time, in the order the
// species were first learned. Three screens show it, so the lookup and the
// markup live in one place. The ids in `known` are put there by the reducer
// from this same list, so a miss is a broken invariant rather than a state the
// player can reach.
// `known` is already one entry per species, so this maps it directly: an entry
// at depth 2 shows two lines, not two entries.
function FieldNotes({
  state,
  open = false,
}: {
  state: GameState;
  open?: boolean;
}) {
  if (state.known.length === 0) {
    return null;
  }

  // Folded shut on the screens the traveler is still playing. Three fresh-eyes
  // persona sessions independently stopped reading this block: it reprints
  // every note ever learned under every travel screen, so by a third journey it
  // is ten lines of already-read text, and one session missed the only live
  // thing in it — a "there is more to this animal" line appearing for the first
  // time — because it sat among nine lines formatted exactly like it. What is
  // actionable is already elsewhere: the encounter screen prints "What you
  // know" for the animal in front of you. `open` is passed by the two
  // end-of-run screens and nowhere else, where the notebook is the payoff
  // rather than clutter. The summary counts nothing, for the same reason the
  // locked line below does.
  return (
    <details className="notebook" open={open}>
      <summary>Field notes</summary>
      {state.known.map((entry) => {
        // Keyed on the species, which is what the codex learns — the notebook
        // names the animal, not the afternoon it was watched.
        const species = speciesList.find(
          (candidate) => candidate.id === entry.speciesId,
        )!;
        return (
          <div key={entry.speciesId}>
            {species.fieldNotes.slice(0, entry.depth).map((note) => (
              <p key={note} className="field-note">
                {species.name}: {note}
              </p>
            ))}
            {/* The codex's own locked door, and the reason it names nothing and
                counts nothing: a notebook that said "1 of 2" would turn the
                thing left to find out into a thing left to collect, which is
                the retention mechanism this game's success metric refuses. What
                the traveler is owed is only that there IS more, so that the
                next meeting is worth having. */}
            {entry.depth < species.fieldNotes.length && (
              <p className="field-note">
                {species.name}: there is more to this animal than you have
                worked out yet.
              </p>
            )}
          </div>
        );
      })}
    </details>
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

// How far it is, said in the village where the first spend happens.
// Takes its two figures rather than reading `journey` itself, for one reason:
// a version that read the singleton could not be TESTED for deriving them. The
// shipped road is 8 legs, so a hand-typed "8" and `journey.legs.length` render
// the identical string and a test comparing them agrees with both — which is a
// test that cannot fail, the exact class this project has now found four times.
// Parameterized, `roadAhead("Somewhere", 3)` pins the derivation outright.
// Exported for its unit test: this file has no JSX-rendering harness, so the
// pure string function is tested directly, the same way `costHint` is.
export function roadAhead(destination: string, legs: number): string {
  return `${destination} is ${legs} legs of road from here.`;
}

function VillageScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}) {
  const options = offeredVillageOptions(state);
  // The sky is overhead in the village too, and it is the sky of the leg about
  // to be walked — same standing-fact placement as the other two screens.
  const weather = weatherAt(state.seed, state.legIndex);

  return (
    <div className="screen">
      <StatRow state={state} />
      <p className="weather-line">{weatherProse[weather].line}</p>
      {/* How far it is, and what the far end weighs — both stated HERE, because
          the morning is the first thing the traveler spends and neither was on
          screen when they spent it. The road's length only appeared once the
          first leg had already begun ("Leg 1 of 8"), and the gate's two axes
          only on that same screen, so the choice between a loaf, a mended strap
          and an animal's name was made without either number. That is the
          defect this pair of lines closes: not a new channel, just saying at
          the moment of the decision what the rules had already decided.
          A research pass put it plainly — information the player cannot act on
          is worth nothing, and this project has cut two features for exactly
          that. The reverse also holds: a fact they could have acted on, shown
          one screen too late, is the same waste seen from the other side. */}
      <p className="leg-progress">
        {roadAhead(journey.arrival.name, journey.legs.length)}
      </p>
      <p className="departure">{journey.arrival.departure}</p>
      <h2>{village.name}</h2>
      <p>{village.description}</p>
      {/* What is already in the notebook is exactly what the trapper's offer
          has to be read against: his button names an animal, and this is where
          the player sees which ones they already have. */}
      <FieldNotes state={state} />
      <div className="encounter-options">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() =>
              dispatch({ type: "CHOOSE_VILLAGE_OPTION", optionId: option.id })
            }
          >
            {option.label}
            {/* The same label function the encounter screen uses, on the same
                option shape, so food and preparation stay exact numbers and
                the trapper, who gives neither, reads as the empty clause he
                is. No villager costs anything, so nothing here is ever
                disabled. */}
            {costHint(state, option)}
            {knowledgeHint(option)}
          </button>
        ))}
      </div>
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
  // The traveling phase is only ever entered with a legIndex inside the list —
  // `completeLeg` switches to `arrived` the moment it runs off the end — so a
  // miss here is a broken invariant, not a state the player can reach. Asserted
  // rather than given a fallback, on the same grounds as EncounterScreen: the
  // routes are the only way forward, so a screen rendered without them would
  // soft-lock the journey.
  const leg = journey.legs[state.legIndex]!;
  const routes = offeredRoutes(state);
  const weather = weatherAt(state.seed, state.legIndex);

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
      {/* The sky is a standing fact about this leg, not something that just
          happened, so it sits with the road-rule line below rather than the
          two result lines above. All three skies render — including clear,
          whose line is short — for the same reason the road-rule line is
          shown every leg rather than only when it bites: a slot that only
          appears for rain and wind is harder to learn than one that is
          always there. Two forecasts have now been measured and neither
          ships: a free per-leg cue on whether tomorrow clears, worth at most
          +0.3pp against a +3pp bar (content/weather.ts), and the Ashfold
          shepherd who sold the whole standing block for the morning's only
          choice, whose forecast was worth +1.3pp while choosing him cost
          about 7.4pp against the smith (content/village.ts). This line stays
          a statement of today, and today is all the sky the game says. */}
      <p className="weather-line">{weatherProse[weather].line}</p>
      {/* The terms of the road, up with the stats they govern rather than down
          by the buttons. Stated on EVERY leg, not only when it is about to
          bite: this rule fires eight times a run and is the only cost the
          screen never numbered — four playtesters in a row failed to induce it
          from watching it happen. One concluded the game was non-deterministic;
          another wrote the rule down twice and still mispredicted it on the
          final turn of their third journey. What they were missing is a rate,
          and no amount of watching a rate get charged supplies the rate.
          It replaces the old food-only warning rather than sitting next to it:
          two lines saying the same thing at food 0 was the reason this was
          worded conditionally in the first place. At 0 the same sentence simply
          raises its voice.
          Below the two result lines, not above them: those explain the change
          the player just watched happen to the numbers above, and a standing
          rule wedged between a number and its explanation separates the pair
          that has to be read together. */}
      <p className={state.food === 0 ? "warning" : "road-rule"}>
        The road takes a meal at the end of every leg. With nothing left to eat,
        it takes {HUNGRY_TRAVEL_HP_LOSS} HP instead.
      </p>
      {/* The gate's two axes used to be stated here, on the first leg only, on
          the reasoning that the traveler must know what it weighs BEFORE they
          start spending. That reasoning now points one screen earlier: the
          village morning is the first spend, so the line moved there and is not
          repeated here. Repeating it every leg would be nagging about something
          eight legs away, and repeating it once more on leg 1 would be nagging
          about something said ten seconds ago. */}
      <p className="leg-progress">
        Leg {state.legIndex + 1} of {journey.legs.length}
      </p>
      <h2>{leg.name}</h2>
      <p>{leg.description}</p>
      <FieldNotes state={state} />
      <div className="route-options">
        {routes.map((route) => (
          <button
            key={route.id}
            onClick={() => dispatch({ type: "TRAVEL", routeId: route.id })}
          >
            <span className="route-label">
              {route.label}
              {trafficHint(routes, route)}
            </span>
            <span className="route-description">{route.description}</span>
            {/* Only where there is a choice to make. On a leg that runs on one
                way, reading the ground would tell the traveler something they
                cannot act on, which is the definition of noise. */}
            {routes.length > 1 && (
              <span className="route-sign">
                {/* Asserted, not defaulted. A road is authored with exactly the
                    signs it can show, and `reducer.test.ts` derives that set
                    from the shipped code — so a miss here is a broken invariant
                    rather than a state the player can reach, and a silent blank
                    would hide it. */}
                {route.signs[peekRoad(state, route)]!}
              </span>
            )}
          </button>
        ))}
      </div>
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
  // The encounter phase is only ever entered with ids the reducer just picked
  // out of these same lists, so a miss here is a broken invariant, not a state
  // the player can reach. Assert rather than render a fallback: a screen with no
  // options would soft-lock the journey.
  const scenes = activeScenes(state);
  const weather = weatherAt(state.seed, state.legIndex);

  return (
    <div className="screen">
      <StatRow state={state} />
      <p className="leg-progress">
        Leg {state.legIndex + 1} of {journey.legs.length}
      </p>
      {/* Above the scene, not below: the disabled reasons on the buttons
          further down name what the sky is doing ("the rain has killed every
          scent"), so their context has to be on screen before the buttons
          are reached, the same standing-fact placement as the travel
          screen's weather line. */}
      <p className="weather-line">{weatherProse[weather].line}</p>
      {/* One line, and only where the leg holds two things. It names neither of
          them and prices nothing: both scenes are already titled and described
          below, so the only thing missing was the RULE — that the day ends on
          whichever one is answered. */}
      {scenes.length > 1 && (
        <p className="road-rule">
          Whichever of these you deal with is the end of the day here, and the
          other is left standing.
        </p>
      )}
      {scenes.map((scene) => {
        // Only an animal has anything to know about it, and only as deep as it
        // has been studied. A place is just a place, and `speciesOf` returns
        // undefined for one — so on a leg holding an animal and a place the
        // notes belong to the animal's block and never to the place's, while on
        // a leg holding two animals both blocks can carry them. Asked per scene
        // rather than per leg, which is what makes that fall out.
        const speciesId = speciesOf(scene.id);
        const depth = speciesDepth(state, speciesId);
        // EVERY note held on this animal, not one: a traveler two rungs down
        // knows both things and the deeper one is usually what the scene in
        // front of them is about.
        const fieldNotes =
          speciesId !== undefined
            ? speciesList
                .find((candidate) => candidate.id === speciesId)!
                .fieldNotes.slice(0, depth)
            : [];

        return (
          <section className="scene" key={scene.id}>
            <h2>{scene.title}</h2>
            <p>{scene.description}</p>
            {/* The entries for the animal in front of you, not the whole
                notebook: what you know is only actionable here. */}
            {fieldNotes.map((note) => (
              <p key={note} className="field-note">
                What you know: {note}
              </p>
            ))}
            <div className="encounter-options">
              {offeredOptions(state, scene).map((option) => {
                // The one place this component asks what the sky did to an
                // option: the same rule canChooseOption already refused it by,
                // so a closed button's own reason can never disagree with why
                // it is disabled.
                const closedReason = effectiveOption(
                  option,
                  weather,
                ).closedReason;
                // An observation that is on the menu but below its situation's
                // rung: the traveler can see there is something here and cannot
                // read it yet. `offeredOptions` is what keeps it on the menu and
                // `canChooseOption` is what refuses the click — both pinned in
                // reducer.test.ts — so all this adds is the reason, the same way
                // a weather-closed button carries one.
                // Compared inline rather than through a helper of its own: one
                // caller, and it reads the depth this scene already resolved.
                // The `codex` test comes first, which is what makes the
                // assertion beside it sound: only an animal carries a codex
                // option, and only an animal has a rung.
                const lockedRung =
                  option.codex === "teaches" &&
                  depth < codexLayerOf(scene.id)! - 1;
                return (
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
                    {/* "as well" and "then" are load-bearing. A playtester could
                        not tell whether this figure replaced the option's own
                        cost, was added to it, or only applied depending on
                        something later in the leg, and worked the rule out by
                        trial instead: it "fires when food hits/stays at 0 at
                        leg-end, but the game never stated that rule directly on
                        screen." Banding the option's own hp cost put a worded
                        price next to a numbered one, which made saying which is
                        which more urgent, not less. */}
                    {leavesNoFood(state, option) && (
                      <span className="warning">
                        {" "}
                        — and then, with nothing left to eat, finishing the leg
                        will cost you {HUNGRY_TRAVEL_HP_LOSS} HP as well
                      </span>
                    )}
                    {closedReason && (
                      <span className="warning"> — {closedReason}</span>
                    )}
                    {/* Names no animal and gives no number, for the reason the
                        notebook's own version of this line does: what makes a
                        locked door worth opening is that the traveler can see
                        it, not that they can price it. */}
                    {lockedRung && (
                      <span className="warning">
                        {" "}
                        — there is more going on here than you can read yet
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
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
      <FieldNotes state={state} open />
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
      {/* Shown here too, and not as an afterthought: a toll-caused defeat clears
          `lastEncounterResult`, so without this a lesson learned on the last leg
          would vanish on the one screen that ends the run. */}
      <FieldNotes state={state} open />
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
    case "village":
      return <VillageScreen state={state} dispatch={dispatch} />;
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
