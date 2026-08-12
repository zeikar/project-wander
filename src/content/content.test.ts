import { describe, expect, it } from "vitest";
import { encounters, speciesList } from "./encounters";
import { roadEvents } from "./events";
import { journey } from "./journey";
import { village, type VillageOption } from "./village";
// The one core import in this folder, and only from a test. The rule that
// content imports nothing from core is about what ships: the content modules
// themselves stay standalone. Restating the toll as a literal 3 here would put
// the same number in two places, which is the failure this project has already
// written down elsewhere.
import { HUNGRY_TRAVEL_HP_LOSS } from "../core/game-state";
import { effectiveOption } from "../core/weather";

// Every sky an option's `closedIn`/`weatherDeltas` can name. Iterated by every
// invariant below that used to check only the implicit clear-sky content —
// rain and wind can close or reprice an option, so a bound checked once
// against the authored figures no longer covers what a real journey can meet.
const WEATHERS = ["clear", "rain", "wind"] as const;

describe("encounters content", () => {
  // The reducer selects an encounter with a non-null assertion, which is only
  // sound because this list is never empty.
  it("is not empty", () => {
    expect(encounters.length).toBeGreaterThan(0);
  });

  it("has unique encounter ids", () => {
    const ids = encounters.map((encounter) => encounter.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique species ids", () => {
    const ids = speciesList.map((species) => species.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  // `pickSituation` draws a species first and then indexes into that species'
  // situations with a non-null assertion. A species authored with no situation
  // would make the road able to draw an animal it cannot show.
  it("gives every species at least one situation to be met in", () => {
    for (const species of speciesList) {
      const situations = encounters.filter(
        (encounter) => encounter.speciesId === species.id,
      );

      expect(situations.length).toBeGreaterThanOrEqual(1);
    }
  });

  // The species pick is uniform over `speciesList`, so giving one animal more
  // situations must not make that animal commoner — it splits its own share.
  // This is what lets the boar carry three situations without moving any of the
  // tuning measured when it had one.
  it("keeps every species equally likely however many situations it has", () => {
    const boar = encounters.filter(
      (encounter) => encounter.speciesId === "boar",
    );

    expect(boar.length).toBeGreaterThan(1);
    expect(speciesList.length).toBe(
      new Set(encounters.map((encounter) => encounter.speciesId)).size,
    );
  });

  // The seeded encounter script is a function of BOTH orders: the reducer picks
  // a species by indexing `speciesList`, then indexes that species' situations
  // the same way. `encounters/index.ts` says so in a comment — this is what
  // makes the comment enforceable. Reordering either list is not a refactor; it
  // rewrites what every existing seed meets on the road, and no other test in
  // this suite would notice, because they all derive their expectations from
  // the same arrays. ADD AT THE END, and update this list when you do.
  it("keeps both load-bearing orders exactly as shipped", () => {
    expect(speciesList.map((species) => species.id)).toEqual([
      "boar",
      "wolves",
      "bees",
      "waxwings",
      "red-deer",
    ]);
    expect(encounters.map((encounter) => encounter.id)).toEqual([
      "ford-boar",
      "wallow-boar",
      "sow-and-litter",
      "pine-shadows",
      "wolves-at-a-kill",
      "bee-hollow",
      "robbed-hollow",
      "old-skep",
      "rowan-flock",
      "thorn-hedge-flock",
      "rut-stag",
      "walled-lane-stag",
    ]);
  });

  // A leg can now hold two scenes at once, and the reducer identifies WHICH of
  // them the traveler answered from the option id alone. So option ids have to
  // be unique across every animal and every place, not merely within a scene —
  // an animal and a place sharing one would resolve against whichever `find`
  // reached first, charging the wrong deltas and logging the wrong title. The
  // per-scene uniqueness checks below and in "road events content" do not cover
  // this; all 72 shipped ids are already distinct, so what this constrains is
  // the next author.
  it("gives no two options anywhere the same id", () => {
    const ids = [...encounters, ...roadEvents].flatMap((scene) =>
      scene.options.map((option) => option.id),
    );

    expect(new Set(ids).size).toBe(ids.length);
  });

  // How often the road can feed a traveler is an average of PER-SPECIES ratios,
  // because a species is drawn first and one of its situations second. That
  // makes the number of situations authored for an animal that always feeds you
  // — the bees and the waxwings — the largest food lever in the game, and it
  // only pulls down. The counts here were chosen to land the share on a declared
  // target before the scenes were written, and until this test the target lived
  // only in a comment: no other invariant can see whether a situation feeds at
  // all, so an edit could quietly move the whole road's difficulty and keep
  // every other test green.
  it("keeps the feeding ratio each species was authored to", () => {
    const FEEDING_SITUATIONS: Record<string, number> = {
      boar: 1, // the wallow only
      wolves: 1, // the kill only
      bees: 2, // not the robbed hollow
      waxwings: 2, // both — this is the second food source
      "red-deer": 0, // a cost animal in both of his situations
    };

    let share = 0;
    for (const species of speciesList) {
      const situations = encounters.filter(
        (encounter) => encounter.speciesId === species.id,
      );
      const feeding = situations.filter((encounter) =>
        encounter.options.some((option) => option.foodDelta > 0),
      );

      expect(feeding.length).toBe(FEEDING_SITUATIONS[species.id]);
      share += feeding.length / situations.length;
    }

    // 50.0%, which is where the road sat before the wolves and the bees gained
    // situations. Moving this is a difficulty decision, not a content one.
    expect(share / speciesList.length).toBeCloseTo(0.5, 5);
  });

  // `wolves-at-a-kill` is the one scene authored so that arriving destitute is
  // not punished: its free answer PAYS. The generic invariants above cannot see
  // that — they are satisfied by any rescue that merely costs nothing — so the
  // contract is pinned to the option and its figures here.
  it("keeps the kill's free answer paying, in every sky", () => {
    const kill = encounters.find(
      (encounter) => encounter.id === "wolves-at-a-kill",
    )!;
    const rescue = kill.options.find(
      (option) => option.id === "wait-out-the-feed",
    )!;

    expect(rescue.hpDelta).toBe(0);
    expect(rescue.foodDelta).toBe(1);
    expect(rescue.preparationDelta).toBe(0);
    // Ungated in both senses: no kit has to be in hand, and it is on the menu
    // whether or not the traveler has studied the animal.
    expect(rescue.requiresPreparation ?? 0).toBe(0);
    expect(rescue.codex).toBeUndefined();

    for (const weather of WEATHERS) {
      const effective = effectiveOption(rescue, weather);
      expect(effective.closedReason).toBeUndefined();
      expect(effective.foodDelta).toBe(1);
      expect(effective.hpDelta).toBe(0);
    }
  });

  it.each(encounters.map((encounter) => [encounter.id, encounter] as const))(
    "%s offers a playable set of choices",
    (_id, encounter) => {
      expect(encounter.options.length).toBeGreaterThanOrEqual(2);
      expect(encounter.options.length).toBeLessThanOrEqual(5);

      const optionIds = encounter.options.map((option) => option.id);
      expect(new Set(optionIds).size).toBe(optionIds.length);

      // Every encounter now shows two different menus depending on whether the
      // species is known, so the playability guarantees are checked per MENU
      // rather than over the authored list. This replaces the single-menu
      // version: over the whole list, the soft-lock rescue could sit in a menu
      // the player is not currently being shown.
      const menus = [
        encounter.options.filter((option) => option.codex !== "requires"),
        encounter.options.filter((option) => option.codex !== "teaches"),
      ];

      for (const menu of menus) {
        expect(menu.length).toBeGreaterThanOrEqual(2);

        // Always at least one way through that a player holding nothing can
        // take, so being out of food and preparation is never a soft-lock.
        // An earlier invariant only checked non-negative food/preparation
        // deltas. That version would pass for the wrong reason: `show-your-kit`
        // has all-zero deltas but requires preparation in hand, so it does NOT
        // rescue a player at preparation 0. Availability, not just cost, is what
        // the guarantee is about.
        // Checked in every sky, not only the implicit clear one: rain and wind
        // can close the option this used to count as the free rescue, and a
        // menu with none left open would soft-lock a destitute traveler under
        // that sky alone.
        for (const weather of WEATHERS) {
          expect(
            menu.some((option) => {
              const effective = effectiveOption(option, weather);
              return (
                effective.closedReason === undefined &&
                effective.foodDelta >= 0 &&
                effective.preparationDelta >= 0 &&
                (option.requiresPreparation ?? 0) === 0
              );
            }),
          ).toBe(true);
        }
      }

      // One observation and one thing it unlocks, sharing a menu slot. Two
      // teachers would make an encounter teachable twice; none would make a
      // species unlearnable and strand its unlocked answer forever.
      expect(
        encounter.options.filter((option) => option.codex === "teaches").length,
      ).toBe(1);
      expect(
        encounter.options.filter((option) => option.codex === "requires")
          .length,
      ).toBe(1);

      // docs/CONTENT.md: an observe option must be strictly worse in deltas
      // than the encounter's best comparable answer, or the knowledge it
      // grants is free. A comparable answer is one offered in both menus (no
      // codex field), so this does not hardcode which answer each
      // observation is priced against.
      // Re-run per sky, with effective deltas: no `teaches` option ships
      // closed or repriced (checked separately below), but a comparable
      // answer that WAS the dominator can be closed by rain or wind, so the
      // domination has to still hold among whatever is left open.
      const teaches = encounter.options.find(
        (option) => option.codex === "teaches",
      )!;
      const alwaysOffered = encounter.options.filter(
        (option) => option.codex === undefined,
      );

      for (const weather of WEATHERS) {
        const effectiveTeaches = effectiveOption(teaches, weather);
        const openAlwaysOffered = alwaysOffered.filter(
          (option) => effectiveOption(option, weather).closedReason === undefined,
        );

        expect(
          openAlwaysOffered.some((option) => {
            const effective = effectiveOption(option, weather);
            return (
              effective.hpDelta >= effectiveTeaches.hpDelta &&
              effective.foodDelta >= effectiveTeaches.foodDelta &&
              effective.preparationDelta >= effectiveTeaches.preparationDelta &&
              (effective.hpDelta > effectiveTeaches.hpDelta ||
                effective.foodDelta > effectiveTeaches.foodDelta ||
                effective.preparationDelta > effectiveTeaches.preparationDelta)
            );
          }),
        ).toBe(true);
      }

      // The unlocked answer is worth nothing if the knowledge behind it is
      // blank — and the knowledge now lives on the species, so every situation
      // has to resolve to one that exists and says something.
      const species = speciesList.find(
        (candidate) => candidate.id === encounter.speciesId,
      );
      expect(species).toBeDefined();
      expect(species!.fieldNote.length).toBeGreaterThan(0);
      expect(species!.name.length).toBeGreaterThan(0);

      // A requirement is not a second cost: it gates on what is carried and
      // spends none of it. Without this, `requiresPreparation` could quietly
      // drift into being a hidden price.
      for (const option of encounter.options) {
        if (option.requiresPreparation !== undefined) {
          expect(option.requiresPreparation).toBeGreaterThanOrEqual(1);
          expect(option.preparationDelta).toBe(0);
        }
      }

      // And always a use for preparation, so the resource means something.
      expect(
        encounter.options.some((option) => option.preparationDelta < 0),
      ).toBe(true);
    },
  );
});

describe("road signs", () => {
  // A sign is printed inside ONE road's button, beside a road that may be
  // showing something else entirely, so it may only speak for the way it is on.
  // Signs live on the route for exactly that reason; this is a lexical backstop
  // for the wording that gave it away when they lived on the leg, and it is NOT
  // a proof that a sign fits its road. Nothing mechanical can check that — a
  // pinewood sign sat on a way described as "out of the trees entirely" and no
  // test noticed. Read them.
  it("uses no wording that speaks for the way not taken", () => {
    for (const leg of journey.legs) {
      for (const route of leg.routes) {
        for (const line of Object.values(route.signs)) {
          expect(line.toLowerCase()).not.toMatch(/\bboth\b|\beither\b/);
        }
      }
    }
  });

  it("gives no two roads the same line", () => {
    const seen = new Set<string>();

    for (const leg of journey.legs) {
      for (const route of leg.routes) {
        for (const line of Object.values(route.signs)) {
          expect(line.length).toBeGreaterThan(0);
          expect(seen.has(line)).toBe(false);
          seen.add(line);
        }
      }
    }
  });
});

describe("road events content", () => {
  it("is not empty and has unique ids", () => {
    expect(roadEvents.length).toBeGreaterThan(0);
    expect(new Set(roadEvents.map((event) => event.id)).size).toBe(
      roadEvents.length,
    );
  });

  // Animals and places share one id space: the reducer stores whichever the
  // road turned up in the same `activeEncounterId`, and resolves it by looking
  // in both lists. A collision would silently serve the wrong scene.
  it("shares no id with any animal", () => {
    const animalIds = new Set(encounters.map((encounter) => encounter.id));

    for (const event of roadEvents) {
      expect(animalIds.has(event.id)).toBe(false);
    }
  });

  it("gives every place at least two options, with unique ids", () => {
    for (const event of roadEvents) {
      expect(event.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(event.options.map((option) => option.id)).size).toBe(
        event.options.length,
      );
    }
  });

  // A place is not a species: there is nothing to learn about it and nothing
  // knowledge unlocks there. Enforced structurally rather than by convention,
  // because an event option carrying a codex marker would put an id into
  // `state.known` that the field-note lookup cannot resolve.
  it("carries nothing the codex could latch onto", () => {
    for (const event of roadEvents) {
      for (const option of event.options) {
        expect(option).not.toHaveProperty("codex");
        expect(option).not.toHaveProperty("requiresPreparation");
      }
    }
  });

  // The one number that distinguishes one place from another, pinned by VALUE
  // because four measured attempts at richer differentiation each turned some
  // place's own options into decoration. Changing any figure here is a design
  // decision to re-measure, not a tuning slip to wave through.
  it("varies places only by how good the night is, and never below the floor", () => {
    // A rest costs a meal, and a meal is worth roughly the 3 hp a hungry leg
    // takes, so hp+1 is never a trade worth making — it measured at 2.3% of its
    // offers. Two is the floor; the camp's three is the whole of the difference
    // between these places.
    const NIGHTS: Record<string, number> = {
      "old-camp": 3,
      "wrecked-cart": 2,
      "out-of-season-shieling": 2,
    };

    expect(roadEvents.map((event) => event.id).sort()).toEqual(
      Object.keys(NIGHTS).sort(),
    );

    for (const event of roadEvents) {
      // Exactly one, so "the night" is a single well-defined thing rather than
      // whichever healing option happens to come first.
      const nights = event.options.filter((option) => option.hpDelta > 0);
      expect(nights).toHaveLength(1);

      const night = nights[0]!;
      expect(night.hpDelta).toBe(NIGHTS[event.id]);
      expect(night.hpDelta).toBeGreaterThanOrEqual(2);
      // And every night is bought with the same meal, so the hp figure above is
      // genuinely the only thing that varies.
      expect(night.foodDelta).toBe(-1);
      expect(night.preparationDelta).toBe(0);
    }

    // Exactly one place sleeps better than the rest.
    const best = Math.max(...Object.values(NIGHTS));
    expect(
      Object.values(NIGHTS).filter((hp) => hp === best),
    ).toHaveLength(1);

    // Everything OTHER than the night is identical across places, which is what
    // keeps every place option worth taking.
    const trades = (event: (typeof roadEvents)[number]) =>
      event.options
        .filter((option) => option.hpDelta <= 0)
        .map(
          (option) =>
            `${option.hpDelta},${option.foodDelta},${option.preparationDelta}`,
        )
        .sort()
        .join(" | ");

    expect(new Set(roadEvents.map(trades)).size).toBe(1);
  });

  // The road always has to leave something to click. A place whose every option
  // costs food or preparation could be reached with neither in hand.
  it("always leaves at least one option a destitute traveler can take", () => {
    for (const event of roadEvents) {
      const free = event.options.filter(
        (option) => option.foodDelta >= 0 && option.preparationDelta >= 0,
      );

      expect(free.length).toBeGreaterThan(0);
    }
  });

  // The same guarantee, for the half of the content where it was never checked.
  // The loop above covers `roadEvents` only — the list where it was already
  // satisfied — and a playtest found the animals had quietly broken it: at food
  // 0 and preparation 0 the boar, the wolves and the stag each offered exactly
  // ONE answer, and it was the biggest wound that animal had. Measured over 300
  // seeds, those three options were 54.1% of every death in the game.
  //
  // Something to click is not enough here, because an animal can charge hp and
  // a place cannot. So this asserts the PRICE of being cornered: whatever the
  // destitute traveler is forced to take, plus the hungry leg's own toll that
  // lands on the same click, must not cost more than half of a full pool. A
  // screen nobody chose must not take more than half of what you set out with.
  //
  // Deliberately checked with hp at full and both other resources at zero — the
  // ratio is what is being pinned, not any particular traveler's survival.
  // Run once per sky, against EFFECTIVE deltas: rain and wind can close the
  // option that used to be the cheap way out, which can only make the worst
  // affordable answer worse, never better, so this bound has to hold under
  // every sky the road can actually show, not only the implicit clear one.
  it("never corners a destitute traveler for more than half a full pool, in any sky", () => {
    for (const weather of WEATHERS) {
      const worstAffordable = Math.max(
        ...encounters.flatMap((encounter) =>
          // Known and unknown both: the codex swaps one option for another, so a
          // species can be generous to a traveler who studied it and brutal to
          // one who has not. Both travelers are real.
          [false, true].map((known) => {
            const affordable = encounter.options.filter((option) => {
              const effective = effectiveOption(option, weather);
              return (
                effective.closedReason === undefined &&
                effective.foodDelta >= 0 &&
                effective.preparationDelta >= 0 &&
                (option.requiresPreparation ?? 0) === 0 &&
                (option.codex !== "teaches" || !known) &&
                (option.codex !== "requires" || known)
              );
            });

            expect(affordable.length).toBeGreaterThan(0);

            // The best they can do is the least blood on offer.
            return -Math.max(
              ...affordable.map(
                (option) => effectiveOption(option, weather).hpDelta,
              ),
            );
          }),
        ),
      );

      expect(worstAffordable + HUNGRY_TRAVEL_HP_LOSS).toBeLessThanOrEqual(
        journey.start.hp / 2,
      );
    }
  });

  // The blood-only answer at each animal that wounds — what a traveler with an
  // empty pack is left holding. Pinned in the same shape as NIGHTS above,
  // because these numbers carry design claims and the invariant overhead cannot
  // see them: it bounds the WORST case across all animals, so it stays green
  // while any individual wound drifts under that bound.
  //
  // Both claims below were written into comments beside the values and checked
  // by nothing, which is the specific way this project has been wrong before.
  const FORCED_WOUNDS = [
    { encounter: "ford-boar", option: "wade-past", hpDelta: -4 },
    { encounter: "pine-shadows", option: "walk-on", hpDelta: -3 },
    { encounter: "rut-stag", option: "push-past", hpDelta: -4 },
    // The drove lane charges what the hollow charges. It was authored a band
    // cheaper and the sweep sent it back: see the note above the encounter.
    // `wolves-at-a-kill` has no entry here on purpose — its free answer pays
    // food, so nothing in that scene is forced.
    { encounter: "walled-lane-stag", option: "press-along-the-wall", hpDelta: -4 },
    // A band under the ford and the lane, because a colony that has already
    // been robbed has nothing left to hold a line over.
    { encounter: "robbed-hollow", option: "push-through-the-homeless", hpDelta: -3 },
  ] as const;

  it.each(FORCED_WOUNDS)(
    "$encounter/$option keeps its price and stays reachable with an empty pack",
    ({ encounter: encounterId, option: optionId, hpDelta }) => {
      const encounter = encounters.find((c) => c.id === encounterId)!;
      const forced = encounter.options.find((o) => o.id === optionId)!;

      expect(forced.hpDelta).toBe(hpDelta);

      // Reachable with nothing in the pack — that is what makes its price the
      // price of being cornered. Deliberately NOT "the only such option" and
      // deliberately NOT "the worst option here": pinning either would freeze
      // the defect this change exists to soften. A second affordable answer, or
      // a differently-priced one that trades a deeper wound for food, is an
      // improvement rather than a break, and the aggregate invariant above
      // already stops the case that actually hurts — being cornered for more
      // than half a pool.
      expect(forced.foodDelta).toBeGreaterThanOrEqual(0);
      expect(forced.preparationDelta).toBeGreaterThanOrEqual(0);
      expect(forced.requiresPreparation ?? 0).toBe(0);
    },
  );

  // The shipped closure set, pinned in the same shape as NIGHTS and
  // FORCED_WOUNDS above: which option closes under which sky is a design
  // claim, not something the invariants above can see (they only bound
  // aggregates). Matched 1:1 against the AUTHORING RULE comment in
  // content/weather.ts, which is the prose these closures have to keep true —
  // weather.test.ts checks the prose side of that promise; this pins the
  // content side.
  const WEATHER_CLOSURES = [
    { encounter: "ford-boar", option: "scatter-bait", weather: "rain" },
    { encounter: "ford-boar", option: "bait-a-trace", weather: "rain" },
    {
      encounter: "wallow-boar",
      option: "smoke-it-out-of-the-hollow",
      weather: "rain",
    },
    { encounter: "bee-hollow", option: "smoke-them", weather: "rain" },
    {
      encounter: "wolves-at-a-kill",
      option: "smoke-them-off-the-kill",
      weather: "rain",
    },
    { encounter: "wallow-boar", option: "wait-downwind", weather: "wind" },
    { encounter: "rowan-flock", option: "net-the-fall", weather: "wind" },
    { encounter: "rut-stag", option: "wave-your-kit", weather: "wind" },
    {
      encounter: "walled-lane-stag",
      option: "sheet-over-the-coping",
      weather: "wind",
    },
    { encounter: "robbed-hollow", option: "smoke-a-path", weather: "rain" },
    { encounter: "old-skep", option: "smoke-the-skep", weather: "rain" },
    {
      encounter: "thorn-hedge-flock",
      option: "beat-the-hedge-over-your-sheet",
      weather: "wind",
    },
  ] as const;

  // The shipped reprice set, same shape again. `hpDelta`/`foodDelta` are the
  // EFFECTIVE figures the reprice replaces the clear-sky one with, not an
  // amount added to it.
  const WEATHER_REPRICES = [
    {
      encounter: "bee-hollow",
      option: "reach-in",
      weather: "rain",
      hpDelta: -1,
    },
    {
      encounter: "rowan-flock",
      option: "take-the-windfall",
      weather: "wind",
      foodDelta: 2,
    },
    {
      encounter: "thorn-hedge-flock",
      option: "take-what-drops-below",
      weather: "wind",
      foodDelta: 2,
    },
  ] as const;

  it("closes and reprices exactly the shipped set, nothing more and nothing less", () => {
    const closed = encounters
      .flatMap((encounter) =>
        encounter.options
          .filter((option) => option.closedIn !== undefined)
          .map((option) => `${encounter.id}/${option.id}`),
      )
      .sort();
    const repriced = encounters
      .flatMap((encounter) =>
        encounter.options
          .filter((option) => option.weatherDeltas !== undefined)
          .map((option) => `${encounter.id}/${option.id}`),
      )
      .sort();

    expect(closed).toEqual(
      WEATHER_CLOSURES.map((c) => `${c.encounter}/${c.option}`).sort(),
    );
    expect(repriced).toEqual(
      WEATHER_REPRICES.map((c) => `${c.encounter}/${c.option}`).sort(),
    );
  });

  it.each(WEATHER_CLOSURES)(
    "$encounter/$option is closed in $weather, with a real reason on the button",
    ({ encounter: encounterId, option: optionId, weather }) => {
      const option = encounters
        .find((c) => c.id === encounterId)!
        .options.find((o) => o.id === optionId)!;

      expect(option.closedIn!.weather).toBe(weather);
      expect(option.closedIn!.reason.length).toBeGreaterThan(0);
      // Closed in exactly the one sky it names — never the other, and never
      // clear, which is what would let a closed option keep working on a day
      // the prose says nothing closed it.
      expect(effectiveOption(option, weather).closedReason).toBeDefined();
      const other = weather === "rain" ? "wind" : "rain";
      expect(effectiveOption(option, other).closedReason).toBeUndefined();
      expect(effectiveOption(option, "clear").closedReason).toBeUndefined();
    },
  );

  it.each(WEATHER_REPRICES)(
    "$encounter/$option reprices in $weather, with an overridden result",
    ({ encounter: encounterId, option: optionId, weather, ...expected }) => {
      const option = encounters
        .find((c) => c.id === encounterId)!
        .options.find((o) => o.id === optionId)!;
      const effective = effectiveOption(option, weather);

      if ("hpDelta" in expected) {
        expect(effective.hpDelta).toBe(expected.hpDelta);
      }
      if ("foodDelta" in expected) {
        expect(effective.foodDelta).toBe(expected.foodDelta);
      }
      // The clear-sky prose has to change along with the number, or the
      // result line describes a wound or a haul the reducer did not charge.
      expect(effective.resultText).not.toBe(option.resultText);
      expect(effective.resultText.length).toBeGreaterThan(0);
    },
  );

  // The label contract this whole milestone exists to keep: a repriced number
  // that the player cannot actually SEE is a discount the screen does not
  // show. hp is banded (App.tsx `costHint`), so a repriced wound only counts
  // as visible if it lands in a different band; food is stated exactly, so any
  // numeric difference is visible on its own.
  it("makes every reprice visible on the label: a different hp band, or a different food count", () => {
    const band = (wound: number) =>
      wound < HUNGRY_TRAVEL_HP_LOSS
        ? "little"
        : wound > HUNGRY_TRAVEL_HP_LOSS
          ? "lot"
          : "mid";

    for (const row of WEATHER_REPRICES) {
      const option = encounters
        .find((c) => c.id === row.encounter)!
        .options.find((o) => o.id === row.option)!;
      const effective = effectiveOption(option, row.weather);

      if (effective.hpDelta !== option.hpDelta) {
        expect(band(-effective.hpDelta)).not.toBe(band(-option.hpDelta));
      }
      // Checked against the row's own DECLARED value, not merely "differs
      // from the authored one": `if (effective.foodDelta !== option.foodDelta)
      // expect(effective.foodDelta).not.toBe(option.foodDelta)` is a guard
      // that is also the assertion — for primitive numbers that can never
      // fail, and it cannot catch a reprice authored equal to the clear-sky
      // price either. Proven by mutation: silently dropping the wind
      // foodDelta reprice inside `effectiveOption` left the old version of
      // this check green while three other tests correctly failed. Pinning
      // the effective figure against `row.foodDelta` fails when the reprice
      // stops reaching the label; pinning `row.foodDelta` against the
      // authored figure fails if a reprice is ever authored equal to the
      // price it is supposed to replace.
      if ("foodDelta" in row) {
        expect(effective.foodDelta).toBe(row.foodDelta);
        expect(row.foodDelta).not.toBe(option.foodDelta);
      }
    }
  });
});

describe("village content", () => {
  it("has exactly three options, with unique non-empty ids, labels, and result text", () => {
    expect(village.options.length).toBe(3);

    const ids = village.options.map((option) => option.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const option of village.options) {
      expect(option.id.length).toBeGreaterThan(0);
      expect(option.label.length).toBeGreaterThan(0);
      expect(option.resultText.length).toBeGreaterThan(0);
    }
  });

  // Villagers only ever give: none touches hp, and food and preparation never
  // go down. That is the confirmed invariant a departure-day stop is built on
  // — there is nothing yet on the road to spend.
  it("never costs hp, food, or preparation", () => {
    for (const option of village.options) {
      expect(option.hpDelta).toBe(0);
      expect(option.foodDelta).toBeGreaterThanOrEqual(0);
      expect(option.preparationDelta).toBeGreaterThanOrEqual(0);
    }
  });

  it("gives exactly one point of preparation from exactly one villager", () => {
    const gearGivers = village.options.filter(
      (option) => option.preparationDelta > 0,
    );

    expect(gearGivers).toHaveLength(1);
    expect(gearGivers[0]!.preparationDelta).toBe(1);
    expect(gearGivers[0]!.foodDelta).toBe(0);
  });

  it("gives exactly one point of food from exactly one villager", () => {
    const foodGivers = village.options.filter(
      (option) => option.foodDelta > 0,
    );

    expect(foodGivers).toHaveLength(1);
    expect(foodGivers[0]!.foodDelta).toBe(1);
    expect(foodGivers[0]!.preparationDelta).toBe(0);
  });

  it("gives knowledge from exactly one villager, with no ledger delta attached", () => {
    const knowledgeGivers = village.options.filter((option) => option.teaches);

    expect(knowledgeGivers).toHaveLength(1);
    expect(knowledgeGivers[0]!.hpDelta).toBe(0);
    expect(knowledgeGivers[0]!.foodDelta).toBe(0);
    expect(knowledgeGivers[0]!.preparationDelta).toBe(0);
  });

  // The three currencies — a point of gear, a point of food, and knowledge —
  // are pairwise distinct: no villager hands over more than one. It was four
  // until the sky was measured and cut; what the count guards is unchanged,
  // which is that meeting one villager forgoes what every other one carries.
  it("keeps the three currencies pairwise distinct across the three villagers", () => {
    const currenciesOf = (option: VillageOption): string[] => {
      const carried: string[] = [];
      if (option.preparationDelta > 0) carried.push("gear");
      if (option.foodDelta > 0) carried.push("food");
      if (option.teaches) carried.push("knowledge");
      return carried;
    };

    for (const option of village.options) {
      expect(currenciesOf(option)).toHaveLength(1);
    }

    expect(new Set(village.options.flatMap(currenciesOf)).size).toBe(3);
  });

  // `teachesSpecies` is materialized on the offered copy at runtime (core), the
  // same structural check style as the roadEvents `codex` check above: content
  // never carries the field, only the game session does. The four other
  // encounter/event-only fields have no business on a villager either.
  it("carries no encounter-only fields: no seeded pick, no codex marker, no weather rule", () => {
    for (const option of village.options) {
      expect(option).not.toHaveProperty("teachesSpecies");
      expect(option).not.toHaveProperty("codex");
      expect(option).not.toHaveProperty("requiresPreparation");
      expect(option).not.toHaveProperty("closedIn");
      expect(option).not.toHaveProperty("weatherDeltas");
    }
  });
});
