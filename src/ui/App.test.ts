import { describe, expect, it } from "vitest";
import type { GameState } from "../core/game-state";
import { encounters, speciesList } from "../content/encounters";
import type { EncounterOption } from "../content/encounters";
import { roadEvents } from "../content/events";
import { canChooseOption } from "../core/reducer";
import { effectiveOption, weatherAt } from "../core/weather";
import { HUNGRY_TRAVEL_HP_LOSS } from "../core/game-state";
import {
  costHint,
  knowledgeHint,
  leavesNoFood,
  leftStandingLine,
  roadAhead,
  shortfallHint,
  trafficHint,
} from "./App";
import { journey } from "../content/journey";
import { village } from "../content/village";
import type { VillageOption } from "../content/village";
import type { Weather } from "../content/weather";

// A journey seed whose weather at leg 0 is `weather` — every fixture below
// lands on leg 0, so one scan per sky is enough to pin all three.
function findSeedWith(weather: Weather): number {
  for (let seed = 1; seed <= 100000; seed++) {
    if (weatherAt(seed, 0) === weather) {
      return seed;
    }
  }
  throw new Error(`no seed in 1..100000 gives ${weather} at leg 0`);
}

// Named rather than inlined, because most tests below run against every
// authored option and were written before weather could reprice one of
// them — CLEAR_SKY_SEED is what keeps their assertions describing the
// authored (clear-sky) figures they were written to check. RAIN_SEED and
// WIND_SEED are for the tests that deliberately check a reprice.
const CLEAR_SKY_SEED = findSeedWith("clear");
const RAIN_SEED = findSeedWith("rain");
const WIND_SEED = findSeedWith("wind");

// This file pins the STRINGS the screens print — a plain function of state and
// an option, tested the same way core's pure functions are, which is what lets
// the assertions below sweep every option under every sky. What is on which
// screen is a different question, answered by rendering in App.render.test.tsx;
// neither file covers the other.
function makeEncounterState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: "encounter",
    // At `journey.start.hp` minus a little, because hp is clamped at the
    // starting pool: a fixture ABOVE the ceiling is a state the game cannot
    // reach, and it hid a label promising healing that would not happen.
    hp: journey.start.hp - 4,
    food: 1,
    preparation: 1,
    legIndex: 0,
    rngState: 1,
    seed: CLEAR_SKY_SEED,
    activeEncounterId: "ford-boar",
    secondSceneId: null,
    lastEncounterResult: null,
    lastRoadToll: null,
    leftStanding: null,
    known: [],
    log: [],
    ...overrides,
  };
}

const fordBoar = encounters.find((encounter) => encounter.id === "ford-boar")!;
const beeHollow = encounters.find(
  (encounter) => encounter.id === "bee-hollow",
)!;
const waitItOut = fordBoar.options.find(
  (option) => option.id === "wait-it-out",
)!; // foodDelta -1
const wadePast = fordBoar.options.find((option) => option.id === "wade-past")!; // foodDelta 0
const reachIn = beeHollow.options.find((option) => option.id === "reach-in")!; // hpDelta -3, foodDelta +2
const smokeThem = beeHollow.options.find(
  (option) => option.id === "smoke-them",
)!; // preparationDelta -1, foodDelta +2
const leaveIt = beeHollow.options.find((option) => option.id === "leave-it")!; // preparationDelta +1
const pineShadows = encounters.find(
  (encounter) => encounter.id === "pine-shadows",
)!;
const showYourKit = pineShadows.options.find(
  (option) => option.id === "show-your-kit",
)!; // requiresPreparation 1, spends nothing
const lightTorch = pineShadows.options.find(
  (option) => option.id === "light-torch",
)!; // preparationDelta -1
const baitATrace = fordBoar.options.find(
  (option) => option.id === "bait-a-trace",
)!; // requiresPreparation 1, spends nothing
const readThePack = pineShadows.options.find(
  (option) => option.id === "read-the-pack",
)!; // hpDelta -1, foodDelta -1
const watchTheFlightLine = beeHollow.options.find(
  (option) => option.id === "watch-the-flight-line",
)!; // no delta of any kind
const workTheDeepSeam = beeHollow.options.find(
  (option) => option.id === "work-the-deep-seam",
)!; // foodDelta +2, unlocked by knowing the hollow
const rowanFlock = encounters.find(
  (encounter) => encounter.id === "rowan-flock",
)!;
const takeTheWindfall = rowanFlock.options.find(
  (option) => option.id === "take-the-windfall",
)!; // foodDelta +1 clear, +2 under wind

