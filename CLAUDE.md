# CLAUDE.md

## Project

**Project Wander** is a small, AI-assisted fantasy travel RPG prototype.

The current goal is not to build a production-ready game, a reusable game engine, or a large content platform.

The goal is to validate one question:

> Is a short fantasy journey built around travel, discovery, a monster codex, and AI-assisted NPC interactions fun enough that players want to begin another journey?

Read `VISION.md` before making architectural or gameplay decisions.

---

## Current Product Direction

Project Wander is an **AI-assisted fantasy travel RPG** with light roguelike structure.

The experience should focus on:

- travel as the primary gameplay
- short, replayable journeys
- exploration and discovery
- meaningful route and resource decisions
- memorable NPC and companion interactions
- a monster codex that unlocks useful knowledge
- small personal stories rather than epic destiny

The initial prototype should target approximately **20 minutes per journey**.

---

## Core Development Principles

### 1. Build the Game, Not an Engine

Do not create generic systems unless the current prototype directly requires them.

Avoid:

- generic plugin systems
- custom dependency injection frameworks
- ECS architecture without demonstrated need
- generalized scripting engines
- visual editors
- content management tools
- modding support
- multiplayer abstractions
- speculative extension points
- large inheritance hierarchies
- factories for objects with only one implementation

Prefer direct, readable code that supports the current playable loop.

A small amount of duplication is acceptable when it keeps the prototype easy to understand and change.

---

### 2. Keep the Prototype Playable

The repository should remain runnable and playable after every meaningful change.

Prefer vertical slices over disconnected infrastructure.

A good implementation order is:

1. make the simplest version work
2. make it playable
3. test whether it is fun
4. improve structure where actual pain appears
5. add content or complexity only after validation

Do not spend multiple changes building infrastructure before any player-facing result exists.

---

### 3. Separate Game Rules from Presentation

Core game logic must not depend on:

- React
- the DOM
- browser storage
- CSS
- animation libraries
- LLM SDKs
- network calls

The UI should render state and dispatch player actions.

Recommended dependency direction:

```text
UI
  → Application Layer
      → Game Core
          → Content Definitions

AI Adapter
  → Narrative Context produced by the Application Layer
```

The game core must not import from UI or AI modules.

---

### 4. Game Facts Come From Code

Deterministic systems decide:

- resource changes
- travel outcomes
- encounter eligibility
- combat results
- quest progress
- rewards
- codex unlocks
- relationship values
- success and failure
- world-state changes

AI may express these results, but must not invent or override them.

Use this rule:

> Code decides what happened. AI decides how it is described.

---

### 5. AI Must Be Optional

The game must remain fully playable when:

- no API key is configured
- the AI provider is unavailable
- a request times out
- structured output is invalid
- a rate limit is reached

Every AI-assisted feature requires a deterministic or authored fallback.

Do not place AI calls inside core game reducers or state-transition functions.

Do not expose provider API keys in browser code.

AI integration should sit behind a small adapter interface so providers can be changed later.

---

### 6. Prefer Data-Driven Content, Not Data-Driven Everything

Encounters, monsters, travel nodes, items, and codex entries may be represented as typed data when this makes iteration easier.

Do not create a universal schema capable of representing every imagined future feature.

Schemas should support only implemented gameplay.

Use TypeScript types and runtime validation where external or authored data enters the system.

---

### 7. Determinism Matters

Random gameplay should use an explicit seeded random source.

Do not call `Math.random()` directly inside game rules.

Benefits include:

- reproducible bugs
- shareable journeys
- stable tests
- easier balancing
- consistent content generation

Store enough random state to reproduce a journey when practical.

AI-generated prose does not need to be deterministic, but the gameplay facts passed to AI must be.

---

## Initial Prototype Scope

Unless a task explicitly changes the scope, assume the prototype contains:

- one village
- one journey objective
- one destination
- one companion
- three monster species
- one short travel route with branches
- simple encounters
- simple camping
- a lightweight codex
- HP
- Food
- Preparation
- one ending or a very small number of endings
- approximately 20 minutes of playtime

Keep combat minimal.

A text-based encounter flow is acceptable.

Do not add major systems merely because they are common in RPGs.

---

## Important Gameplay Boundaries

### Travel

Travel is the main gameplay, not a transition between gameplay sections.

Travel decisions may include:

- route choice
- risk versus time
- food use
- camping
- investigation
- helping or ignoring travelers
- observing monsters
- companion interactions

### Resources

Start with only:

- `hp`
- `food`
- `preparation`

Do not add thirst, temperature, fatigue, morale, encumbrance, durability, disease, or food spoilage unless current playtesting demonstrates a specific need.

Each resource must create meaningful decisions rather than routine maintenance.

### Codex

The codex should affect gameplay.

Codex knowledge may unlock:

- monster weaknesses
- safer routes
- alternate encounter actions
- improved observation
- non-combat solutions
- additional dialogue
- better quest conclusions

Avoid codex entries that exist only as passive lore collectibles.

### NPCs and Companions

AI-assisted characters should react to structured facts such as:

- recent player choices
- current relationship state
- active quest facts
- available knowledge
- current danger
- resource scarcity

