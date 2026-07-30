---
name: playtest-review
description: This skill should be used to judge whether Project Wander is actually FUN — when the user asks to "playtest", "is this fun yet", "review the game", "evaluate the gameplay", "critique the design", or after a milestone that changes rules, tuning, or content. Gathers hard evidence (a seeded simulation sweep over many seeds, plus real browser playthroughs) and hands it to the adversarial `game-critic` agent. This is DESIGN evaluation, not code review and not rendering review — use hyper-code-review for code and visual-review for how it looks.
---

# Playtest review

Tests prove the rules work. They say nothing about whether anyone wants a second journey — which is this project's actual success metric (VISION.md). This skill gathers evidence about the *experience* and hands it to a critic whose job is to argue the game is not fun yet.

**Nothing here is committed.** The sweep script is scratch, deleted before the skill ends. Output is a critique, not a test.

## Why this game can be evaluated with numbers

`src/core/reducer.ts` is pure and seeded: a whole journey is a function of `(seed, policy)`. So the critic gets quantitative evidence, not vibes — win rates, choice usage, encounter distribution, dominant-strategy detection. Use it. A critique that only says "it feels thin" is a weak critique here.

## Step 0 — read the rubric source

Read `VISION.md` first. It is the standard the game is judged against — design pillars, the player fantasy, the anti-goals ("never repetitive monster farming"), and the success metric:

> A successful prototype is one where players voluntarily start another journey immediately after finishing the previous one.

Also read `CLAUDE.md` for what is deliberately out of scope right now. This matters: a critique that says "add AI dialogue and a codex" when those are scheduled later is noise.

## Step 1 — simulation sweep (the hard evidence)

Write a throwaway vitest file at `<repo>/playtest-sweep.test.ts` (repo root, so it is impossible to miss). Import `reduce`, `createInitialState`, the actions, and the content, then sweep seeds and print a summary with `console.log`. Measure at least:

- **Outcome mix** per policy over ≥200 seeds — arrived / defeated, and final HP distribution.
- **Dominant strategy** — is one policy strictly better on every seed? Is there any seed where a "greedy" choice beats the cautious one? A game with a strictly dominant policy has no decisions.
- **Choice usage** — how often each option is picked and how often each is *unaffordable*. An option never chosen or never affordable is dead content.
- **Encounter distribution** — how many journeys are fully quiet, how often the same encounter repeats within one journey, how many distinct encounters a typical run sees.
- **Journey shape** — actions per run, and how much resources actually swing.

Run it:

```bash
npx vitest run playtest-sweep.test.ts --reporter=verbose 2>&1 | tail -60
```

Then **delete it and prove the tree is clean**:

```bash
rm -f playtest-sweep.test.ts && git status --short
```

Save the captured output to the session scratchpad so the critic can read it.

## Step 2 — real playthroughs (the felt evidence)

Numbers miss pacing and tone. Play it for real with the Playwright MCP browser (load the tools via ToolSearch; if unavailable, say so and continue with simulation evidence only — do not fake it).

Start the dev server (`npm run dev`, background) and play **2–3 complete journeys** with different intents — one cautious, one reckless, one deliberately trying to get bored. For each, record a transcript to the scratchpad: every screen, the resource values, the choice taken, and the result line. Note where you felt a decision mattered and where you clicked through without thinking. Stop the server and delete `.playwright-mcp/` afterwards.

## Step 3 — dispatch the critic

Dispatch the **`game-critic`** agent (`.claude/agents/game-critic.md`, `run_in_background: false`). Give it: the sweep output path, the playthrough transcript path, what changed in the last milestone, and the current out-of-scope list from CLAUDE.md. It does not run the sim or drive the browser — it reads the evidence and attacks.

Do not pre-soften the evidence or argue with it in the dispatch prompt. Hand over the numbers as they are.

## Step 4 — report

Relay the critic's ranked findings, separating:

- **Actionable now** — fixable within the current scope (tuning, content, choice design, ordering).
- **Blocked on a future milestone** — genuinely needs AI narration, the codex, companions, or camping. Name the milestone; do not treat it as a defect of today's build.

Then recommend the single highest-leverage change. Never end with "it's fine" — if the critic found nothing, state exactly what was measured and played.