describe("leavesNoFood", () => {
  it("warns when an affordable option would spend the last food", () => {
    const state = makeEncounterState({ food: 1 });

    expect(leavesNoFood(state, waitItOut)).toBe(true);
  });

  it("warns when food is already zero and the option does not replenish it", () => {
    const state = makeEncounterState({ food: 0 });

    expect(leavesNoFood(state, wadePast)).toBe(true);
  });

  it("does not warn when the option replenishes food", () => {
    const state = makeEncounterState({
      food: 0,
      activeEncounterId: "bee-hollow",
    });

    expect(leavesNoFood(state, reachIn)).toBe(false);
  });

  it("does not warn on an unaffordable option, even though the food math lands at or below zero", () => {
    const state = makeEncounterState({ food: 0 });

    // 0 + (-1) = -1: canChooseOption disables this button, so it must not
    // also claim finishing the leg will cost HP.
    expect(leavesNoFood(state, waitItOut)).toBe(false);
  });

  // The reducer returns `defeated` the moment an encounter empties the hp bar
  // and never completes the leg, so a wound the traveler does not survive is
  // followed by no toll at all. Promising one is the same false model this
  // label exists to stop, pointing the other way.
  it("does not warn when the wound itself ends the journey", () => {
    const lethal = makeEncounterState({
      hp: -wadePast.hpDelta,
      food: 0,
      activeEncounterId: "ford-boar",
    });

    expect(canChooseOption(lethal, wadePast)).toBe(true);
    expect(lethal.hp + wadePast.hpDelta).toBe(0);
    expect(leavesNoFood(lethal, wadePast)).toBe(false);

    // One more hp and the traveler lives to be charged, so the warning returns.
    expect(leavesNoFood({ ...lethal, hp: lethal.hp + 1 }, wadePast)).toBe(true);
  });
});

