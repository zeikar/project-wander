import { describe, expect, it } from "vitest";
import { encounters } from "./encounters";
import { roadEvents } from "./events";
import { journey } from "./journey";

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

      // The unlocked answer is worth nothing if the knowledge behind it is blank.
      expect(encounter.fieldNote.length).toBeGreaterThan(0);

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
});
