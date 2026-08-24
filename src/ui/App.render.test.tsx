import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DefeatedScreen, JourneyCompleteScreen } from "./App";
import type { GameState } from "../core/game-state";
import { journey } from "../content/journey";

// The one file in this repo that asserts RENDERED output. It exists for the one
// question the pure helpers in `App.test.ts` cannot answer: not what a line
// says, but whether it is on the screen at all and WHICH screen it is on. A
// string function keeps returning the right sentence after the JSX that prints
// it has been deleted, so nothing but a render can catch that.
// `renderToStaticMarkup` out of the `react-dom` the game already ships, and
// nothing else: no test renderer, no DOM library, no new dependency. Static
// markup rather than a hydrating render because none of this asks a question
// about interaction — only about what is present.
// Deliberately narrow. This is not a snapshot harness and must not become one:
// the four cases below are the left-standing line and nothing else, because
// asserting prose that content owns would break every time content is edited,
// for no gain. Strings stay in `App.test.ts`, where they can be swept
// exhaustively and cheaply.

const frame = journey.arrival.leftStanding;

// The record's leg and the leg the traveler has reached are deliberately
// different numbers throughout: on the arrival screen `legIndex` has already
// run off the end of the road.
const ANIMAL_LEG = 3;
const PLACE_LEG = 6;

// What a left-standing line collapses to if the `&&` guard is ever dropped.
// React renders `<p>{""}</p>` as exactly this, and neither end screen contains
// an empty paragraph for any other reason — so its presence means one thing.
const EMPTY_PARAGRAPH = "<p></p>";

// What the player would read, spelled the way the markup spells it:
// `renderToStaticMarkup` escapes the apostrophe in "somebody else's work".
// Composed from the authored frame rather than typed out, so a content edit
// moves the expectation with it.
function sentenceAsMarkup(kind: "animal" | "place", legIndex: number): string {
  return (
    frame.before +
    frame.kind[kind] +
    frame.middle +
    journey.legs[legIndex]!.name +
    frame.after
  ).replaceAll("'", "&#x27;");
}

// The state each end screen actually renders in. `completeLeg` increments
// before the phase changes, so an arrival sits with `legIndex` past the last
// leg while `leftStanding` still points at the leg it was written on.
function endState(overrides: Partial<GameState>): GameState {
  return {
    phase: "arrived",
    hp: journey.start.hp - 5,
    food: 1,
    preparation: 0,
    legIndex: journey.legs.length,
    rngState: 7,
    seed: 12345,
    activeEncounterId: null,
    secondSceneId: null,
    lastEncounterResult: null,
    lastRoadToll: null,
    leftStanding: null,
    known: [],
    log: [],
    ...overrides,
  };
}

function renderArrival(state: GameState): string {
  return renderToStaticMarkup(
    <JourneyCompleteScreen state={state} dispatch={() => {}} />,
  );
}

describe("the arrival screen", () => {
  it("names an animal that was left standing, and the leg it stood on", () => {
    const markup = renderArrival(
      endState({ leftStanding: { legIndex: ANIMAL_LEG, kind: "animal" } }),
    );

    expect(markup).toContain(sentenceAsMarkup("animal", ANIMAL_LEG));
  });

  it("names somebody else's work that was left standing, and the leg it stood on", () => {
    const markup = renderArrival(
      endState({ leftStanding: { legIndex: PLACE_LEG, kind: "place" } }),
    );

    expect(markup).toContain(sentenceAsMarkup("place", PLACE_LEG));
  });

  // Absence is AUTHORED: a journey that answered everything it met gets no
  // line, not a padded one — and no empty ELEMENT either, which is the half a
  // string function cannot answer. Both halves are asserted, because they fail
  // independently: dropping the block loses the text, while dropping only the
  // `&&` guard keeps the text absent and leaves a `<p></p>` standing in its
  // place — a paragraph that renders nothing and still takes its margin.
  it("says nothing at all when the journey passed nothing by", () => {
    const markup = renderArrival(endState({ leftStanding: null }));

    expect(markup).not.toContain(frame.before);
    expect(markup).not.toContain(frame.middle);
    expect(markup).not.toContain(EMPTY_PARAGRAPH);
  });
});

// A recorded product decision, not an oversight: on a death the larger loss is
// already stated ("You never see Alderbrook"), and a second one dilutes it
// rather than compounding it. The record can perfectly well be SET here — a
// traveler can pass a pair on one leg and die three legs later — so this is the
// case that pins the decision rather than a state that cannot arise.
describe("the defeat screen", () => {
  it("never names what was left standing, even when there is a record of it", () => {
    const markup = renderToStaticMarkup(
      <DefeatedScreen
        state={endState({
          phase: "defeated",
          hp: 0,
          legIndex: PLACE_LEG,
          lastRoadToll: "The road takes the last of you.",
          leftStanding: { legIndex: ANIMAL_LEG, kind: "animal" },
        })}
        dispatch={() => {}}
      />,
    );

    expect(markup).not.toContain(frame.before);
    expect(markup).not.toContain(frame.middle);
    expect(markup).not.toContain(EMPTY_PARAGRAPH);
  });
});