describe("costHint", () => {
  it("names what an option spends", () => {
    const state = makeEncounterState({ preparation: 2, food: 2 });

    expect(costHint(state, lightTorch)).toBe(
      " — costs 1 preparation (leaves 1 in hand)",
    );
    expect(costHint(state, waitItOut)).toBe(" — costs 1 food");
  });

  // The measured failure this exists to fix: spending preparation can shut a
  // door at a later encounter, and nothing said so at the moment of spending.
  it("says what survives the spend, so the closing door is visible", () => {
    const rich = makeEncounterState({ preparation: 2 });
    const poor = makeEncounterState({ preparation: 1 });

    expect(costHint(rich, lightTorch)).toContain("(leaves 1 in hand)");
    expect(costHint(poor, lightTorch)).toContain("(leaves 0 in hand)");
  });

  // Regression: a cold reader saw "costs 1 preparation (-1 left in hand)" on an
  // option they could not afford. Same class of bug as the disabled-option HP
  // warning caught in an earlier milestone — a hint about a spend that cannot
  // happen is worse than no hint.
  it("shows no remainder on an option the player cannot afford", () => {
    const state = makeEncounterState({
      activeEncounterId: "pine-shadows",
      preparation: 0,
    });

    expect(canChooseOption(state, lightTorch)).toBe(false);
    expect(costHint(state, lightTorch)).toBe(" — costs 1 preparation");
    expect(costHint(state, lightTorch)).not.toContain("-1");
  });

  it("says nothing for an option that costs nothing at all", () => {
    const state = makeEncounterState({ preparation: 2 });

    // show-your-kit costs nothing; its clause is the requirement, not a cost.
    expect(costHint(state, showYourKit)).not.toContain("costs");
  });

  it("states outright that a held requirement spends nothing", () => {
    const state = makeEncounterState({ preparation: 2 });
    const hint = costHint(state, showYourKit);

    // Playtest finding: the requirement/cost distinction was legible but not
    // TRUSTED — a hoarder read it correctly and still took a wound rather than
    // risk being billed. Saying "spends none" removes the inference.
    expect(hint).toBe(" — needs 1 preparation in hand, spends none");
    expect(hint).not.toContain("costs");
  });

  it("still explains a gated option that is disabled, so the button is not a dead end", () => {
    const state = makeEncounterState({
      activeEncounterId: "pine-shadows",
      preparation: showYourKit.requiresPreparation! - 1,
      // `show-your-kit` also needs the wolves known to the pines' own rung,
      // which is their first. Without this the option would be refused for
      // being unlearned and the test would pass while saying nothing about a
      // short kit.
      known: [{ speciesId: "wolves", depth: 1 }],
    });

    expect(canChooseOption(state, showYourKit)).toBe(false);
    expect(costHint(state, showYourKit)).toContain(
      "needs 1 preparation in hand",
    );
  });

  // The line the one deliberate secret is drawn on: an hp cost is NAMED but never
  // PRICED, while food and preparation are stated exactly, in both directions.
  // Discovering how badly an animal hurts you is the design; letting the label
  // imply it does not hurt you at all was a bug.
  it("names an hp cost without pricing it", () => {
    const state = makeEncounterState();

    // wade-past is hpDelta -4 and spends nothing else.
    expect(costHint(state, wadePast)).toBe(" — costs a lot of blood");
    expect(costHint(state, wadePast)).not.toContain("4");
    // reach-in is hpDelta -3 AND foodDelta +2: both sides show, neither number
    // for the wound.
    expect(costHint(state, reachIn)).toBe(" — costs blood, gains 2 food");
    expect(costHint(state, reachIn)).not.toContain("3");
  });

  // Regression, and the reason the clause above exists at all: labelling only
  // food and preparation made a missing clause read as "this one is safe". At
  // the hollow that inverted the actual ordering — reach-in appeared to give the
  // same 2 food as smoke-them for free. Whatever else changes, an option that
  // draws blood must never look cheaper than one that does not.
  it("never lets a wounding option read as cheaper than a bloodless one", () => {
    const state = makeEncounterState({ preparation: 2, food: 2 });

    // Places as well as animals: a place's options run through the same label.
    for (const scene of [...encounters, ...roadEvents]) {
      for (const option of scene.options) {
        expect(costHint(state, option).includes("blood")).toBe(
          option.hpDelta < 0,
        );
      }
    }
  });

  // The band has to track the actual size, or it is the flat word again with
  // more syllables. Hinged on the one hp figure the game states outright: a
  // playtester generalised a 2 hp wound across encounters, bet on a fourth
  // costing the same, and paid 4.
  it("scales the wound to the one hp figure the game states outright", () => {
    const state = makeEncounterState({ preparation: 2, food: 2 });

    for (const scene of [...encounters, ...roadEvents]) {
      for (const option of scene.options) {
        if (option.hpDelta >= 0) continue;
        const hint = costHint(state, option);
        const wound = -option.hpDelta;

        expect(hint).toContain(
          wound < HUNGRY_TRAVEL_HP_LOSS
            ? "a little blood"
            : wound > HUNGRY_TRAVEL_HP_LOSS
              ? "a lot of blood"
              : "blood",
        );
        // Banded, still not priced. Checked against the BLOOD clause rather
        // than the whole string, because food and preparation are stated as
        // numbers and legitimately put digits in the same sentence.
        expect(hint).not.toMatch(/\d\s*(hp|blood)/i);
        expect(hint).not.toMatch(/blood\s*\d/i);
        expect(hint.toLowerCase()).not.toContain("hp");
      }
    }
  });

  // Every wound in the catalogue has to land in a band that some option
  // actually reaches, or the scale is finer than the content and reads as
  // precision the player cannot use.
  it("uses every band it defines", () => {
    const state = makeEncounterState({ preparation: 2, food: 2 });
    const hints = [...encounters, ...roadEvents]
      .flatMap((scene) => scene.options)
      .filter((option) => option.hpDelta < 0)
      .map((option) => costHint(state, option));

    for (const band of ["a little blood", "a lot of blood"]) {
      expect(hints.some((hint) => hint.includes(band))).toBe(true);
    }
    expect(
      hints.some(
        (hint) =>
          hint.includes("blood") &&
          !hint.includes("a little blood") &&
          !hint.includes("a lot of blood"),
      ),
    ).toBe(true);
  });

  // The mirror of the rule above, and it exists because the first option that
  // gave hp back shipped reading as pure loss: "Sleep under their lean-to —
  // costs 1 food", with the whole point of it unmentioned. Named on both
  // sides, priced on neither.
  it("names an option that gives hp back, without pricing it", () => {
    const hurt = makeEncounterState({ preparation: 2, food: 2 });
    const healing = [...encounters, ...roadEvents].flatMap((scene) =>
      scene.options.filter((option) => option.hpDelta > 0),
    );

    expect(healing.length).toBeGreaterThan(0);
    for (const option of healing) {
      const hint = costHint(hurt, option);
      expect(hint).toContain("some of yourself back");
      expect(hint).not.toContain(String(option.hpDelta));
    }
  });

  // The other half of the same rule. hp is clamped at the pool the traveler set
  // out with, so at full health this option costs a meal and returns nothing —
  // and a label still promising rest would be the same false clause the one
  // above exists to fix, pointing the other way.
  it("promises no healing to a traveler who is already whole", () => {
    const whole = makeEncounterState({
      hp: journey.start.hp,
      preparation: 2,
      food: 2,
    });
    const healing = [...encounters, ...roadEvents].flatMap((scene) =>
      scene.options.filter((option) => option.hpDelta > 0),
    );

    for (const option of healing) {
      expect(costHint(whole, option)).not.toContain("some of yourself back");
    }
  });

  // Regression: a planning reader under-predicted the hollow twice in a row
  // because gains were unlabelled — "Costs are stated on the label; gains are
  // not stated anywhere."
  it("names what an option gives back", () => {
    const state = makeEncounterState({ preparation: 2 });

    expect(costHint(state, leaveIt)).toBe(" — gains 1 preparation");
    // smoke-them both spends and gives, so it carries one ledger clause.
    expect(costHint(state, smokeThem)).toBe(
      " — costs 1 preparation (leaves 1 in hand), gains 2 food",
    );
  });

  // The codex options go through the existing rules unchanged: nothing here has
  // a positive hpDelta, so no new clause was needed. These pin what the four
  // shapes actually read as, including the two that say nothing about a wound's
  // size and the one that truthfully says nothing at all.
  it("describes what knowledge costs and what it buys", () => {
    // Each option is evaluated against ITS OWN encounter: canChooseOption
    // resolves the codex gate through the scene that OWNS the option, so an
    // option paired with a state whose scenes do not hold it resolves no
    // species at all — a state the game cannot reach, and one that would say
    // nothing about what knowledge costs or buys.
    const atBees = makeEncounterState({
      preparation: 2,
      food: 2,
      activeEncounterId: "bee-hollow",
      // The hollow is the bees' first rung, so one is what it asks for.
      known: [{ speciesId: "bees", depth: 1 }],
    });
    const atBoar = makeEncounterState({
      preparation: 2,
      food: 2,
      activeEncounterId: "ford-boar",
      // The ford is the boar's first rung.
      known: [{ speciesId: "boar", depth: 1 }],
    });
    const atWolves = makeEncounterState({
      preparation: 2,
      food: 2,
      activeEncounterId: "pine-shadows",
    });

    expect(costHint(atBees, workTheDeepSeam)).toBe(" — gains 2 food");
    expect(costHint(atBoar, baitATrace)).toBe(
      " — needs 1 preparation in hand, spends none",
    );
    expect(costHint(atWolves, readThePack)).toBe(
      " — costs a little blood and 1 food",
    );
  });

  it("gives an observation that spends nothing an empty clause, not a missing one", () => {
    const state = makeEncounterState({
      preparation: 2,
      food: 2,
      activeEncounterId: "bee-hollow",
    });

    // watch-the-flight-line gives up the afternoon and nothing else. An empty
    // clause is the truthful label, not a missing one.
    expect(costHint(state, watchTheFlightLine)).toBe("");
  });
});

