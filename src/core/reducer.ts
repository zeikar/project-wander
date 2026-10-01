import { findScene } from "../content/scenes";
import { speciesOfFact } from "../content/species";
import type { Outcome, Scene, SceneOption, Weather } from "../content/types";
import {
  MAX_FOOD,
  MAX_HP,
  START_FOOD,
  START_HP,
  regionById,
} from "../content/world";
import { generateMap } from "./map";
import type { MapNode } from "./map";
import type { GameAction, GameState } from "./state";

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n));

export function nodeById(state: GameState, id: string): MapNode | undefined {
  return state.map?.layers.flat().find((node) => node.id === id);
}

export function currentNode(state: GameState): MapNode | undefined {
  return state.at === null ? undefined : nodeById(state, state.at);
}

export function nextNodes(state: GameState): readonly MapNode[] {
  if (state.at === null || state.map === null) {
    return [];
  }
  return (state.map.next[state.at] ?? []).map((id) => nodeById(state, id)!);
}

export function currentScene(state: GameState): Scene | undefined {
  const node = currentNode(state);
  return node?.sceneId === undefined ? undefined : findScene(node.sceneId);
}

// Whether the traveler can tell what is going on in this scene.
export function canRead(state: GameState, scene: Scene): boolean {
  return scene.reads === undefined || state.known.includes(scene.reads);
}

// Whether a map sign can name the animal behind it: anything at all known
// about that species is enough to recognise its traces.
export function knowsSpeciesOf(state: GameState, scene: Scene): boolean {
  return (
    scene.species !== undefined &&
    state.known.some((fact) => speciesOfFact(fact) === scene.species)
  );
}

export function offeredOptions(state: GameState): readonly SceneOption[] {
  const scene = currentScene(state);
  const variant = currentNode(state)?.variant;
  if (!scene || variant === undefined) {
    return [];
  }
  return scene.options.filter((option) => {
    if (option.needs !== undefined && !state.known.includes(option.needs)) {
      return false;
    }
    if (!option.study) {
      return true;
    }
    // Hidden once there is nothing left to learn by it. A traveler who cannot
    // read the scene cannot tell which lesson is on offer either, so for them
    // every variant's lesson must be known — otherwise the menu itself would
    // give away what is going on.
    const lessons = canRead(state, scene)
      ? [option.outcomes[variant]!.learn]
      : Object.values(option.outcomes).map((o) => o.learn);
    return !lessons.every((l) => l !== undefined && state.known.includes(l));
  });
}

// What the screen may say about an option before it is chosen. The outcome is
// shown only when it is certain — the same whatever is going on, or read off
// the scene with what the traveler knows. Otherwise it stays a question.
export function preview(
  state: GameState,
  option: SceneOption,
): Outcome | null {
  const scene = currentScene(state);
  const variant = currentNode(state)?.variant;
  if (!scene || variant === undefined) {
    return null;
  }
  const all = Object.values(option.outcomes);
  const same = all.every((o) => o.hp === all[0]!.hp && o.food === all[0]!.food);
  if (!same && !canRead(state, scene)) {
    return null;
  }
  // A gain is shown as what will actually land: resting at full health gives
  // nothing back, and the button must not promise otherwise. Losses stay as
  // they are — a wound bigger than what is left is still the wound.
  const o = option.outcomes[variant]!;
  return {
    ...o,
    hp: o.hp > 0 ? Math.min(o.hp, MAX_HP - state.hp) : o.hp,
    food: o.food > 0 ? Math.min(o.food, MAX_FOOD - state.food) : o.food,
  };
}

// Whether choosing a study option is certain to teach something new, as far as
// the traveler can tell: the lesson of the actual variant if the scene reads,
// else every variant's. A promise of a new entry must hold in every case that
// looks the same from where they stand.
export function teachesForSure(state: GameState, option: SceneOption): boolean {
  const scene = currentScene(state);
  const variant = currentNode(state)?.variant;
  if (!option.study || !scene || variant === undefined) {
    return false;
  }
  const lessons = canRead(state, scene)
    ? [option.outcomes[variant]!.learn]
    : Object.values(option.outcomes).map((o) => o.learn);
  return lessons.every((l) => l !== undefined && !state.known.includes(l));
}

