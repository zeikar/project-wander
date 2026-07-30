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
      expect(encounter.options.length).toBeLessThanOrEqual(4);

      const optionIds = encounter.options.map((option) => option.id);
      expect(new Set(optionIds).size).toBe(optionIds.length);

      // Always at least one way through that a player holding nothing can take,
      // so being out of food and preparation is never a soft-lock.
      // This replaces an earlier invariant that only checked non-negative
      // food/preparation deltas. That version would now pass for the wrong
      // reason: `show-your-kit` has all-zero deltas but requires preparation in
      // hand, so it does NOT rescue a player at preparation 0. Availability, not
      // just cost, is what the guarantee is about.
      expect(
        encounter.options.some(
          (option) =>
            option.foodDelta >= 0 &&
            option.preparationDelta >= 0 &&
            (option.requiresPreparation ?? 0) === 0,
        ),
      ).toBe(true);

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