// The three refusals `canChooseOption` makes that nothing on the screen used to
// name. Whole strings, not "not empty": the figure in hand IS the label, so a
// hint naming the cost instead of the holding would satisfy any weaker check.
describe("shortfallHint", () => {
  it("names the food in hand when the option would spend more than there is", () => {
    const state = makeEncounterState({ food: 0 });

    expect(canChooseOption(state, waitItOut)).toBe(false);
    expect(shortfallHint(state, waitItOut)).toBe(" — you have 0 food");
  });

  it("names the preparation in hand when the option would spend more than there is", () => {
    const state = makeEncounterState({
      activeEncounterId: "bee-hollow",
      preparation: 0,
    });

    expect(canChooseOption(state, smokeThem)).toBe(false);
    expect(shortfallHint(state, smokeThem)).toBe(" — you have 0 preparation");
  });

  it("names the preparation in hand against a requirement it does not meet", () => {
    const state = makeEncounterState({
      activeEncounterId: "ford-boar",
      preparation: 0,
      // `bait-a-trace` is a `requires` option, so without the boar known to the
      // ford's own rung `offeredOptions` would keep it off the menu entirely
      // and a short kit would never be what refuses it.
      known: [{ speciesId: "boar", depth: 1 }],
    });

    expect(canChooseOption(state, baitATrace)).toBe(false);
    expect(shortfallHint(state, baitATrace)).toBe(" — you have 0 preparation");
  });

  // The boundary, and the reason it is worth its own test: every test above
  // still passes with any of the three comparisons off by one — 0 in hand
  // against a price of 1 is short under `<` and `<=` alike — so this is the
  // one that refuses that version. The last point in hand covering the price
  // exactly is an affordable option, and an affordable option says nothing.
  it("says nothing when the last point in hand covers the price exactly", () => {
    const atFord = makeEncounterState({
      food: 1,
      preparation: 1,
      known: [{ speciesId: "boar", depth: 1 }],
    });
    const atHollow = makeEncounterState({
      activeEncounterId: "bee-hollow",
      preparation: 1,
    });

    expect(canChooseOption(atFord, waitItOut)).toBe(true);
    expect(shortfallHint(atFord, waitItOut)).toBe("");
    expect(canChooseOption(atFord, baitATrace)).toBe(true);
    expect(shortfallHint(atFord, baitATrace)).toBe("");
    expect(canChooseOption(atHollow, smokeThem)).toBe(true);
    expect(shortfallHint(atHollow, smokeThem)).toBe("");
  });

  // hp is not a shortfall, because hp does not gate an option: the traveler can
  // always take a wound they will not survive. Naming one would invent a
  // refusal the rules never make, which is the wrong-model bug costHint's
  // bands exist to prevent, pointing the other way.
  it("never says anything about hp, however deep the wound", () => {
    const dying = makeEncounterState({ hp: 1, food: 2, preparation: 2 });

    // wade-past is hpDelta -4 and spends nothing else.
    expect(canChooseOption(dying, wadePast)).toBe(true);
    expect(shortfallHint(dying, wadePast)).toBe("");
  });

  // One reason per button: the sky has already answered this one on screen,
  // and what the pack holds would not change the refusal. Paired with the same
  // short kit under a sky that closes nothing, because a helper that had simply
  // gone silent everywhere would pass the first assertion alone.
  it("says nothing about an option the sky has already closed", () => {
    const rained = makeEncounterState({
      seed: RAIN_SEED,
      activeEncounterId: "bee-hollow",
      preparation: 0,
    });

    expect(
      effectiveOption(smokeThem, weatherAt(rained.seed, rained.legIndex))
        .closedReason,
    ).toBe("no tinder will smoke in this rain");
    expect(shortfallHint(rained, smokeThem)).toBe("");
    expect(shortfallHint({ ...rained, seed: CLEAR_SKY_SEED }, smokeThem)).toBe(
      " — you have 0 preparation",
    );
  });

  // The two halves of one sentence on one button. costHint states the price and
  // then goes deliberately quiet — no "(leaves -1 in hand)" on an option that
  // cannot be taken — and this is what speaks in that gap; against a
  // requirement it completes the clause rather than restating it.
  it("reads as one sentence with the costHint printed beside it", () => {
    const atHollow = makeEncounterState({
      activeEncounterId: "bee-hollow",
      preparation: 0,
    });
    const atFord = makeEncounterState({
      activeEncounterId: "ford-boar",
      preparation: 0,
      known: [{ speciesId: "boar", depth: 1 }],
    });

    expect(costHint(atHollow, smokeThem)).not.toContain("in hand");
    expect(
      costHint(atHollow, smokeThem) + shortfallHint(atHollow, smokeThem),
    ).toBe(" — costs 1 preparation, gains 2 food — you have 0 preparation");
    expect(
      costHint(atFord, baitATrace) + shortfallHint(atFord, baitATrace),
    ).toBe(
      " — needs 1 preparation in hand, spends none — you have 0 preparation",
    );
  });
});

