import { describe, expect, it } from "vitest";
import { encounters } from "./encounters";

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
