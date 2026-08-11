# CLAUDE.md

**This file is how to work in this repository. `VISION.md` is what the game is.**

Do not restate game design here. If a rule is about the game — resources, the codex, villages, what a monster is, what we intentionally avoid — it belongs in `VISION.md` and this file should link to it instead of repeating it.

---

## Read before changing anything

1. **`VISION.md`** — the game's direction, boundaries, and the list of things deliberately not built. Read it before any architectural or gameplay decision.
2. **`.hyperclaude/HANDOFF.md`** — if present (gitignored, local only): current state, decisions already settled, and what not to re-litigate.
3. **`docs/`** — `GAMEPLAY.md` (the game as built) and `CONTENT.md` (authoring rules, and the measurements behind them).

---

## Commands

```bash
npm run dev        # vite dev server
npm test           # vitest run
npm run typecheck  # tsc --noEmit
npm run build      # tsc --noEmit && vite build
```

Do not claim a command succeeded unless it was actually run successfully.

---

## Design decisions here are measured, and the measurement lives in the code

This is the most important thing to know about this repository.

Tuning constants and content shapes carry long comments recording **what was measured, what the alternatives scored, and what was tried and reverted.** Before proposing a design or balance change, read the comments in the file you are about to change. The experiment has often already been run.

Examples of where this lives: `src/content/journey.ts` (starting resources, fork rate, route odds), `src/content/events.ts` (why places all offer the same trades), `src/content/village.ts` (why a fourth villager was cut), `src/core/game-state.ts` (why the codex persists), `src/core/arrival.ts` (why the ending gate is a conjunction).

When you change a measured constant, update the comment with the new evidence. A constant with a stale justification is worse than one with none.

`VISION.md` § *What We Have Learned* holds the short versions of the most expensive lessons.

---

## Architecture

Actual structure:

```text
src/
├── core/      # rules: game-state, actions, reducer, rng, weather, arrival
├── content/   # authored data: journey, village, events, weather, encounters/
├── ui/        # App.tsx and screens
└── main.tsx
```

Dependency direction:

```text
UI → core → content
```

- `src/core/` imports no React, no DOM, no `Date`, no `Math.random`, no network.
- `src/content/` is the **bottom of the chain**: it imports nothing from `src/core/` (tests excepted). Content-to-content imports are fine.
- Side effects live outside the reducer and the rules layer.

### Stack

Vite + React + TypeScript + Vitest. Runtime dependencies are **`react` and `react-dom` only.**

Adding a dependency needs a current, demonstrated reason. Prefer solving it with what is here.

---

## Determinism

Gameplay randomness comes from the seeded source in `src/core/rng.ts`. Never call `Math.random()` in game rules.

**Derived values must not consume a roll.** Anything read off the journey outside the encounter script — weather, whether a leg forks, which situation, which species the knowledge villager teaches — is keyed on a salted side-stream (`WEATHER_SALT`, `FORK_SALT`, `SITUATION_SALT`, `LONE_ROUTE_SALT`, `VILLAGE_SALT`) so that reading it never advances `rngState`. Follow this pattern for any new derived value.

Weather is keyed on `state.seed`, not `rngState`: `rngState` advances a different number of rolls per leg, so a question about a given leg must not depend on how the road played out getting there.

**`speciesList` and `encounters` in `src/content/encounters/index.ts` are order-sensitive.** The reducer indexes them with seeded rolls, so reordering either rewrites every existing seed's encounter script. Both orders are pinned by test.

---

## AI integration

> Code decides what happened. AI decides how it is described.

- Every AI-assisted feature needs a deterministic or authored fallback. The game must be fully playable with no key, no network, a timeout, or invalid output.
- No AI calls inside reducers or state-transition functions.
- No provider API keys in browser code.
- Validate structured responses at runtime; clamp or reject unsupported values.
- Cache generated content; do not call the API for every small UI interaction.
- Never persist game state that exists only inside generated prose.

See `VISION.md` § *AI Makes People Feel Alive* for what AI is and is not allowed to decide.

---

## State transitions

Explicit player actions, pure transitions:

```ts
type GameAction =
  | { type: "START_JOURNEY"; seed: number }
  | { type: "TRAVEL"; routeId: string }
  | { type: "CHOOSE_ENCOUNTER_OPTION"; optionId: string }
  | { type: "CHOOSE_VILLAGE_OPTION"; optionId: string };
```

Invalid actions — an id the current state does not offer — are ignored, not thrown.

Transitions must be predictable, testable, free of network and UI side effects, and explicit about randomness.

---

## Testing

Test game rules, not UI snapshots. Priorities: resource changes, seeded selection, invalid action handling, codex unlock conditions, failure and completion states, AI fallback, schema rejection.

Avoid asserting long prose strings unless the point is a fixed fallback.

**A green suite is not evidence.** Multiple tests in this repo have been found that could not fail — every one inside a passing suite, every one found only by breaking the implementation on purpose. Mutate the code before believing a test bites.

When fixing a gameplay bug, add a regression test.

---

## Change discipline

Before implementing: read the repo and the relevant docs, identify the smallest playable change, avoid unrelated refactors, preserve existing behavior unless the task requires changing it.

Keep the repository runnable and playable after every meaningful change. Prefer vertical slices over disconnected infrastructure.

Refactor when current code blocks a requested feature, when mixed responsibilities make tests hard, or when duplicated rules are already causing inconsistent behavior. Not because a future system might want a cleaner abstraction. A little duplication is fine when it keeps the prototype easy to change.

Build the game, not an engine: no plugin systems, no DI framework, no ECS, no scripting engine, no editors, no modding or multiplayer abstractions, no factories for a single implementation.

When a request is ambiguous, prefer the interpretation that is playable sooner, introduces fewer systems, touches fewer files, and is easier to remove.

**Flag scope increases explicitly** before implementing something outside the current direction. `VISION.md` § *Things We Intentionally Avoid* is the standing list.

---

## Working agreements

- **Never push without being asked.**
- The repo is public, deliberately. **Never change its visibility.**
- Sweep and playtest harnesses are throwaway and never committed — `git status` must come back clean.
- **Nothing about fun has been settled by measurement.** The simulation finds dominant strategies and dead options. It cannot tell you whether anyone wants a second journey; only a person playing it can.

---

## Definition of done

- The intended playable behavior works.
- Rules are deterministic where expected; fallbacks are reasonable.
- `npm test` and `npm run typecheck` pass.
- No unnecessary system was introduced.
- Docs updated when behavior or architecture changed; measured comments updated when a constant moved.

## Reporting work

Lead with the player-facing or architectural result. List the files that matter. Say which commands were actually run. State limitations honestly and up front — do not bury them under an implementation diary.

---

## Final decision rule

> Project Wander should become a fun, replayable fantasy journey before it becomes a sophisticated software system.