// costHint and leavesNoFood read `effectiveOption`, the same function the
// reducer charges through — these three pin that a rain or wind reprice
// actually surfaces on the label, not only in the numbers the reducer applies.
describe("weather repricing on the label", () => {
  it("rain's reach-in reads a little blood, not the clear-sky middle band, and no digit", () => {
    const state = makeEncounterState({
      seed: RAIN_SEED,
      activeEncounterId: "bee-hollow",
    });
    const hint = costHint(state, reachIn);

    expect(hint).toContain("a little blood");
    expect(hint).not.toMatch(/blood\s*\d/i);
    expect(hint).not.toMatch(/\d\s*blood/i);
  });

  it("wind's windfall reads gains 2 food, not the clear-sky 1", () => {
    const state = makeEncounterState({
      seed: WIND_SEED,
      activeEncounterId: "rowan-flock",
    });

    expect(costHint(state, takeTheWindfall)).toBe(" — gains 2 food");
  });

  // Neither shipped reprice can flip `leavesNoFood`'s own boolean: both
  // `weatherDeltas` only ever GIVE the traveler more than the clear-sky
  // figure, so from any reachable (non-negative) starting food or survivable
  // hp there is no state where either one crosses the warning's actual
  // trigger. A test built only from `reachIn`/`takeTheWindfall` would pass
  // whether or not `leavesNoFood` reads the effective numbers at all — proven
  // by mutating it to read `option.hpDelta`/`option.foodDelta` directly and
  // watching the suite stay green. `leavesNoFood` and `effectiveOption` are
  // pure functions of `(state, option)`; nothing requires the option to come
  // from `encounters.ts`, so the two tests below build a synthetic
  // `EncounterOption` whose `weatherDeltas` crosses the trigger in each
  // direction, the same way this file already pins `costHint` and
  // `leavesNoFood` as plain functions rather than by proxy through shipped
  // content.
  it("warns under the sky that reprices an option's food to exactly zero, and not under the one that does not", () => {
    // Base (clear-sky) foodDelta is 0, so at food 1 the clause never fires.
    // The wind reprice moves it to -1, which does, at the same starting food.
    const syntheticOption: EncounterOption = {
      id: "test-only-windfall-cost",
      label: "test-only option",
      hpDelta: 0,
      foodDelta: 0,
      preparationDelta: 0,
      resultText: "test-only",
      weatherDeltas: { weather: "wind", foodDelta: -1 },
    };
    const clear = makeEncounterState({ seed: CLEAR_SKY_SEED, food: 1 });
    const wind = makeEncounterState({ seed: WIND_SEED, food: 1 });

    expect(leavesNoFood(clear, syntheticOption)).toBe(false);
    expect(leavesNoFood(wind, syntheticOption)).toBe(true);
  });

  // The lethality guard, read through the EFFECTIVE hp: base (clear-sky)
  // hpDelta is -1, survivable at hp 5, so the food clause (also met, foodDelta
  // -1 at food 1) decides the warning — TRUE. The rain reprice deepens the
  // wound to -5, which the same hp does not survive, so the guard must block
  // the warning even though the food clause is still met — FALSE. A version
  // of `leavesNoFood` that read `option.hpDelta` instead of the effective one
  // would still see the clear-sky -1 under rain, stay "alive", and wrongly
  // warn — which is exactly the failure this test is built to catch.
  it("blocks the warning under the sky that reprices an option's wound to lethal, even though the food clause is still met", () => {
    const syntheticOption: EncounterOption = {
      id: "test-only-lethal-reprice",
      label: "test-only option",
      hpDelta: -1,
      foodDelta: -1,
      preparationDelta: 0,
      resultText: "test-only",
      weatherDeltas: { weather: "rain", hpDelta: -5 },
    };
    const clear = makeEncounterState({
      seed: CLEAR_SKY_SEED,
      hp: 5,
      food: 1,
    });
    const rain = makeEncounterState({ seed: RAIN_SEED, hp: 5, food: 1 });

    expect(leavesNoFood(clear, syntheticOption)).toBe(true);
    expect(leavesNoFood(rain, syntheticOption)).toBe(false);
  });
});