Do not give AI unrestricted authority to invent permanent canon.

Persist important facts as structured state, not only inside generated prose.

---

## Suggested Technical Direction

Unless the repository already establishes another stack, prefer:

- Vite
- React
- TypeScript
- Zustand or a similarly small state layer
- Zod for external and AI response validation
- Vitest for game-core tests

Do not introduce a large framework or library without a clear current benefit.

Before adding a dependency, consider whether the feature can be implemented clearly with existing tools.

---

## Recommended Source Organization

This is guidance, not a mandatory architecture.

```text
src/
├── core/
│   ├── game-state.ts
│   ├── actions.ts
│   ├── reducer.ts
│   ├── rng.ts
│   └── rules/
├── content/
│   ├── encounters/
│   ├── monsters/
│   ├── quests/
│   └── companions/
├── application/
│   ├── game-session.ts
│   └── narrative-context.ts
├── ai/
│   ├── provider.ts
│   ├── schemas.ts
│   ├── prompts/
│   └── fallback.ts
├── ui/
│   ├── components/
│   └── screens/
└── main.tsx
```

Do not reorganize the repository solely to match this example if the existing structure is already simple and understandable.

---

## State Transition Style

Prefer explicit player actions and pure state transitions.

Example:

```ts
type GameAction =
  | { type: "TRAVEL"; routeId: string }
  | { type: "REST" }
  | { type: "FORAGE" }
  | {
      type: "CHOOSE_ENCOUNTER_OPTION";
      encounterId: string;
      optionId: string;
    };
```

Core transitions should be:

- predictable
- testable
- free of network access
- free of UI side effects
- explicit about randomness

Side effects should be handled outside the reducer or rules layer.

---

## AI Output Rules

When using an LLM:

1. Send only the minimum relevant structured context.
2. Ask for constrained structured output when metadata is needed.
3. Validate all structured responses.
4. Clamp or reject unsupported values.
5. Fall back gracefully on failure.
6. Never treat generated prose as the only source of game state.
7. Cache generated content when repeated calls add no value.
8. Avoid making an API call for every small UI interaction.

Good AI uses:

- NPC dialogue
- companion reactions
- quest presentation
- rumors
- scene descriptions
- journey summaries

Bad AI uses:

- deciding whether an attack hit
- changing rewards
- inventing quest completion
- altering resource values
- deciding permanent world rules
- silently modifying saved state

---

## Testing Expectations

Prioritize tests for game rules rather than UI snapshots.

Important tests include:

- resource changes after travel and camping
- seeded encounter selection
- valid and invalid action handling
- quest transitions
- codex unlock conditions
- failure and completion states
- AI fallback behavior
- schema rejection for malformed AI output

Avoid brittle tests that assert large prose strings unless testing a fixed fallback.

When fixing a gameplay bug, add a regression test when reasonable.

---

## Change Discipline

Before implementing a task:

1. inspect the existing repository
2. read relevant documentation
3. identify the smallest playable change
4. avoid unrelated refactors
5. preserve existing behavior unless the task requires changing it

During implementation:

- keep changes focused
- use clear names
- avoid premature abstractions
- update tests alongside rules
- keep player-facing text easy to revise
- document important tradeoffs briefly

After implementation:

- run available tests
- run type checking
- run linting if configured
- verify the main gameplay path manually when possible
- summarize what changed and any known limitations

Do not claim a command succeeded unless it was actually run successfully.

---

## Scope Control

When a request is ambiguous, prefer the interpretation that:

- produces a playable result sooner
- introduces fewer systems
- modifies fewer files
- is easier to remove or change
- provides useful playtest feedback

Before implementing a feature significantly outside the current prototype, clearly flag the scope increase.

Examples of scope increases:

- real-time movement
- tactical grid combat
- procedural world simulation
- complex crafting
- large inventories
- multiplayer
- account systems
- cloud saves
- custom content editors
- Unity migration
- fully autonomous AI agents

Do not implement these incidentally.

---

## Refactoring Rules

Refactor when:

- current code blocks a requested feature
- tests are difficult because responsibilities are mixed
- duplicated rules are already causing inconsistent behavior
- a module has become difficult to understand

Do not refactor because a future system might someday need a cleaner abstraction.

Prefer small, local refactors attached to a player-facing improvement.

---

## Definition of Done

A feature is complete when:

- it supports the intended playable behavior
- game rules are deterministic where expected
- error and fallback behavior is reasonable
- relevant tests pass
- TypeScript checks pass
- no unnecessary system was introduced
- documentation is updated when behavior or architecture changed

For AI-assisted features, completion also requires:

- validated output
- graceful fallback
- no exposed secrets
- game state independent from generated prose

---

## Agent Communication

When reporting work:

- begin with the player-facing or architectural result
- list important files changed
- mention tests and commands actually run
- state limitations honestly
- call out decisions that may affect future work

Do not bury important limitations under a long implementation diary.

---

## Final Decision Rule

When uncertain, choose the option that best supports this sentence:

> Project Wander should become a fun, replayable fantasy journey before it becomes a sophisticated software system.
