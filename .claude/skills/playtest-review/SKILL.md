---
name: playtest-review
description: This skill should be used to find design defects in Project Wander — when the user asks to "playtest", "is this fun yet", "review the game", "evaluate the gameplay", "critique the design", or after a milestone that changes rules, tuning, or content. Gathers quantitative evidence (a seeded sweep over hundreds of seeds) and qualitative evidence (simulated-player personas that commit a prediction before each outcome), then hands both to the adversarial `game-critic` agent. This is DESIGN evaluation, not code review and not rendering review — use hyper-code-review for code and visual-review for how it looks.
---

# Playtest review

Tests prove the rules work. They say nothing about whether the choices are real. This skill gathers evidence about the *design* and hands it to a critic.

**Read this before running it.** What this produces is **expert heuristic inspection with a simulated user** — the Cognitive Walkthrough tradition — **not playtesting**. It finds design defects. It does not measure enjoyment.

## What this must NOT claim to measure

State this in the final report. The tooling cannot reach:

- **Whether a human would start another journey.** That is VISION.md's success metric. This pass can only show whether its *preconditions* hold — runs diverge, choices are non-obvious, predictions hold up.
- **Felt pacing or wall-clock drag.** No time passes for a model; reading 900 words is not playing 20 minutes.
- **Felt difficulty.** A model computes expected value; it does not experience risk. The sweep owns actual difficulty.
- **Novelty fatigue past ~3 runs.** With memory a model over-detects repetition; without it, under-detects. There is no habituation curve in between.
- **Emotional payoff.** It can detect setup→payoff *structure*, never felt affect.
- **Population preferences.** Persona variance is caricature, not sampling.
- **Anything visual.** `visual-review` owns rendering.
- **Prose quality in absolute terms** — only defects and relative-to-control comparisons are defensible, because a Claude judge over-rates Claude-written prose.

Three human playtesters remain the only instrument for the success metric.

## Step 0 — rubric and intent

Read `VISION.md` (the standard: pillars, anti-goals, success metric) and `CLAUDE.md` (what is deliberately deferred — a critique that says "add AI and the codex" is noise).

Then write down the **pre-declared intended-hidden-information list**. Today that is: option labels show food and preparation costs but deliberately hide HP costs (`costHint()` in `src/ui/App.tsx`). Without this list every persona reports the boar's 6 HP as a defect on turn one — a guaranteed false positive. First-exposure surprise at something on this list is design working; second-exposure surprise at the same thing is a teaching failure and is a real defect.

## Step 1 — quantitative sweep

Write a throwaway vitest file at `<repo>/playtest-sweep.test.ts` (repo root, impossible to miss). Import `reduce`, `createInitialState`, `canChooseOption`, and the content; sweep ≥200 seeds across several policies and `console.log` a summary of:

- **Outcome mix** per policy — arrived / defeated, final HP distribution.
- **Dominant strategy** — is one policy never beaten on any seed? That means there is no decision.
- **Choice usage** — how often each option is picked and how often *unaffordable*. Never chosen or never affordable is dead content.
- **Encounter distribution** — fully quiet runs, repeats within a run, distinct encounters a typical run sees.
- **Journey shape** — actions per run, resource swing.

```bash
npx vitest run playtest-sweep.test.ts --reporter=verbose 2>&1 | tail -60
rm -f playtest-sweep.test.ts && git status --short   # must come back clean
```

Save the output to the session scratchpad.

## Step 2 — persona runs (the qualitative evidence)

### 2a. Build the replay harness

`reduce` is pure and seeded, so a journey is `(seed, choices) -> screen`. Write a second throwaway vitest file, `<repo>/playtest-step.test.ts`, driven by env vars so it needs no new dependency:

```bash
PW_SEED=12345 PW_CHOICES=wade-past,light-torch npx vitest run playtest-step.test.ts 2>&1 | sed -n '/^--- SCREEN/,/^--- END/p'
```

