# CLAUDE.md

How to work in this repository. `VISION.md` is what the game is — read it before any gameplay decision, and put game design there, not here.

This is the second start (v1). The first prototype is at the `v0-prototype` tag; read it for reference only.

---

## Commands

```bash
npm run dev        # vite dev server
npm test           # vitest run
npm run typecheck  # tsc --noEmit
npm run build      # tsc --noEmit && vite build
```

Do not claim a command succeeded unless it was actually run.

---

## How we work now

**Play first.** Every milestone ends with a build the user can play in a few minutes, and the user's reaction decides what comes next. Prefer the change that gets something playable sooner.

**Measure only to answer a specific question** ("is the first journey survivable?", "does anyone ever take this option?"). Sweeps are throwaway scripts in the session scratchpad, never committed. When a sweep moves a constant, leave one or two lines beside it saying what was measured — not a diary.

**Comments say why, briefly.** No narrating code, no evidence essays. A reader should be able to see the code.

**Build the game, not an engine.** No plugin systems, DI, ECS, scripting languages, editors, or factories for one implementation. A little duplication is fine.

**Flag scope increases** before building anything `VISION.md` § *What we deliberately avoid* lists.

---

## Architecture

```text
src/
├── content/   # game data: ids and numbers only, no words
├── core/      # rules: map generation, state, reducer, rng
├── i18n/      # every word a player reads, one file per language
├── ui/        # React screens and styles
└── main.tsx
```

Dependencies point one way:

```text
ui → core → content
ui → i18n → content (types only)
```

- `core/` imports no React, no DOM, no `Date`, no `Math.random`, and no `i18n/`. It produces ids and numbers; the UI turns them into words.
- `content/` imports nothing from `core/` or `i18n/`.
- Runtime dependencies are `react` and `react-dom` only. Adding one needs a demonstrated reason.

## Determinism

Everything random is decided when the map is generated from the seed — layout, each day's weather, which scene stands where, and which variant of it is going on (scent scenes take theirs from the wind). Play itself uses no randomness. The only `Math.random` is the UI picking a new seed.

## Languages

Every player-facing string lives in `src/i18n/<locale>.ts`, shaped by `Strings` in `src/i18n/types.ts`:

- Game text is keyed by the ids in `content/` (scenes, variants, options, facts, destinations).
- UI text is a fixed interface, so a missing key fails `typecheck`.
- Anything that depends on a number or a name is a **function**, so each language handles its own grammar (Korean particles, plurals) instead of stitching fragments together.
- State never stores prose — only ids. Text is looked up at render time, so switching language re-renders everything.

To add a language: copy `ko.ts` to `xx.ts`, translate, add it to `locales` in `src/i18n/index.ts`. `i18n.test.ts` walks the game data and fails on any scene, variant, option, fact or destination the new locale is missing. A language picker appears on its own once there is more than one.

When adding content, add its ids in `content/` and its text in **every** locale; the same test enforces it.

---

## Testing

Test rules, not markup: resources, determinism, map structure, what knowledge unlocks, invalid actions, endings, content integrity, locale coverage.

A green suite is not evidence. When a test guards something important, break the implementation on purpose once and watch it fail.

When fixing a gameplay bug, add a regression test.

---

## Working agreements

- **Never push without being asked.** Pushing `main` deploys to GitHub Pages.
- The repo is public, deliberately. Never change its visibility.
- `git status` must come back clean: throwaway harnesses and screenshots live outside the repo or are deleted.

## Definition of done

- The change is playable, and the user has been told how to try it.
- `npm test` and `npm run typecheck` pass.
- New text exists in every locale.
- `VISION.md` updated if the design changed.
