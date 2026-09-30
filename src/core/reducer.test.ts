import { describe, expect, it } from "vitest";
import type { FactId } from "../content/types";
import { MAX_HP, START_FOOD, START_HP } from "../content/world";
import type { MapNode, WorldMap } from "./map";
import {
  canAfford,
  canRead,
  currentScene,
  nextNodes,
  offeredOptions,
  preview,
  reduce,
} from "./reducer";
import { createInitialState } from "./state";
import type { GameState } from "./state";

// A hand-made road: village -> one scene -> one destination, so each rule can
// be put in front of exactly the scene it is about.
function roadThrough(
  sceneId: string,
  variant: string,
  destinationId = "white-stag-lake",
): WorldMap {
  const start: MapNode = { id: "0-0", layer: 0, index: 0, kind: "start" };
  const scene: MapNode = { id: "1-0", layer: 1, index: 0, kind: "scene", sceneId, variant };
  const dest: MapNode = { id: "2-0", layer: 2, index: 0, kind: "destination", destinationId };
  return {
    layers: [[start], [scene], [dest]],
    next: { "0-0": ["1-0"], "1-0": ["2-0"], "2-0": [] },
  };
}

function atScene(
  sceneId: string,
  variant: string,
  over: Partial<GameState> = {},
): GameState {
  return {
    ...createInitialState(),
    phase: "scene",
    map: roadThrough(sceneId, variant),
    at: "1-0",
    day: 1,
    hp: 4,
    food: 2,
    path: ["0-0", "1-0"],
    ...over,
  };
}

const ids = (state: GameState) => offeredOptions(state).map((o) => o.id);

describe("START", () => {
  it("sets out from the village with a fresh pack and the old notebook", () => {
    const known: FactId[] = ["boar.nose"];
    const state = reduce(createInitialState(known), { type: "START", seed: 7 });
    expect(state.phase).toBe("map");
    expect(state.at).toBe("0-0");
    expect(state.hp).toBe(START_HP);
    expect(state.food).toBe(START_FOOD);
    expect(state.known).toEqual(known);
    expect(nextNodes(state).length).toBeGreaterThan(0);
  });

  it("is ignored in the middle of a journey", () => {
    const state = atScene("ford-boar", "rooting");
    expect(reduce(state, { type: "START", seed: 1 })).toBe(state);
  });
});

describe("MOVE", () => {
  const onMap = (over: Partial<GameState> = {}) =>
    atScene("ford-boar", "rooting", { phase: "map", at: "0-0", day: 0, path: ["0-0"], ...over });

  it("walks only a road that leads on from here", () => {
    const state = onMap();
    expect(reduce(state, { type: "MOVE", nodeId: "2-0" })).toBe(state);
    expect(reduce(state, { type: "MOVE", nodeId: "1-0" }).at).toBe("1-0");
  });

  it("eats a meal a day, and takes blood when there is none", () => {
    const fed = reduce(onMap({ food: 2, hp: 4 }), { type: "MOVE", nodeId: "1-0" });
    expect([fed.food, fed.hp, fed.hungry, fed.day]).toEqual([1, 4, false, 1]);
    const hungry = reduce(onMap({ food: 0, hp: 4 }), { type: "MOVE", nodeId: "1-0" });
    expect([hungry.food, hungry.hp, hungry.hungry]).toEqual([0, 3, true]);
  });

  it("ends the journey when hunger takes the last of you", () => {
    const state = reduce(onMap({ food: 0, hp: 1 }), { type: "MOVE", nodeId: "1-0" });
    expect(state.phase).toBe("end");
    expect(state.ending).toEqual({ kind: "died", cause: "hunger" });
  });

  it("sees the destination's sight only with the fact it needs", () => {
    const before = atScene("ford-boar", "rooting", { phase: "map" });
    const missed = reduce(before, { type: "MOVE", nodeId: "2-0" });
    expect(missed.ending).toEqual({ kind: "arrived", destinationId: "white-stag-lake", saw: false });
    const saw = reduce({ ...before, known: ["deer.dawn"] }, { type: "MOVE", nodeId: "2-0" });
    expect(saw.ending).toEqual({ kind: "arrived", destinationId: "white-stag-lake", saw: true });
  });
});