// The weather over a layer's day; layer defaults to where the traveler is.
export function weatherAt(state: GameState, layer?: number): Weather | undefined {
  const at = layer ?? currentNode(state)?.layer;
  return at === undefined ? undefined : state.map?.weather[at];
}

// Whether today's sky makes an option impossible. It stays on the menu with
// its reason, so the traveler learns what the weather takes away.
export function isClosed(state: GameState, option: SceneOption): boolean {
  const sky = weatherAt(state)?.sky;
  return sky !== undefined && (option.closedIn ?? []).includes(sky);
}

// Food is the one thing an option can ask for that the pack may not have.
// Unread, it is judged on the dearest variant so the menu cannot give away
// which one is there; read, on the one that is.
export function canAfford(state: GameState, option: SceneOption): boolean {
  const scene = currentScene(state);
  const variant = currentNode(state)?.variant;
  const costs =
    scene && variant !== undefined && canRead(state, scene)
      ? [option.outcomes[variant]!.food]
      : Object.values(option.outcomes).map((o) => o.food);
  return state.food + Math.min(...costs) >= 0;
}

export function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START": {
      if (state.phase !== "title" && state.phase !== "end") {
        return state;
      }
      if (!state.open.includes(action.region)) {
        return state;
      }
      const map = generateMap(action.seed, regionById(action.region));
      const start = map.layers[0]![0]!;
      return {
        ...state,
        phase: "map",
        seed: action.seed >>> 0,
        region: action.region,
        map,
        at: start.id,
        day: 0,
        hp: START_HP,
        food: START_FOOD,
        hungry: false,
        learnedThisJourney: [],
        path: [start.id],
        last: null,
        ending: null,
      };
    }

    case "MOVE": {
      if (state.phase !== "map") {
        return state;
      }
      const node = nextNodes(state).find((n) => n.id === action.nodeId);
      if (!node) {
        return state;
      }

      // Every day on the road eats a meal, or takes blood if there is none.
      const hungry = state.food === 0;
      const walked: GameState = {
        ...state,
        at: node.id,
        day: state.day + 1,
        food: hungry ? 0 : state.food - 1,
        hp: hungry ? state.hp - 1 : state.hp,
        hungry,
        path: [...state.path, node.id],
        last: null,
      };

      if (walked.hp <= 0) {
        return {
          ...walked,
          hp: 0,
          phase: "end",
          ending: { kind: "died", cause: "hunger" },
        };
      }
      if (node.kind === "destination") {
        const region = regionById(state.region);
        const destination = region.destinations.find(
          (d) => d.id === node.destinationId,
        )!;
        const saw = walked.known.includes(destination.needs);
        // Only the first sight finds the way; the second visit finds nothing
        // new, so the end screen says so once.
        const to = region.gate?.destinationId === destination.id ? region.gate.to : null;
        const opened = saw && to !== null && !state.open.includes(to) ? to : null;
        return {
          ...walked,
          phase: "end",
          open: opened ? [...state.open, opened] : state.open,
          ending: { kind: "arrived", destinationId: destination.id, saw, opened },
        };
      }
      if (node.kind === "quiet") {
        return { ...walked, last: { kind: "quiet" } };
      }
      return { ...walked, phase: "scene" };
    }

    case "CHOOSE": {
      if (state.phase !== "scene") {
        return state;
      }
      const option = offeredOptions(state).find((o) => o.id === action.optionId);
      const node = currentNode(state)!;
      if (!option || !canAfford(state, option) || isClosed(state, option)) {
        return state;
      }
      const outcome = option.outcomes[node.variant!]!;
      const learned =
        outcome.learn !== undefined && !state.known.includes(outcome.learn)
          ? outcome.learn
          : null;
      const hp = clamp(state.hp + outcome.hp, MAX_HP);
      const food = clamp(state.food + outcome.food, MAX_FOOD);
      const next: GameState = {
        ...state,
        hp,
        food,
        known: learned ? [...state.known, learned] : state.known,
        learnedThisJourney: learned
          ? [...state.learnedThisJourney, learned]
          : state.learnedThisJourney,
        last: {
          kind: "chose",
          sceneId: node.sceneId!,
          variant: node.variant!,
          optionId: option.id,
          hp: hp - state.hp,
          food: food - state.food,
          learned,
        },
      };
      if (hp === 0) {
        return { ...next, phase: "end", ending: { kind: "died", cause: "wounds" } };
      }
      return { ...next, phase: "map" };
    }
  }
}
