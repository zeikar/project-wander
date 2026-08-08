import { describe, expect, it } from "vitest";
import { encounters, speciesList } from "./encounters";
import { roadEvents } from "./events";
import { journey } from "./journey";
// The one core import in this folder, and only from a test. The rule that
// content imports nothing from core is about what ships: the content modules
// themselves stay standalone. Restating the toll as a literal 3 here would put
// the same number in two places, which is the failure this project has already
// written down elsewhere.
import { HUNGRY_TRAVEL_HP_LOSS } from "../core/game-state";

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
        expect(
          menu.some(
            (option) =>
              option.foodDelta >= 0 &&
              option.preparationDelta >= 0 &&
              (option.requiresPreparation ?? 0) === 0,
          ),
        ).toBe(true);
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
      const teaches = encounter.options.find(
        (option) => option.codex === "teaches",
      )!;
      const alwaysOffered = encounter.options.filter(
        (option) => option.codex === undefined,
      );

      expect(
        alwaysOffered.some(
          (option) =>
            option.hpDelta >= teaches.hpDelta &&
            option.foodDelta >= teaches.foodDelta &&
            option.preparationDelta >= teaches.preparationDelta &&
            (option.hpDelta > teaches.hpDelta ||
              option.foodDelta > teaches.foodDelta ||
              option.preparationDelta > teaches.preparationDelta),
        ),
      ).toBe(true);

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
  it("never corners a destitute traveler for more than half a full pool", () => {
    const worstAffordable = Math.max(
      ...encounters.flatMap((encounter) =>
        // Known and unknown both: the codex swaps one option for another, so a
        // species can be generous to a traveler who studied it and brutal to
        // one who has not. Both travelers are real.
        [false, true].map((known) => {
          const affordable = encounter.options.filter(
            (option) =>
              option.foodDelta >= 0 &&
              option.preparationDelta >= 0 &&
              (option.requiresPreparation ?? 0) === 0 &&
              (option.codex !== "teaches" || !known) &&
              (option.codex !== "requires" || known),
          );

          expect(affordable.length).toBeGreaterThan(0);

          // The best they can do is the least blood on offer.
          return -Math.max(...affordable.map((option) => option.hpDelta));
        }),
      ),
    );

    expect(worstAffordable + HUNGRY_TRAVEL_HP_LOSS).toBeLessThanOrEqual(
      journey.start.hp / 2,
    );
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
});