describe("CHOOSE", () => {
  it("plays out the variant that is actually there", () => {
    const rooting = reduce(atScene("ford-boar", "rooting"), { type: "CHOOSE", optionId: "cross" });
    const alert = reduce(atScene("ford-boar", "alert"), { type: "CHOOSE", optionId: "cross" });
    expect(rooting.hp).toBe(4);
    expect(alert.hp).toBe(2);
    expect(alert.phase).toBe("map");
  });

  it("writes a learned fact into the notebook, once", () => {
    const state = reduce(atScene("ford-boar", "alert"), { type: "CHOOSE", optionId: "cross" });
    expect(state.known).toEqual(["boar.nose"]);
    expect(state.learnedThisJourney).toEqual(["boar.nose"]);
    expect(state.last).toMatchObject({ kind: "chose", learned: "boar.nose", hp: -2 });
  });

  it("keeps the notebook across the next START", () => {
    const learned = reduce(atScene("ford-boar", "alert"), { type: "CHOOSE", optionId: "watch" });
    const ended = { ...learned, phase: "end" as const };
    const again = reduce(ended, { type: "START", seed: 3 });
    expect(again.known).toEqual(["boar.nose"]);
    expect(again.learnedThisJourney).toEqual([]);
  });

  it("clamps health at the pool you set out with", () => {
    const state = reduce(atScene("old-camp", "only", { hp: MAX_HP }), {
      type: "CHOOSE",
      optionId: "rest",
    });
    expect(state.hp).toBe(MAX_HP);
    expect(state.last).toMatchObject({ hp: 0, food: -1 });
  });

  it("ends the journey when a wound takes the last of you", () => {
    const state = reduce(atScene("kill-wolves", "hungry", { hp: 3 }), {
      type: "CHOOSE",
      optionId: "steal",
    });
    expect(state.phase).toBe("end");
    expect(state.ending).toEqual({ kind: "died", cause: "wounds" });
  });

  it("refuses an option the pack cannot pay for, or one not on offer", () => {
    const state = atScene("ford-boar", "rooting", { food: 0 });
    const detour = offeredOptions(state).find((o) => o.id === "detour")!;
    expect(canAfford(state, detour)).toBe(false);
    expect(reduce(state, { type: "CHOOSE", optionId: "detour" })).toBe(state);
    expect(reduce(state, { type: "CHOOSE", optionId: "take-roots" })).toBe(state);
  });
});

describe("what knowing changes", () => {
  it("offers an option only once its fact is known", () => {
    expect(ids(atScene("ford-boar", "rooting"))).not.toContain("take-roots");
    expect(ids(atScene("ford-boar", "rooting", { known: ["boar.nose"] }))).toContain("take-roots");
  });

  it("stops offering to watch for what is already known", () => {
    expect(ids(atScene("ford-boar", "rooting"))).toContain("watch");
    expect(ids(atScene("ford-boar", "rooting", { known: ["boar.nose"] }))).not.toContain("watch");
    // At the wallow, what watching teaches depends on what is there.
    const knowsNose = { known: ["boar.nose"] as FactId[] };
    expect(ids(atScene("wallow-boar", "sleeping", knowsNose))).not.toContain("watch");
    expect(ids(atScene("wallow-boar", "sow", knowsNose))).toContain("watch");
  });

  it("shows an outcome only when it is certain or can be read", () => {
    const blind = atScene("ford-boar", "alert");
    const option = (id: string) => currentScene(blind)!.options.find((o) => o.id === id)!;
    expect(preview(blind, option("detour"))).toMatchObject({ hp: 0, food: -1 });
    expect(preview(blind, option("cross"))).toBeNull();
    expect(canRead(blind, currentScene(blind)!)).toBe(false);

    const reading = { ...blind, known: ["boar.nose"] as FactId[] };
    expect(canRead(reading, currentScene(reading)!)).toBe(true);
    expect(preview(reading, option("cross"))).toMatchObject({ hp: -2 });
  });
});
