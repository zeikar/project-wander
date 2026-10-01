import { describe, expect, it } from "vitest";
import { scenes } from "../content/scenes";
import type { FactId, Sky } from "../content/types";
import { FIRST_REGION, MAX_HP, START_FOOD, START_HP } from "../content/world";
import type { MapNode, WorldMap } from "./map";
import {
  canAfford,
  canRead,
  currentScene,
  isClosed,
  nextNodes,
  offeredOptions,
  preview,
  reduce,
  teachesForSure,
} from "./reducer";
import { createInitialState } from "./state";
import type { GameAction, GameState } from "./state";

// A hand-made road: village -> one scene -> one destination, so each rule can
// be put in front of exactly the scene it is about.
function roadThrough(
  sceneId: string,
  variant: string,
  destinationId = "white-stag-lake",
  sky: Sky = "clear",
): WorldMap {
  const start: MapNode = { id: "0-0", layer: 0, index: 0, kind: "start" };
  const scene: MapNode = { id: "1-0", layer: 1, index: 0, kind: "scene", sceneId, variant };
  const dest: MapNode = { id: "2-0", layer: 2, index: 0, kind: "destination", destinationId };
  return {
    layers: [[start], [scene], [dest]],
    next: { "0-0": ["1-0"], "1-0": ["2-0"], "2-0": [] },
    weather: [0, 1, 2].map(() => ({ sky, wind: "ahead" as const })),
  };
}

function atScene(
  sceneId: string,
  variant: string,
  over: Partial<GameState> = {},
  sky: Sky = "clear",
): GameState {
  return {
    ...createInitialState(),
    phase: "scene",
    map: roadThrough(sceneId, variant, "white-stag-lake", sky),
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
    const state = reduce(createInitialState(known), { type: "START", seed: 7, region: "fields" });
    expect(state.phase).toBe("map");
    expect(state.at).toBe("0-0");
    expect(state.hp).toBe(START_HP);
    expect(state.food).toBe(START_FOOD);
    expect(state.known).toEqual(known);
    expect(nextNodes(state).length).toBeGreaterThan(0);
  });

  it("is ignored in the middle of a journey", () => {
    const state = atScene("ford-boar", "rooting");
    expect(reduce(state, { type: "START", seed: 1, region: "fields" })).toBe(state);
  });

  it("ignores a region the notebook has no way to", () => {
    const title = createInitialState();
    const unknown = { type: "START", seed: 1, region: "nowhere" } as unknown as GameAction;
    expect(reduce(title, unknown)).toBe(title);
  });

  it("opens only the first region on a fresh notebook", () => {
    expect(createInitialState().open).toEqual([FIRST_REGION]);
  });

  it("sets out from the ferry only once the notebook has the way there", () => {
    const open = createInitialState([], ["fields", "marsh"]);
    const state = reduce(open, { type: "START", seed: 7, region: "marsh" });
    expect(state.region).toBe("marsh");
    expect(state.map!.layers.at(-1)!.map((n) => n.destinationId).sort()).toEqual([
      "heron-island",
      "lantern-shoal",
      "otter-weir",
    ]);
    const closed = createInitialState([], ["fields"]);
    expect(reduce(closed, { type: "START", seed: 7, region: "marsh" })).toBe(closed);
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
    expect(missed.ending).toEqual({
      kind: "arrived",
      destinationId: "white-stag-lake",
      saw: false,
      opened: null,
    });
    const saw = reduce({ ...before, known: ["deer.dawn"] }, { type: "MOVE", nodeId: "2-0" });
    expect(saw.ending).toEqual({
      kind: "arrived",
      destinationId: "white-stag-lake",
      saw: true,
      opened: "marsh",
    });
  });

  it("opens the way to the marsh only by seeing the white stag", () => {
    const before = atScene("ford-boar", "rooting", { phase: "map" });
    const saw = reduce({ ...before, known: ["deer.dawn"] }, { type: "MOVE", nodeId: "2-0" });
    expect(saw.ending).toMatchObject({ saw: true, opened: "marsh" });
    expect(saw.open).toEqual(["fields", "marsh"]);
    const missed = reduce(before, { type: "MOVE", nodeId: "2-0" });
    expect(missed.ending).toMatchObject({ saw: false, opened: null });
    expect(missed.open).toEqual(["fields"]);
  });

  it("opens nothing at a far place that is not the gate, or by a way already known", () => {
    const rock = atScene("ford-boar", "rooting", {
      phase: "map",
      known: ["wolves.chase"],
      map: roadThrough("ford-boar", "rooting", "wolf-rock"),
    });
    const atRock = reduce(rock, { type: "MOVE", nodeId: "2-0" });
    expect(atRock.ending).toEqual({
      kind: "arrived",
      destinationId: "wolf-rock",
      saw: true,
      opened: null,
    });
    expect(atRock.open).toEqual(["fields"]);

    const again = atScene("ford-boar", "rooting", {
      phase: "map",
      known: ["deer.dawn"],
      open: ["fields", "marsh"],
    });
    const atLake = reduce(again, { type: "MOVE", nodeId: "2-0" });
    expect(atLake.ending).toMatchObject({ saw: true, opened: null });
    expect(atLake.open).toEqual(["fields", "marsh"]);
  });

  // The far place is looked up in the region the journey crosses, not the first.
  it("arrives at a marsh far place on a marsh journey", () => {
    const marsh = atScene("heron-shallows", "near", {
      phase: "map",
      region: "marsh",
      known: ["heron.wade"],
      map: roadThrough("heron-shallows", "near", "heron-island"),
    });
    expect(reduce(marsh, { type: "MOVE", nodeId: "2-0" }).ending).toEqual({
      kind: "arrived",
      destinationId: "heron-island",
      saw: true,
      opened: null,
    });
  });
});