// A leg can hold a place and an animal at once, and both scenes' options are
// labelled by the same two functions. `leavesNoFood` is the half that reads
// `canChooseOption`, which resolves the codex gate through the scene that OWNS
// the option — here the place itself, whichever slot it is in; `costHint` reads
// only the option's effective deltas and the traveler's own numbers. A place
// carries no `codex` on any option, so what the traveler knows about the animal
// standing beside it must not move a single character of the place's labels
// through either.
describe("labels on a leg that holds two things", () => {
  it("reads a place's options the same beside a known animal as it does alone", () => {
    const place = roadEvents[0]!;
    // food 1 and preparation 1 so that both a cost clause and the
    // no-food-left warning are live on this place's options — comparing two
    // empty strings would be a test that cannot fail.
    const alone = makeEncounterState({
      activeEncounterId: place.id,
      food: 1,
      preparation: 1,
    });
    const beside = makeEncounterState({
      activeEncounterId: "pine-shadows",
      secondSceneId: place.id,
      known: [{ speciesId: "wolves", depth: 1 }],
      food: 1,
      preparation: 1,
    });

    expect(place.options.some((option) => costHint(alone, option) !== "")).toBe(
      true,
    );
    expect(place.options.some((option) => leavesNoFood(alone, option))).toBe(
      true,
    );
    for (const option of place.options) {
      expect(costHint(beside, option)).toBe(costHint(alone, option));
      expect(leavesNoFood(beside, option)).toBe(leavesNoFood(alone, option));
    }
  });
});

