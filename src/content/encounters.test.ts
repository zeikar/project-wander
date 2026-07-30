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
      expect(encounter.options.length).toBeLessThanOrEqual(3);

      const optionIds = encounter.options.map((option) => option.id);
      expect(new Set(optionIds).size).toBe(optionIds.length);

      // Always at least one way through that costs no consumable resource, so
      // a player out of food and preparation is never stuck.
      expect(
        encounter.options.some(
          (option) => option.foodDelta >= 0 && option.preparationDelta >= 0,
        ),
      ).toBe(true);

      // And always a use for preparation, so the resource means something.
      expect(
        encounter.options.some((option) => option.preparationDelta < 0),
      ).toBe(true);
    },
  );
});