describe("what a far place remembers", () => {
  const arrive = (state: GameState) => reduce(state, { type: "MOVE", nodeId: "2-0" });
  const before = (sceneId: string, variant: string, over: Partial<GameState> = {}) =>
    atScene(sceneId, variant, { phase: "map", ...over });

  it("counts misses and sights per far place", () => {
    const missed = arrive(before("dawn-water", "upwind"));
    expect(missed.been).toEqual({ "white-stag-lake": { missed: 1, saw: 0 } });
    const again = arrive(before("dawn-water", "upwind", { been: missed.been }));
    expect(again.been).toEqual({ "white-stag-lake": { missed: 2, saw: 0 } });
    const saw = arrive(before("dawn-water", "upwind", { been: again.been, known: ["deer.dawn"] }));
    expect(saw.been).toEqual({ "white-stag-lake": { missed: 2, saw: 1 } });
    expect(saw.ending).toMatchObject({ saw: true });
  });

  it("keeps what it remembers across a new journey", () => {
    const been = { "wolf-rock": { missed: 1, saw: 0 } };
    const next = reduce(createInitialState([], ["fields"], been), { type: "START", seed: 3, region: "fields" });
    expect(next.been).toEqual(been);
  });
});

describe("people", () => {
  const meet = (over: Partial<GameState> = {}) =>
    reduce(
      atScene("old-shepherd", "only", { phase: "map", at: "0-0", day: 0, path: ["0-0"], ...over }),
      { type: "MOVE", nodeId: "1-0" },
    );

  it("hear a far place told only by one who has seen it", () => {
    expect(ids(meet())).not.toContain("tell-of-rock");
    expect(ids(meet({ been: { "wolf-rock": { missed: 2, saw: 0 } } }))).not.toContain("tell-of-rock");
    expect(ids(meet({ been: { "wolf-rock": { missed: 2, saw: 1 } } }))).toContain("tell-of-rock");
  });

  it("want what the traveler knows, and pay for it", () => {
    expect(ids(meet())).not.toContain("stand-guard");
    const helped = reduce(meet({ known: ["wolves.chase"] }), { type: "CHOOSE", optionId: "stand-guard" });
    expect([helped.hp, helped.food]).toEqual([5, 2]);
  });

  it("stop asking for a story once what it would teach is known", () => {
    const seen = { "wolf-rock": { missed: 0, saw: 1 } };
    const told = reduce(meet({ been: seen }), { type: "CHOOSE", optionId: "tell-of-rock" });
    expect(told.known).toContain("deer.drive");
    expect(ids(meet({ been: seen, known: told.known }))).not.toContain("tell-of-rock");
  });

  it("remember being met, across journeys, and nobody else is counted", () => {
    const once = meet();
    expect(once.met).toEqual({ "old-shepherd": 1 });
    expect(meet({ met: once.met }).met).toEqual({ "old-shepherd": 2 });
    const boar = reduce(
      atScene("ford-boar", "rooting", { phase: "map", at: "0-0", day: 0, path: ["0-0"] }),
      { type: "MOVE", nodeId: "1-0" },
    );
    expect(boar.met).toEqual({});
    const next = reduce({ ...createInitialState([], ["fields"], {}, once.met) }, { type: "START", seed: 9, region: "fields" });
    expect(next.met).toEqual(once.met);
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
    const again = reduce(ended, { type: "START", seed: 3, region: "fields" });
    expect(again.known).toEqual(["boar.nose"]);
    expect(again.learnedThisJourney).toEqual([]);
  });

  it("keeps the open ways across the next START", () => {
    const ended = { ...atScene("ford-boar", "alert"), phase: "end" as const, open: ["fields", "marsh"] as const };
    expect(reduce(ended, { type: "START", seed: 3, region: "fields" }).open).toEqual(["fields", "marsh"]);
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
  });

  // At the wallow, what watching teaches depends on what is there. Until the
  // scene can be read, the menu must not give that away.
  it("does not let the menu reveal a scene the traveler cannot read", () => {
    const knowsNose = { known: ["boar.nose"] as FactId[] };
    expect(ids(atScene("wallow-boar", "sleeping", knowsNose))).toEqual(
      ids(atScene("wallow-boar", "sow", knowsNose)),
    );
    expect(ids(atScene("wallow-boar", "sleeping", knowsNose))).toContain("watch");
    // Once it can be read, only a lesson still missing is offered.
    const knowsSow = { known: ["boar.sow"] as FactId[] };
    expect(ids(atScene("wallow-boar", "sleeping", knowsSow))).toContain("watch");
    expect(ids(atScene("wallow-boar", "sow", knowsSow))).not.toContain("watch");
  });

  // The lantern's watch teaches a different fact at night and at dawn, and the
  // fact that unlocks its guide is not the one that reads it.
  it("does not let the lantern's menu give away night from dawn", () => {
    const knowsDawn = { known: ["lantern.dawn"] as FactId[] };
    expect(ids(atScene("lantern-light", "night", knowsDawn))).toEqual(
      ids(atScene("lantern-light", "dawn", knowsDawn)),
    );
    expect(ids(atScene("lantern-light", "night", knowsDawn))).toContain("watch");
    const knowsDrift = { known: ["lantern.drift"] as FactId[] };
    expect(ids(atScene("lantern-light", "dawn", knowsDrift))).toContain("watch");
    expect(ids(atScene("lantern-light", "night", knowsDrift))).not.toContain("watch");
  });

  // The hint may promise a new notebook entry only when every case that looks
  // the same from where the traveler stands teaches one.
  it("promises a lesson only when no look-alike case teaches nothing new", () => {
    const sure = (id: string, variant: string, scene: string, known: FactId[]) => {
      const state = atScene(scene, variant, { known });
      const option = currentScene(state)!.options.find((o) => o.id === id)!;
      return teachesForSure(state, option);
    };
    expect(sure("watch", "night", "lantern-light", [])).toBe(true);
    expect(sure("watch", "dawn", "lantern-light", [])).toBe(true);
    expect(sure("watch", "night", "lantern-light", ["lantern.dawn"])).toBe(false);
    expect(sure("watch", "dawn", "lantern-light", ["lantern.dawn"])).toBe(false);
    expect(sure("watch", "sleeping", "wallow-boar", ["boar.nose"])).toBe(false);
    expect(sure("watch", "sow", "wallow-boar", ["boar.nose"])).toBe(false);
  });

  it("shows what following the lantern costs only to one who knows it is not carried", () => {
    const blind = atScene("lantern-light", "night");
    const follow = currentScene(blind)!.options.find((o) => o.id === "follow")!;
    expect(preview(blind, follow)).toBeNull();
    const reading = { ...blind, known: ["lantern.drift"] as FactId[] };
    expect(preview(reading, follow)).toEqual(follow.outcomes.night);
  });

  // An empty pack must never leave only a gamble — under any sky.
  it("leaves at least one certain, affordable way through at food 0", () => {
    for (const sky of ["clear", "rain", "fog"] as const) {
      for (const scene of scenes) {
        for (const variant of scene.variants) {
          const state = atScene(scene.id, variant, { food: 0 }, sky);
          const certain = offeredOptions(state).filter(
            (o) => canAfford(state, o) && !isClosed(state, o) && preview(state, o) !== null,
          );
          expect(certain.length, `${sky}: ${scene.id}/${variant}`).toBeGreaterThan(0);
        }
      }
    }
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

describe("weather", () => {
  it("keeps a closed option on the menu but refuses it", () => {
    const wet = atScene("pine-wolves", "passing", {}, "rain");
    expect(ids(wet)).toContain("fire");
    const fire = offeredOptions(wet).find((o) => o.id === "fire")!;
    expect(isClosed(wet, fire)).toBe(true);
    expect(reduce(wet, { type: "CHOOSE", optionId: "fire" })).toBe(wet);

    const dry = atScene("pine-wolves", "passing", {}, "clear");
    expect(isClosed(dry, fire)).toBe(false);
    expect(reduce(dry, { type: "CHOOSE", optionId: "fire" }).food).toBe(dry.food - 1);
  });
});

// From the 2026-10-01 playtest: a button must not promise what the result
// will not give, and reading a scene must never make the menu stingier.
describe("what the buttons promise", () => {
  it("shows a gain as what will land, not past the pool", () => {
    const full = atScene("old-camp", "only", { hp: MAX_HP, food: 2 });
    const rest = offeredOptions(full).find((o) => o.id === "rest")!;
    expect(preview(full, rest)).toMatchObject({ hp: 0, food: -1 });
    const hurt = atScene("old-camp", "only", { hp: MAX_HP - 1, food: 2 });
    expect(preview(hurt, rest)).toMatchObject({ hp: 1, food: -1 });
  });

  it("lets a traveler who can read the scene take what costs no food here", () => {
    const read = atScene("otter-camp", "clean", { food: 0, known: ["otter.raid"] as FactId[] });
    const sleep = offeredOptions(read).find((o) => o.id === "sleep")!;
    expect(canAfford(read, sleep)).toBe(true);
    expect(reduce(read, { type: "CHOOSE", optionId: "sleep" }).phase).toBe("map");
    // Unread, it is still judged on the dearest variant — no leak.
    const unread = atScene("otter-camp", "clean", { food: 0 });
    const sleep2 = offeredOptions(unread).find((o) => o.id === "sleep")!;
    expect(canAfford(unread, sleep2)).toBe(false);
  });

  it("turns one fact into the way to the next, then steps aside", () => {
    const knowsDrive = atScene("rut-stag", "holding", { known: ["deer.drive"] as FactId[] });
    expect(ids(knowsDrive)).toContain("step-uphill");
    const after = reduce(knowsDrive, { type: "CHOOSE", optionId: "step-uphill" });
    expect(after.known).toContain("deer.dawn");
    const knowsBoth = atScene("rut-stag", "holding", { known: ["deer.drive", "deer.dawn"] as FactId[] });
    expect(ids(knowsBoth)).not.toContain("step-uphill");

    // Following the lantern teaches what it shows, by variant.
    expect(reduce(atScene("lantern-light", "dawn"), { type: "CHOOSE", optionId: "follow" }).known).toContain("lantern.dawn");
    expect(reduce(atScene("lantern-light", "night"), { type: "CHOOSE", optionId: "follow" }).known).toContain("lantern.drift");

    const knowsChase = atScene("pine-wolves", "stalking", { known: ["wolves.chase"] as FactId[] });
    expect(reduce(knowsChase, { type: "CHOOSE", optionId: "back-away" }).known).toContain("wolves.rank");
  });
});