// The one string the village screen adds that no other screen has: what the
// trapper's button promises to teach. Resolved from `teachesSpecies` — the very
// field the reducer appends to `known` — so a hint naming the wrong animal is a
// screen promising what the rules will not do.
describe("knowledgeHint", () => {
  // Resolved by what a villager GIVES rather than by id, the same way the
  // reducer's own village tests find them.
  const villagerWho = (matches: (option: VillageOption) => boolean) =>
    village.options.find(matches)!;
  const trapper = villagerWho((option) => option.teaches === true);

  it("names the very animal the offer carries, whichever one it is", () => {
    // Every species, so a lookup that reached for a FIXED entry — the first in
    // the list, say — passes on one animal and fails on the other four.
    for (const species of speciesList) {
      expect(knowledgeHint({ ...trapper, teachesSpecies: species.id })).toBe(
        ` — what he knows about the ${species.name}`,
      );
    }
  });

  // The wording itself, written out rather than derived. The sentence above
  // interpolates the name it looks up, so it cannot see a CONTENT rename —
  // change "Marsh Boar" to anything else and only this test goes red. (It does
  // catch a phrasing change; both spell the clause out.)
  it("reads as a clause on the end of the villager's own label", () => {
    expect(knowledgeHint({ ...trapper, teachesSpecies: "boar" })).toBe(
      " — what he knows about the Marsh Boar",
    );
  });

  // Authored content never carries `teachesSpecies` (pinned in content.test.ts)
  // — only the offered copy does — so every villager as written is silent here,
  // and a hint that appeared before the pick was made would be a claim about an
  // animal nobody chose.
  it("says nothing for a villager who teaches nothing", () => {
    for (const option of village.options) {
      expect(knowledgeHint(option)).toBe("");
    }
  });
});

// The village screen labels its villagers with the SAME `costHint` the
// encounter screen uses, on the same option shape — so the exact-number
// contract for food and preparation holds across the module boundary between
// `VillageOption` and `EncounterOption`, without a line of new label code.
describe("costHint on the village screen", () => {
  it("names what a villager gives, exactly", () => {
    const villageState = makeEncounterState({
      phase: "village",
      activeEncounterId: null,
    });
    const smith = village.options.find(
      (option) => option.preparationDelta > 0,
    )!;

    expect(costHint(villageState, smith)).toBe(" — gains 1 preparation");
  });
});

describe("trafficHint", () => {
  it("names the quieter and the busier way on every leg", () => {
    for (const leg of journey.legs) {
      const byOdds = [...leg.routes].sort(
        (a, b) => a.encounterChance - b.encounterChance,
      );

      expect(trafficHint(leg.routes, byOdds[0]!)).toBe(
        " — less likely to turn something up",
      );
      expect(trafficHint(leg.routes, byOdds.at(-1)!)).toBe(
        " — more likely to turn something up",
      );
    }
  });

  // The same contract costHint keeps for hp: say which way the bet leans, never
  // what the odds are. A player should be able to make the choice without being
  // handed the arithmetic.
  // A lone way is not likelier than anything, and comparing it to a road the
  // traveler cannot take would be noise.
  it("says nothing when there is only one way out of the leg", () => {
    const leg = journey.legs[0]!;

    expect(trafficHint([leg.routes[0]!], leg.routes[0]!)).toBe("");
  });

  it("never states a number", () => {
    for (const leg of journey.legs) {
      for (const route of leg.routes) {
        expect(trafficHint(leg.routes, route)).not.toMatch(/\d/);
      }
    }
  });
});