It replays `START_JOURNEY` plus the choice list and prints **only what a player sees**: phase, HP/food/preparation, leg counter, the current screen's title and description, the previous result line, and each option's label with its cost hint and an `[unavailable]` marker where `canChooseOption` is false. Nothing else — no ids beyond what the persona must echo back, no deltas, no seed internals.

This replaces browser-driven playthroughs for personas: the browser cannot pin a seed (the `?seed=` param was deliberately rejected), so browser runs cannot be paired with sweep seeds. Keep **one** manual browser pass at the end as a sanity check that it still renders; `visual-review` owns rendering properly.

### 2b. Dispatch the personas

Dispatch the **`player-persona`** agent (`.claude/agents/player-persona.md`, `run_in_background: false`) **once per persona**, each playing **the same 3 seeds** in one invocation so it carries memory across runs (the second-exposure rule depends on that memory). Paired seeds mean persona differences are not confounded with content.

Four personas, differentiated by utility function — not by biography (demographic personas produce caricature and stereotype):

| Persona | Maximizes | What it tests |
|---|---|---|
| **Careful Arriver** | probability of arriving | Does the player notice they are on rails? |
| **Curious Naturalist** | learning about the animals, at any cost | Is curiosity rewarded or just taxed in HP? |
| **Skinflint** | ending with resources unspent | Surfaces preparation-as-maintenance |
| **Skimmer** | minimum reading; takes the first option | If the Skimmer arrives as reliably as the Careful Arriver, the choices do not matter. Highest signal per token. |

Give each: its utility function as a hard constraint that overrides good play, its seeds, the harness command, and a numeric turn cap. Do **not** give it `VISION.md`, the sweep results, the source, or any hint that this is your game.

### 2c. Tally — the skill does this, not a model

Derive from the persona output:

- `option_id | exposures | chosen | blocked | first_exposure_violations | second_exposure_violations | sign_errors`
- `decision_tag` counts across all choice points (`deliberated` / `obvious` / `no_real_choice` / `forced_by_blocked_options` / `skipped_reading`)
- Per-seed divergence: on the same seed, did the four personas produce different text and different outcomes?
- **Confabulation check** — grep every persona quote against the harness transcript for that `(seed, choices)` path. A quote that is not there was invented; drop the finding and report the count as a reliability figure.

## Step 3 — optional blind A/B, with controls

Only when comparing two builds or judging variety. One-shot dispatch, no VISION.md, no persona identity, no seed labels. Forced choice, then **re-run with A and B swapped** — if the answer flips, record `no_signal` and do not average.

Always include both controls, and report their outcomes to the critic (they matter more than the verdicts):

- **Degraded-prose control** — real content vs. a flattened rewrite ("The boar attacks you. You lose 6 HP."). If the judge cannot pick the real one in both orders, **strike every voice verdict from this pass**.
- **Yes-man control** — the same transcript twice, asked which is more varied. Any answer other than "identical" means it is pattern-matching the question shape; strike its variety verdict too.

## Step 4 — dispatch the critic

Dispatch **`game-critic`** (`run_in_background: false`) with: the sweep output, the derived tallies (not raw persona prose), verified quotes, the confabulation count, the A/B and control outcomes, the pre-declared hidden-information list, and the current out-of-scope list. Hand the evidence over as it is — do not pre-soften it or argue with it in the prompt.

## Step 5 — clean up and report

Delete both scratch files and `.playwright-mcp/` if a browser pass ran; confirm `git status --short` is clean.

Relay the critic's findings, separating **actionable now** from **blocked on a future milestone** (naming the milestone). Include the reliability notes — confabulation count, any flipped A/B, control results — and repeat the "must NOT claim to measure" boundary. Recommend the single highest-leverage change as a hypothesis for human playtest, never as a proven fix.

Never end with "it's fine". If nothing was found, state exactly what was measured, played, and checked.