// The village morning is the first thing a traveler spends, and until this line
// existed neither the road's length nor the gate's two axes were on screen when
// they spent it: the counter only appeared once the first leg had begun. These
// pin that the line is DERIVED — a hand-typed "8 legs" would survive a change to
// the road's length and quietly start lying.
describe("roadAhead", () => {
  // Fabricated figures, deliberately not the shipped ones: the road is 8 legs,
  // so asserting against `journey.legs.length` would pass for a hardcoded "8"
  // too. Only a length the game does not have proves the line is derived.
  it("names the destination and the length it is given", () => {
    expect(roadAhead("Somewhere", 3)).toBe(
      "Somewhere is 3 legs of road from here.",
    );
    expect(roadAhead("Elsewhere", 11)).toBe(
      "Elsewhere is 11 legs of road from here.",
    );
  });

  it("states one number and no other", () => {
    expect(roadAhead("Somewhere", 3).match(/\d+/g)).toEqual(["3"]);
  });

  // The call site is what feeds it the real journey; that is a one-line read on
  // the village screen, which App.render.test.tsx does not reach — its four
  // cases are the arrival line and nothing else. What IS pinned here is that the
  // shipped figures produce a sentence that reads correctly.
  it("reads correctly on the shipped journey", () => {
    expect(roadAhead(journey.arrival.name, journey.legs.length)).toBe(
      `${journey.arrival.name} is ${journey.legs.length} legs of road from here.`,
    );
  });
});

// What the sentence SAYS, across both nouns and all eight legs. Whether it
// reaches the arrival screen at all, and that it stays off the defeat screen,
// is a different question and is asked in App.render.test.tsx. The two
// composition cases that file asserts directly are not repeated here.
describe("leftStandingLine", () => {
  // `arrived` with `legIndex` already off the end of the road: `completeLeg`
  // increments before the phase changes, so this is the state the screen
  // actually renders in, not a convenient one.
  function makeArrivedState(overrides: Partial<GameState> = {}): GameState {
    return {
      phase: "arrived",
      hp: journey.start.hp - 5,
      food: 1,
      preparation: 0,
      legIndex: journey.legs.length,
      rngState: 7,
      seed: CLEAR_SKY_SEED,
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

  // The bug this guards is indexing `journey.legs` with `state.legIndex`
  // instead of with the recorded one. A fixture where those two numbers happen
  // to agree passes against the broken version, so this one keeps them apart —
  // and keeps BOTH in range, where the wrong read returns a plausible wrong leg
  // rather than running off the end and throwing.
  // Not a contrived state: `completeLeg` increments `legIndex` and leaves
  // `phase: "traveling"` on every paired leg but the last, so a record sitting
  // behind the current leg is what the reducer produces for the whole rest of
  // the road.
  it("names the leg the record points at, not the leg the traveler has reached", () => {
    const line = leftStandingLine(
      makeArrivedState({
        phase: "traveling",
        legIndex: 6,
        leftStanding: { legIndex: 1, kind: "animal" },
      }),
    );

    expect(line).toContain("Crossroads Waymarker");
    expect(line).not.toContain("Pinewood Rise");
  });

  it("says nothing at all when the journey passed nothing by", () => {
    expect(leftStandingLine(makeArrivedState())).toBe("");
  });

  // Derived, not retyped: the frame and both nouns live in `journey.ts`, and a
  // hand-copied sentence here would keep passing after the content moved.
  it("is composed from the authored frame and the authored noun", () => {
    const frame = journey.arrival.leftStanding;

    for (const kind of ["animal", "place"] as const) {
      for (const [legIndex, leg] of journey.legs.entries()) {
        expect(
          leftStandingLine(
            makeArrivedState({ leftStanding: { legIndex, kind } }),
          ),
        ).toBe(
          `${frame.before}${frame.kind[kind]}${frame.middle}${leg.name}${frame.after}`,
        );
      }
    }
  });
});
