Authoring rules for the content that exists today, and the measurements behind them.

`VISION.md` is the target; this file is the present. Where a rule here is narrower than VISION, it is describing what has been built and measured, not disagreeing with the direction.

A figure in this file is evidence for the decision it justified — not a number a later sweep should expect to reproduce. Say which harness produced it.

---

NPC

Never exposition dumps.

Talk like real travelers.

---

Villages

Should feel lived in.

Never exist only for quests.

---

Animals and Monsters

Animals behave like animals. Not evil by default, and not motivated by the traveler — a boar wants what a boar wants and the traveler is in the way of it.

All five species shipped so far are animals. **No monster has been built.**

When one is, the line between the two kinds is legibility, not power: an animal can be guessed at from ordinary sense, and a monster punishes exactly that guess. A monster with the same behaviour and bigger numbers is an animal with bigger numbers. See `VISION.md` § *Animals and Monsters*.

---

Encounters

Every encounter carries one `codex: "teaches"` option and one `codex: "requires"` option.

Every situation sits at exactly one RUNG of its species' ladder (`codexLayer`): its `teaches` option teaches that rung, and its `requires` option needs it. The pair of fields says which SIDE an option is on and never which rung — that is the situation's, which is why neither field changed when the codex stopped being a binary.

They share a menu slot, and the slot holds exactly one option at every depth. One rung short of the situation's rung the observation is LIVE; shallower than that it is LOCKED — shown and refused; at that rung or deeper the unlocked answer stands in its place. The menu is therefore the same length at every depth: knowing more swaps an answer in, it never lengthens the list.

A locked observation keeps its button and its reason, the same idiom a weather-closed answer keeps — the same BUTTON, no longer the same register: the locked line now reads in a register of its own, separate from a learned note and from a weather-closed reason alike. The reason names no animal and gives no number: what makes a door worth opening is seeing it, not pricing it.

The locked door is neither decoration nor a road that reads as refusal, and it has now been measured against gates declared before the run rather than described after it. Instrument for every figure in the next four paragraphs: tie instrument `historical` (first-of-equal-maxima), 300 seeds, five blind policies, chained three journeys where a figure spans journeys, run on `0f5ef2c` — the saturated-morning tree, since reverted, which differed from what ships only at the departure morning of a full codex.

**Does a locked door open? PASSED.** Per locked (species, rung) sighting on `learner`, the question was whether that same cell later OPENS in the same chain — the observation standing LIVE, or the answer that rung unlocks standing in its place, both counted as open because both are the door having opened: boar@2 58.7% (n=121), wolves@2 49.8% (n=225), bees@2 54.2% (**n=96 — under the ~100-decision loudness rule this file applies elsewhere, and it stays flagged wherever that cell is quoted**), red-deer@2 51.0% (n=206). **Pooled 52.5% over n=648**, mean 1.37 journeys from sighting to opening, against a declared gate of ≥ 0.50. It clears the declared line by 2.5pp — that margin, and not a wider one. **The measurement is RIGHT-CENSORED, so 52.5% is a LOWER BOUND** — say so wherever it appears: a door sighted in journey 1 opens on 63.7% of sightings (n=421), in journey 2 on 36.9% (n=179), in journey 3 on 12.5% (n=48), because the chain stops before the late ones can be answered.

**Does the door dominate the road? PASSED — no defect found.** First journey, `learner`: locked on 22.3% of encounters against live on 52.5%, so live observations outnumber locked ones 2.4 to 1.

**The non-learning readings are a descriptive record and were never gated.** `careful-signs` accumulates **2022 locked sightings and opens none of them — 0.0% at every cell** — and reads 33.6% locked against 67.7% live on its first journey. Gating either would be gating a policy for not learning, and both were predicted before the run. What they record is the shipped road as a traveler who never observes meets it: `careful-signs` is the strongest policy in the game — the 32.3% best ending in § *Animals*, which layers do not move — and it sees a locked door on about a third of its encounters on every journey forever and never once sees one open.

**The anchor reproduced on one policy and not exactly on the other, and it is reported as measured.** Re-running this file's own recorded exposure rows: `careful-signs` comes back 33.6% / 33.5% / 35.0% across journeys 1-3, **exactly the recorded row**; `learner` comes back 22.3% / 9.7% / 2.6% against the recorded 22.5% / 10.0% / 2.8% — **0.2-0.3pp below on all three, so the recorded learner row does not reproduce exactly.** Three things are known about it and none of them explains it away: the BASELINE tree gives the same figures, so nothing in the saturated-morning milestone caused it; `learner`'s journey-3 LIVE share reads 16.1% against the recorded 16.1%, exact; and an alternative "shown and refused for any reason" definition of exposure fits neither row. It is a harness fact of the same class already written down about the two-animal slot cohort in § *Animals*, and it stays written down as one.

**Qualitative playtest notes, cited as that and not as measurement.** Three persona sessions, seeds 0 / 1 / 2, model Claude Opus 4.6, run as a fresh-eyes subagent reading only rendered screen text — no repo files, no design docs, no figures — asked an open-ended question at each moment first and the declared comparison only as a follow-up. (The same arm carried the craft-label question recorded in § *Village*.) On the locked door the answer was the same in all three: it reads as **texture, not refusal**. Their shared reservation, in their words, is that it is *"a bookmark without an address"* — a weather lock names what would clear it and FLIPS when the sky changes, while the knowledge lock's wording never changes, so one reads as a **condition** and the other as a **status**. That is the note to pick up if this idiom is ever revised; it is not what the gates measured. **Half of it has since been acted on, and the note stays OPEN.** What moved is the REGISTER: the locked line no longer reads in the register a weather-closed reason and an empty pack share, so the status is no longer dressed as a condition. What did not move is the WORDING — unchanged word for word, and the knowledge lock still names nothing that would open it, which is the half the reservation was actually about. One further fresh-eyes session on the split register, same arm, **one session and not a measurement**: it read the locked line as a different KIND of statement from a resource refusal — in its words the other options are locked on an empty pack while this one is locked on the reader's own ignorance, and it does not say what would fix it. It does not supersede the three-session finding above; it is consistent with it.

**The ruling, recorded separately from the gates above because it is a different kind of thing.** The gate classifications say what the probes returned. The decision is that **the locked door ships exactly as it is — working as designed** — and the ground given for it is both gates passing and the persona sessions reading the door as texture rather than refusal. It stays on evidence rather than by default. Nothing in `src/` moved for that ruling — the register split recorded above came later and separately, and left the gate and the locked wording untouched.

A `fieldNote` belongs to a (SPECIES, LAYER), not to the encounter — every situation standing at a rung teaches that rung's note, and `fieldNotes.length` is the one place a species' depth is defined. A note still names no place (§ *Animals*).

The ladder as it ships. Nine rungs over five species:

| species | depth | rung 1 | rung 2 |
|---|---|---|---|
| boar | 2 | `ford-boar`, `wallow-boar` | `sow-and-litter` |
| wolves | 2 | `pine-shadows` | `wolves-at-a-kill` |
| bees | 2 | `bee-hollow`, `old-skep` | `robbed-hollow` |
| waxwings | **1** | `rowan-flock`, `thorn-hedge-flock` | — |
| red stag | 2 | `rut-stag` | `walled-lane-stag` |

The waxwings stop at one on purpose, and it is an authored judgment rather than a measured one. Their two situations pose the same lesson twice, so a second note would have to be written about a scene that already says everything it has to say, and it would put `work-the-shaded-foot` behind a rung the first note already teaches — a tollbooth wearing knowledge's name. The ladder is as deep as the content honestly is, per species. It has a measurement consequence, and it is named where the figures are: the waxwings contribute no rung-2 cell, so the per-cell probe in § *Animals* rests on four rung-2 cells and not five, and their two rung-1 cells are controls.

Five things pin the ladder, and they are worth knowing before authoring against it:

- Every species has at least one note and no blank note. `fieldNotes` is the whole definition of depth, so an empty one makes an animal unlearnable while every gate goes on treating it as a species with rungs.
- A situation's `codexLayer` is an integer in `[1, fieldNotes.length]`. Above the ceiling its observation teaches a note that does not exist.
- Every rung of every species has a situation standing at it. A rung nothing teaches strands the note, the answer it buys, and every rung above it.
- Situations exist at more than one rung. Everything else about layers passes vacuously on a road one deep, so this is what goes red if an edit flattens the codex back into a binary.
- The slot shows exactly one codex option at every depth, and the observation is choosable at exactly `depth === layer - 1`. Each depth's menu is also checked separately for a way through that a traveler holding nothing can take — a locked observation never counts toward that, since it cannot be taken.

An option id is unique across every animal and every place, not only within its own scene. A leg can hold two scenes at once and the chosen option is resolved to its scene by id alone, so a collision would serve the wrong deltas, the wrong log line, and a `teaches` option that learns the wrong thing. Pinned by test. (The § *Places* line about a shared id space is about SCENE ids and still holds; this is the option-level rule beside it.)

The codex gate resolves the species AND the rung off the scene that OWNS the option, never the leg's first slot. It used to read the first slot, which was sound only while a leg held at most one animal; with two, an option belonging to the second would have been gated on the first one's species — its observation refused as already learned, its unlocked answer opened on knowledge nobody had. **Slot order is presentation only now**, and global option-id uniqueness above is what the resolution rests on. Pinned by a test that goes red whichever slot a wrong gate reads.

An observe option must be strictly dominated by an option that is always offered and open in every weather.

That gap is the price of the knowledge. Free observation is not a choice.

---

Legs

Every leg carries exactly two routes.

They differ in `encounterChance` and in nothing else. Same animals, same toll.

Pricing the roads differently collapses the choice: one road becomes correct, and it is taken on almost every leg where the two disagree.

Open ground carries the lower chance, thick cover the higher. Keep that true on every leg, or the rule cannot be learned.

Every leg carries the same pair of odds as every other leg.

The traffic hint is derived from those numbers, never authored beside them.


---

Places

A place carries no `codex` and no `fieldNote`. Nothing about it is learnable.

Its options must include at least one a traveler with nothing left can still take.

Places share an id space with animals. A collision serves the wrong scene.

All three places offer the same four trades: take supplies and leave something of your own, spend an evening for materials, pay in skin for what is out of reach, or stop and sleep.

They differ in exactly one number — how good the night is — and that restraint cost four measured attempts to learn.

Food is the binding resource on this road, so a place that hands over more of it makes its own other choices pointless. A cargo worth 3 food was taken on 99.8% of its offers and left that place's other three options at 0.9%, 2.9% and 0.4%. Thinning every take instead moved the decoration elsewhere; differentiating the roof as well made it worse still.

The night is the one axis food does not bind. Even there the floor is 2: a rest costs a meal, a meal is worth roughly the 3 hp a hungry leg takes, and a rest worth 1 hp measured at 2.3% of its offers.

A place that should genuinely mean something different needs a new KIND of trade, not a bigger one.

They are drawn from the band ABOVE a route's own odds — the stretch that used to be an empty leg. Never mix them into the animal pool: that thins the species and the codex lives on meeting one twice.

`PAIR_CHANCE = 0.5` subdivides that same place band: half of it holds an animal beside the place, and the traveler answers one of the two. It is carved from the PLACE band and never the animal band, and that is the whole reason it is safe — a pair drawn out of the animal band would let the traveler answer the place INSTEAD of an animal already drawn, which is the thinning above. Drawn out of the place band it can only ADD animal meetings. Measured (five policies, 300 seeds, tie instrument `historical`, before/after `991b246`): the share of runs that meet the same species twice went 83.1% → 89.5%, and the share that ANSWER the same species twice went 83.1% → 85.7% — the smaller rise being the pair's own cost, since some added meetings are walked past. It did not fall on any policy. The repo's older recorded 71-74% band does not reproduce under this harness on either tree, so the direction above is the finding and the level is instrument-specific.

The ANIMAL band has a subdivision of its own now — see § *Animals* and `TWO_ANIMAL_CHANCE`. It is carved from the animals' band and not from this one, so `PAIR_CHANCE` and everything measured about it below are untouched by it; measured on the current tree the place pair reads 84.1% / 86.2% against the 83.9% / 85.8% recorded here, within 0.4pp.

0.5 is a starting value, not a measured one. It puts a pair on about an eighth of legs. The lone place still exists at that value and both shapes are pinned reachable by test — that test, not a bounds assertion on the constant, is the only guard on it, and it goes red at 0 and at 1.

What the pair measured, and what it did not (300 seeds; instruments named; nothing retuned): with the four scoring policies pooled, the place takes the pair on 83.9% / 85.8% of eligible decisions under the two tie salts — under the >90% gate, so the pair is not a fake choice, but only just, and `hoarder` alone fails it at 92.6% / 93.5%. The observation is taken on 4.7%, all of it by `learner`; the other three price knowledge at exactly 0 by construction, so that column is a property of the policy set rather than of the road. Under a calibrated scorer that prices a codex entry at K = 4 (≈ 1.3 hungry-day meals on that harness's scale, selected identically by both salts; on the layered tree that same K prices a RUNG rather than a whole species, and re-calibrated to 4 again) the pair goes to roughly half — observation 49.3% / 48.6% — which says the mechanic CAN be a live decision and that nothing in the shipped scoring makes it one. Read all of it against one limit: the place teaches nothing, so what was priced is knowledge against a RESOURCE, not `VISION.md`'s knowledge against other knowledge.

---

Animals

Five species, met in twelve situations. A species is picked first and one of its situations second, so giving an animal more ways to be met splits its own share and never makes it commoner.

How often the road can feed you is therefore an average of per-species RATIOS, not a count of scenes. It ships at 50.0%, and a test pins both the ratios and the average:

Keep this figure and the road's food opportunity apart; conflating them is how a difficulty change hides. The **authored feeding ratio is unchanged at 50.0%** — it is a property of the situations, and `PAIR_CHANCE` does not touch a situation. The **road's food opportunity** — the share of encounters where some available option has a positive effective `foodDelta` — is the one a pair could have moved, and measured on `careful-signs` under `historical` it went 59.2% (1114/1882) to 59.2% (1115/1882) across `991b246` → the pair: one encounter. The encounter count is identical on both trees, because a pair is still one encounter.

`TWO_ANIMAL_CHANCE` moved it, and by a lot. Same instrument, `6e99e05` → the second animal: food opportunity **59.2% (1115/1882) → 66.1% (1248/1889)**, a careful line's best ending **21.7% → 32.3%**, its deaths **10.0% → 5.3%**. The authored feeding ratio is STILL 50.0% and every band boundary is still exactly where it was — the closed-form share of legs holding at least one animal reads 0.625 quiet / 0.875 busy on both trees, to four decimals. **A change can leave every boundary untouched and still move the difficulty**, because a second animal is a second whole menu and roughly doubles the affordable answers on that leg. Say which of the three figures a claim is about; this is the exact conflation the paragraph above exists to prevent, and the second animal is the case that proves the two can move apart.

| species | situations | of which feed you |
|---|---|---|
| boar | 3 | 1 — the wallow |
| wolves | 2 | 1 — the kill |
| bees | 3 | 2 — not the robbed hollow |
| waxwings | 2 | 2 — this is the second food source |
| red stag | 2 | 0 — a cost animal wherever he is met |

That ratio is not flavour, and it is the largest difficulty knob in the game. Adding situations to an animal that ALWAYS feeds you dilutes the share and makes the road harder; adding a feeding situation to a cost animal does the reverse. Measured over 300 seeds against five blind policies: the wolves' kill took the share from 55.6% to 64.5% and careful play from a 17.7% best ending to 30.3%; the three bee and waxwing situations brought it back to 59.2% and 20.7%. Decide the target BEFORE authoring, or the scenes decide it for you.

`TWO_ANIMAL_CHANCE = 0.25` subdivides the ANIMAL band: a quarter of animal legs hold a second animal beside the first, and the traveler answers exactly one. **The two are always DIFFERENT species** — two situations of one animal offer one rung of one ladder between them at any depth, so the choice would collapse to resource deltas, which is the question the place pair already answered. The second is drawn uniform over the four species that are not the first, `filter` preserving list order.

Carved from the animal band and NOT the place band, and the reason is not the one that governs places. Both sides here are animals, so a two-animal leg still ends with exactly one animal answered — the count answered per journey is what it always was, and the count MET goes up. Eating into the place band instead would have had to consume one of the two shapes already standing there, making places rarer; a place is a food source, so that is a difficulty change wearing a knowledge change's name. Three legs in four still hold a LONE animal, deliberately: that is where a first meeting is FORCED, and a forced meeting is how a species no policy would choose still gets learned.

0.25 is a starting value, not a measured one, and it shipped before it was swept exactly as `PAIR_CHANCE` did. The only guard on it is a test that both shapes stay reachable — red at 0 and at 1.

What it measured (300 seeds, both tie salts, baseline `6e99e05`; the slot cohort is every decision on a two-animal leg, the strict cohort is one where both species are unknown and both observations affordable):

- **Neither slot wins.** The leg's own draw takes 48.1% / 48.7% of the slot cohort (n=1561/1560, four scoring policies pooled) — no policy exceeds 56.6%. The slot gate passes on both salts.
- **Neither animal's knowledge wins.** Under the calibrated scorer at K\*=4 the split between the two observations is 47.3% / 47.2%, and at K=9 — where both observations outrank every resource answer — 45.9% / 41.7%. The knowledge gate passes on both salts.
- **Knowledge still loses to a resource**: 93.4% of the strict cohort goes to a resource answer. Do not set that against the place pair's 83.9% / 85.8% as though they were the same reading — different cohort, different alternatives, different denominator.
- **The instrument's ceiling, and it is the important line here.** A flat K prices every species' knowledge identically, so this sweep can only see knowledge-against-knowledge where the two observations' RESOURCE prices differ. Where they match the decision ties and the salt decides it — 34% of decisions at K\*, and 100% of the shipped policies' 76/75-decision cohort, which is why that particular figure is reported and then discarded. **Nothing here models wanting one species more than another**, and that is what `VISION.md` is actually asking for.
- **The answered mix tilted.** Every scoring policy moved +2.7 to +4.6pp toward the waxwings (2 of 2 situations feed you) and −1.7 to −4.1pp away from the red stag (0 of 2) — a spread of 8-13pp where it used to sit within 1.5pp of uniform. It has not become a codex failure: species known at arrival rose 3.27 → 3.43 and every species rose, the stag included, because a policy that wants entries declines the RESOURCE answer rather than the species. Recorded as the thing to re-measure if this rate ever goes up.

A species' notes are learned in ORDER, one per rung, so a note is what the codex shows no matter which situation taught that rung. Name no place in any of them. A note reading "at a hollow's mouth" has the codex describe a hollow to a traveler who watched a straw skep.

The codex learns a species in RUNGS rather than once — nine of them over five species, the ladder in § *Encounters*. What that measured, and what it did not. Baseline `11e5d97` → `1e97dcd`, 300 seeds unless a figure says otherwise, tie instrument named on every reading: `historical` is first-of-equal-maxima, the rule the figures already recorded above were produced under, and `saltA` (`0x7f4a7c15`) / `saltB` (`0x2545f491`) are the two tie salts. Read the whole block against the road-property/instrument-property split at the head of this section: a band share and a feeding ratio are what the ROAD does, an uptake and a split and a cell price are what a SCORER does, and conflating them is how a difficulty change hides.

- **The road did not move; only a learner did.** Every closed-form band share is byte-identical between the two trees, and the authored feeding ratio is untouched at **50.0%** — no option's delta moved. **Four of the five blind policies are bit-identical across the trees**: every ending count, every encounter count, every food-opportunity numerator. Layers are invisible to a policy that does not learn. `learner` is the only one that moves and it moves WORSE — best ending 6.0% → 4.7%, deaths 27.3% → 30.3% — which is the price of a first journey spent going deeper on fewer animals, below.
- **The depth curve, and it is the clearest positive result here.** Share of encounters still offering a LIVE observation, `learner` under `historical`, journeys 1-3: baseline 53.4% / 8.0% / **0.0%**, current 52.0% / 32.2% / **16.1%**. On the baseline a learner's third journey has nothing left to learn at all — 299 of 300 seeds sit at the ceiling. Rungs known at journey end, same policy: baseline 3.44 → 4.82 → 5.00 (the ceiling), current 3.26 → 5.78 → 7.63 of 9. This is what the change can claim, and it is exhaustion moved from five facts to nine — not `VISION.md`'s tenth journey.
- **The trapper's horizon moved with it, and the measurement is RIGHT-CENSORED — say so wherever the figure appears.** Chains were extended past journey 3 until the policy stopped taking the trapper, with a hard cap at journey 10. `learner` withdraws at journeys 2 / 3 / 4 / 5 on 25 / 222 / 52 / 1 seeds on the baseline and at journeys 4 / 5 / 6 / 7 on 57 / 165 / 70 / 8 now — **median journey 3 → 5**, nothing censored on either tree. Village lessons over those chains 629 → 1229, of which **616 (50.1%) are deeper than rung 1**. `careful-signs` is **300/300 right-censored**: it never takes the trapper at all, so it measures nothing about the horizon and is listed as censored rather than averaged in as though it had withdrawn at the cap.
- **The first journey pays for it, and the direction was declared before it was measured.** `learner` arrives knowing 3.47 → **2.89** species (−16.7%) but 3.47 → 3.31 RUNGS: fewer animals, nearly as many facts. Repeat rate did not follow it down — species met twice 95.1% → 95.1%, which is a road property, and answered twice 87.1% → 87.3%, which pools five policies under `historical` and is read with them. The answered-species distribution moved at most 0.1pp, so **the 8-13pp two-animal tilt recorded above is still there; layers neither fixed nor worsened it.** Layers were never the answer to observation dominance — see `VISION.md`, which says outright that they change how often the question is asked and never how it is answered.
- **Whether one (species, rung) cell's price reaches an outcome — INCONCLUSIVE-FOR-SIZE, not a pass.** The probe pays a calibrated scorer a premium `d` for one cell and asks whether that cell's uptake clears a declared 0.75. On the run that was declared — 300 seeds × 3 journeys — all nine cells cleared 0.75 on both salts at `d = 4`, and every cohort fell under the probe's own ~100-decision loudness rule: the four rung-2 cells that carry the verdict had denominators of **8 to 26**, the five rung-1 controls 33 to 64. Applied as written, that rule makes the declared gate unpowered. **That is a fact about the sweep, not a verdict on the design.**
- A supplementary run at **3000 seeds** (premium grid cut to `{0, 4}`) put every cohort over 100 and every cell over 0.75 on both salts — rung-2 cells boar@2 89.8 / 93.2 (n=118), wolves@2 100 / 100 (n=292/285), bees@2 93.4 / 92.5 (n=152/147), red-deer@2 82.6 / 81.4 (n=167). **That run is outside the declared seed set. It is supporting evidence for the direction and is not the gated figure**, and it must never be written down as though the declared gate passed. The honest sentence, both halves of it: the declared gate could not be powered at the seed count it declared, and at a denominator that satisfies its own loudness rule the direction holds on all four rung-2 cells.
- **Locality is what makes it a CELL price rather than a species price.** Under a `d = 4` premium on species X at rung 2, X's own rung-1 cell comes out **bit-identical to the anchor run** — the counts, not merely the share — while the target cell moves 55-66pp. There is a mechanism behind that rather than luck: every X@1 decision necessarily happens while X is at depth 0, hence strictly before an X@2 premium can change any score.
- **The calibration still holds on this tree.** K\* = 4 is accepted: both salts select the same K, and the uptakes differ by 0.17pp on the lone-leg cohort and 0.6pp on the two-animal cohort, both under the declared 5pp. Two-animal observation uptake at K\* reads 49.7% / 50.3%, so the two-way gate above passes on a layered road too. The baseline calibrates to K\* = 4 as well, which is what makes the two trees comparable at all.
- **The four rung-2 observations went from at or under the decoration line to the most-taken options in the game when they are live** (`historical`, five policies pooled, first journey): 6.5-10.7% of 491-838 offers before, **66.7-83.3% of 23-56 offers** now, while showing LOCKED 548-876 times. Their four `requires` partners shrank by construction — `step-off-the-piglets-line` 60 → 2 offers, `take-a-share-openly` 106 → 11 — and come back down the chained arm: `step-off` is offered 2 / 29 / 102 times across journeys 1-3, and `through-the-stock-gap` goes 2/11 → 19/67 → 45/119 taken. **They are not dead; they are late.** Calling one of them dead off the first-journey column would repeat a mistake this file already records twice.
- **The two ways moved back together.** Same optimal-closure reconstruction as § *Forks* (exhaustive walk over the optimal closure, 300 seeds on both trees): the branch decides the run 81.1% → 79.5% on the full scalar and 14.3% → 13.5% on endings alone; quiet uniquely right 37.0% → 37.5%, busy 44.1% → **41.9%**, so the gap narrows 7.0pp → 4.4pp on the run's own shares (§ *Forks* rounds the same before-gap to 7.1pp). A locked rung removes a reason to prefer the road that turns up more animals. Busy at 41.9% is nowhere near the 74-93% band the road-pricing rule collapsed at.
- **What reproduced, and one thing that did not exactly.** The baseline tree reproduced this file's recorded figures on nine readings — `careful-signs` travelOn 32.3% and deaths 5.3%, food opportunity 1248/1889, the fork's 37.0% / 44.1% and 81.1% / 14.3%, K\* = 4, and the knowledge splits 47.3% / 47.2% and 45.9% / 41.7%. It reproduced the two-animal slot cohort closely but NOT exactly: 48.0% / 48.4% at n=1562/1561 against the recorded 48.1% / 48.7% at n=1561/1560. That is a harness fact and it stays written down as one — the harness that produced the recorded figures was deleted by this repo's own rule and cannot be re-read.

A second situation is worth authoring when it poses a DIFFERENT decision, not when it dresses the same one. Two shapes have earned it so far — a scene where nothing is in your way and the question is whether to take a risk at all (`wallow-boar`, `wolves-at-a-kill`), and a scene where the animal's known answer has nowhere to go (`sow-and-litter`, whose sow will not follow her nose off the road; `walled-lane-stag`, whose lane has no uphill).

`read-the-pack` was the weakest observation in the game at 10.3% of its offers, and the fix was on the payoff side rather than the price: `show-your-kit` was the only `requires` option asking for two preparation HELD, which an eight-leg road spends. At one it is offered 130 times across 300 seeds instead of 59, and `read-the-pack` reaches 19.0%.

Those three figures came from the policy set of the sweep that made the change and do not reproduce under the five-policy harness the village was measured with — that instrument reads 45 offers and 12.1% on the same untouched tree. Neither reading is wrong; they are different instruments, and only one of them is written down.

It was not lowered to zero, which measured better again at 20.4%. `requiresPreparation` would then have exactly one consumer left — the state a playtest already found registers with nobody — and the label promises a kit to show.


---

Labels

Food and preparation are stated as exact numbers, in both directions.

An encounter option's HP price is never a number. The traveler's current HP is printed, and so is the road's toll for walking hungry; it is the cost of an option not yet taken that stays qualitative. It is a scale with three steps — a little blood, blood, a lot of blood — hinged on the one HP figure the game does state outright: what a leg costs when there is nothing left to eat.

Naming the cost came first, because an unlabelled wound read as harmless. The scale came second, because one flat word for costs running from 1 to 6 was not neutral either: a playtester saw a 2 HP wound three times, generalised it, and bet on a fourth encounter costing the same. It cost 4.

Silence does not leave a player without a model. It leaves them with a wrong one.

Exactly how much a wound costs is still found by taking it.

The road's own toll is the one HP number on screen, and it says so: it names the condition, and it says "as well", because a worded price next to a numbered one has to make clear which is which.

An option the menu shows and refuses names what is HELD, in the same exact figures food and preparation are always given in: "you have 0 food", "you have 0 preparation". It states what is held rather than restating the price, because the price is already on the same button from the cost label. It never names HP, and that is structural rather than a matter of tone — HP does not gate an option at all, so there is no HP shortfall to state. The rule above stands unqualified by it.

The shortfall speaks last, and only when neither the sky nor the rung is already speaking: what the pack holds would not change a refusal the weather made, and a locked rung says only that. Every clause that can refuse a rendered button was walked against those three lines, and each is either covered by one of them or unreachable on a button the menu renders — so a rendered button can no longer be disabled without saying why. The shortfall's own half of that rule is pinned by test, silence under a closed sky and silence about HP included.

Be exact about the rest of it, because the obvious shorter sentence is not true. Only the shortfall is suppressed; the sky's reason and the rung's are independent, so an option that was BOTH weather-closed and below its rung would render two reasons. **One reason per button is a property of the shipped catalogue, not of the code** — it holds because no option carries `codex: "teaches"` and a `closedIn` at once, and nothing enforces that. If an option is ever authored with both, that is the moment to decide whether the two reasons should be ordered or whether the pairing should be refused.

Whether the figure in that refusal earns its place is an OPEN reservation, not a settled label — the wording ships as it is. One fresh-eyes persona session (the arm described in § *Encounters*) judged it largely a restatement of the status figures: with food already printed as 0 and the button already refused, "you have 0 food" told it little. Its one exception was the requirement case, where "needs 1 preparation in hand, spends none" was genuinely new to it. The instrument was imperfect for this question and that cuts both ways: the transcript the persona read stated in words that the buttons were greyed out, which the real screen conveys visually, so part of the redundancy it counted is an artifact of the transcript rather than of the label.


---

Forks

About three legs in eight fork. The rest run on one way.

Every leg forking was a rhythm, not an event, and a playtester stopped reading the road by their eighth turn because of it.

Each ROAD carries a sign for each outcome it can show.

On the road, not the leg. Held at the leg, one line had to fit both ways and kept not fitting: a pinewood sign sat on a way described as "out of the trees entirely", and two audits missed it. Storing each line beside the road it describes makes that mismatch easy to notice. It does not make it impossible to write — no test reads prose.

Each road can show two of the three, not all three. A fork only exists where the two ways read differently, so the quieter way never shows an animal and the busier way never shows an empty road. Writing the other sixteen lines would be writing content the game cannot reach — a test derives the reachable set from the shipped code and fails if the two drift apart, including when a retuned constant makes a missing one reachable.

A sign names a KIND, never a species. Naming the creature was measured and it does not hurt the codex — the repeat rate holds. It simply buys almost nothing: the kind is worth 48.3% of seeds against 51.7% for the species, and a print in the mud does not tell you what to call the animal.

A sign must be true. It is computed from the same band the road then walks, so it cannot promise something the leg does not deliver.

A sign UNDER-reports a pair, by design. A leg holding a place and an animal signs exactly as a lone place does: the place it named is there, and the animal beside it is found on arrival. The sign never lies; it says less than it could. `RoadSign` keeps its three values, and a test named for the behaviour pins it so the weakened contradiction test is not the only thing recording it.

It under-reports on the ANIMAL band too, and for the same reason. A leg holding two animals signs `animal`, one animal is what the sign implies, and two is what the road delivers. The existing contradiction test could not record this — its `animal` clause asserts an animal and no place, and both stay true with two animals, so it stayed green and said nothing. A second named test carries it.

A fourth sign kind — one that advertises a pair — was considered and rejected, and that rejection is **an unmeasured prototype judgment, not a measured result.** The reasoning: a road that reliably advertises more looks like the collapse the road-pricing rule measured at 74-93%. But that measurement was about pricing the two roads differently, so it is precedent for the failure mode and not proof of this one — the paired animal is drawn separately from the other road's animal, so neither road's offer contains the other's, and more buttons is not more value. Against an unmeasured upside it would also cost sixteen new authored lines and break "each road can show two of the three". It stays unbuilt.

What the pair did to the fork, measured as **a reconstruction of the optimal-line instrument** (exhaustive walk over the optimal closure, outcome scalar `endingScore × 10000 + hp × 100 + supplies`, 300 seeds, before/after `991b246`): the branch decides the run on 85.6% → 83.6% of optimal-line travel nodes on the full scalar, 20.5% → 19.3% reading endings alone; the quiet way is uniquely right on 39.1% → 41.7% and the busy way on 46.4% → 41.9%. Set those beside the recorded 50.9% / 24.2% rather than over them: the recorded pair came from an instrument nobody can re-read, and the comparison that means anything is the before figure produced in the same run as the after. The direction is worth noticing on its own — the two ways became **less** different, not more, and are now within 0.2pp of each other on the uniquely-right share.

The second animal pushed them back apart, which was **predicted before it was measured** and is the one prediction in this file made in advance. Two-animal legs occur at `encounterChance × TWO_ANIMAL_CHANCE`, so the busy way gets them 1.5:1 where the place pair enriched a band both ways carry at equal width. Same reconstruction, `6e99e05` → the second animal: quiet uniquely right 41.7% → 37.0%, busy 41.9% → 44.1% — **the gap goes 0.2pp → 7.1pp**. The branch decides the run slightly less often (83.6% → 81.1% full scalar, 19.3% → 14.3% on endings alone), because a wider menu lets more lines reach the same best outcome. The thing watched for did NOT happen: the busy way's 44.1% is nowhere near the 74-93% band the road-pricing rule collapsed at, so the roads were not repriced by the back door.

A sign speaks only for the road it is printed on. It sits inside that road's own button, beside a road that may be showing something else. A test refuses the words "both" and "either", but that is a backstop for one failure mode, not a proof that a sign fits its road — nothing mechanical can check that. Read them.

A leg only forks when the two ways lead somewhere DIFFERENT. Below both roads' odds the same roll picks the scene, so both would turn up the same animal and land in an identical state. `FORK_CHANCE` is therefore the chance of a fork WHERE ONE IS POSSIBLE, and the realized rate is about half of it.

---

Weather

The sky is clear, rain, or wind. One sky holds a block of two to four legs, and a boundary always changes it — never the same sky twice running.

Every sky other than clear must close something AND open something. A sky that only subtracts is a tax, not weather, and is rejected: rain closes a scent answer and a tinder answer, and reprices a third open under the wet (`reach-in`, hp -3 to -1 in the rain); wind closes a downwind answer and a spread-cloth answer, and reprices two further opens under the gust (`take-the-windfall` and `take-what-drops-below`, food +1 to +2 in the wind).

Clear is the baseline. It is never itself authored a closure or a reprice — both are typed to the two skies that are not clear, so clear is simply what is left when neither fires, and it restores every answer and every price the other two touched.

A closed answer keeps its button and gains a reason. It never leaves the menu: a menu that reshuffles under a closed door is harder to learn than one that only explains why the door will not open.

A weather reprice must move a band or a printed number, or it does not exist on screen. HP is a three-step scale and food and preparation are exact figures (see Labels) — a reprice that shifts the underlying delta without crossing a band or changing a printed digit is invisible to the only two things a player can read.

Weather never changes what the road turns up. It only prices and closes the answers to whatever was already going to be there; a fork's own sign and the chance behind it are untouched by the sky above the leg.

The travel screen already carried a result line, a road-toll line, and a road-rule line before weather added a standing line of its own, and a playtest had already found the screen busy. Folding the sky into the fork's own sign prose was considered and deliberately deferred, not forgotten.

The busy finding was re-tested and it held. One fresh-eyes persona given only the rendered travel-screen text — one qualitative session, the arm described in § *Encounters*, not a measurement — still read the screen as busy: in its words, four lines of throat-clearing before the screen says where you are. What did change is the leg counter, which moved out of the prose stack into the row of standing figures and took one line out of the preamble. That milestone was UI only and sign prose is content, so the deferral recorded above was not what moved.

The same session proposed showing the road-rule line only when food runs low. Refused, on ground the code already records: the rule is stated on every leg because four playtesters in a row failed to induce it from watching it happen. One reader finding it repetitive does not outweigh four failing to learn it.

A second instrument — a visual review reading only rendered screenshots — judged the travel screen's vertical spacing calm and named the counter's position as the real defect instead. Two instruments reading different inputs and landing on the same line is worth recording as that, and as no more than that.

A forecast of tomorrow's sky was designed, built, and measured before it was ever written into a line. All thirty points of the declared rate grid failed. Precision was reachable at 0.55-0.83 across both seed sets — honest enough to word — but it fired on only 201 of 2236 encounters and changed the pick on 44 of 300 journeys, moving no outcome: worth at most +0.3pp against a declared +3pp bar. Measured worthless rather than merely unproven, it was removed rather than shipped as decoration.

The Ashfold shepherd was built on the argument that this was not that cue coming back. What was dropped was a free per-leg hint about whether tomorrow clears; what he sold was the whole standing block — today's sky, how many legs it holds, and what follows — bought with the morning's only choice, which is to say at the price of the smith, the baker and the trapper all three. A forecast nobody spends anything on and a forecast that costs every other thing the morning could have given looked like different instruments.

The village's gate then ran, and they are the same instrument. Over 300 seeds, five blind policies forced onto each villager averaged 16.3% best-ending with the smith, 14.1% with the baker, 12.0% with the trapper and 8.9% with the shepherd — choosing him cost about 7.4pp against the smith. A paired experiment, one policy consuming the forecast against an identical one ignoring it and both forced onto the shepherd, put the forecast's own worth at +1.3pp. He was cut. The village ships with three.

Note which way round the evidence runs, because it now runs the same way twice. The per-leg cue was measured against a declared bar and failed it at +0.3pp. The shepherd was a design argument until it was measured, and it failed too. Price is not what makes a forecast decide something.

---

Village

The departure morning is a fixed roster of three, never seeded. Variation comes from state, not from the menu.

Every option gives. None charges hp, food, or preparation.

The three currencies — a point of preparation, a point of food, and one rung of what is known about an animal — are pairwise distinct: no villager carries more than one, pinned by test.

Preparation and food each give exactly +1, and nothing else on that option moves.

It was four. The fourth read out the sky ahead and was measured and cut; the figures are in the Weather section above.

The road starts one meal short of what it used to, and that is what makes the morning a choice rather than a bonus. Measured over 300 seeds against five blind policies, the village as a free handout took a careful line's best ending from 20.7% to 34.3% and its death rate from 10.0% to 5.0% while food opportunity barely moved (59.2% to 60.3%) — a head start, not a better-fed road. So `journey.start` took a food back off it: the baker returns the traveler to the old starting line, the smith trades that meal for a point of preparation, and the trapper leaves the meal spent and an animal known.

Take back ONE resource, not one per villager. Cutting preparation as well was measured and reverted: three villagers hand back one resource between them, so a start two short is still one short at the gate. Careful play fell to a 10.7% best ending and 18.7% deaths — as far past the correction as the village had been past the other way — and preparation at 1 collapsed `show-your-kit`, which needs a point HELD, from 130 offers per 300 seeds to 28, dragging `read-the-pack` from 19.0% of its offers to 9.8% and three other observations under the decoration line behind it.

The trapper's pool is RUNGS, not unknown animals. His species is seed-picked among the species not yet at the bottom of their own ladder, and what he gives is that species' NEXT rung — so he can talk about an animal already in the notebook, and what he gives is exactly what watching a situation at that rung would have taught. It is materialized onto the offered option, never authored in content, because a static id has no way to know what this traveler has learned or how far.

With every rung known — nine of them now, not five species — that villager is withdrawn and the morning offers two. The limitation stands, restated rather than answered: layers moved the wall out, they did not remove it, and it is still deliberately uncompensated. Measured on the right-censored chains in § *Animals* (extended until the policy stops taking the trapper, hard cap journey 10, censoring stated because it decides how the figure reads): `learner` hits the wall at a median journey 3 → 5, and takes 629 → 1229 village lessons getting there, half of them (616, 50.1%) deeper than rung 1. `careful-signs` never takes the trapper and is 300/300 censored, so it says nothing about the horizon either way. A substitute reward is still a new system, and more species or a deeper ladder pushes the wall further out rather than addressing it.

A substitute reward was then built at that wall, measured, and taken back off. What existed for one commit (`0f5ef2c`, reverted by `6f99df1`): a fourth villager option authored beside the other three, swapped into the trapper's slot by the reducer exactly when he had no rung left to give, so the saturated morning kept THREE people instead of two. It taught a craft for sleeping rough — every option that gave hp back gave one more, for the rest of that journey only — and it charged nothing, so the rules at the top of this section held.

The instruments for everything below, since the figures are worthless without them: baseline `b2cfc3d`; 300 seeds unless a figure says otherwise; tie instrument `historical` (first-of-equal-maxima) or the two tie salts `saltA` (`0x7f4a7c15`) / `saltB` (`0x2545f491`); "the five policies" and "the four scoring policies" are the blind cohorts this file has used throughout.

- **Nothing before saturation moved.** 0 of 1500 run signatures differ between the trees (five policies × 300 seeds, `historical`). The check is not vacuous — feeding a saturated start instead made 1147 of 1500 differ.
- **What the slot cost, and this is the largest figure here.** Four scoring policies forced onto each option, `historical`, best ending: baker arm 47.9%, smith arm 49.2%, craft arm 38.1% — **the craft's slot is worth −11.1pp against the smith and −9.8pp against the baker.** The shepherd's slot, recorded in § *Weather* as the reason he was cut, cost about 7.4pp.
- **What the craft returned, and this was the gated figure: +0.0pp, and it FAILED.** Under a scorer calibrated to want hp (`sleeper(H*)`, below), forced onto the craft, 300 paired journeys per salt: shipped travelOn 32.7%, the same tree with the craft's rule zeroed 32.7%. The declared gate was ≥ +1.3pp — the shepherd's own worth, the figure that cut him — and it **failed on both salts, by the same amount on each, so it is not salt-sensitive.** Endings changed on 1 of 300 seeds. Rests taken 92 shipped / 93 zeroed.
- **Why it returned nothing, measured rather than argued.** Clamp-aware yield **0.040 hp per journey** (salt A) / 0.043 (salt B), 0.130 hp per rest actually taken, and only 12-13 of 300 journeys saw any yield at all. The craft was on at **92 of 92** rests — the flag applies everywhere it should; the point is clamped away. hp at those rests: 9×1, 10×5, 11×12, 12×27, **13×47**, against a ceiling of 14 (`journey.start.hp`), so the night's own recovery already reaches the cap at most of them and the extra point has nowhere to land.
- **The metric bites.** Same measure, same seeds: craft 32.7% vs baker 45.0% vs smith 51.3%. It separates the arms by 12-19pp, so +0.0pp is a fact about the craft and not about the instrument.
- **The scorer, and its two stated limits.** `sleeper(H)` = `value` + H × recoverable positive effective hp (clamp-aware), grid {0.5, 1, 2}, cohort = saturated states forced onto the craft, N = 149 lone-place rest decisions. Only H = 2 qualified, on both salts (uptake 34.2% / 33.6%, tie rate 0.0%), and both salts selected it 0.7pp apart, so **H\* = 2 is accepted.** Two limits stay written down: N = 149 is modest, and **H\* sits at the top edge of the declared grid** — the grid was not widened to fit it.
- **Uptake under free choice was 0 of 1500 (`historical`), and that is a property of the POLICY SET, never evidence about the craft.** None of the five shipped policies prices a positive `hpDelta` — `bandCost` prices costs only — so a giving option is unchosen by construction. It says nothing about what the withdrawal cost or what the craft was worth, in the same way § *Places* records an observation column that is 0 by construction.
- **Ungated, and about the ROAD rather than the morning:** a saturated start against an ordinary first journey (`historical`, travelOn) reads careful-signs 53.3% vs 32.3%, hoarder 26.3% vs 0.3%, forager 58.0% vs 15.3%, learner 50.0% vs 3.7%, skimmer flat. The saturated road is dramatically better and the **unlocked answers** do that. It is not a reading about the third button and must not be quoted as one.
- **Ungated, with the price injected:** at the saturated morning under `sleeper(H*)` the baker scores 3.000, the smith 1.500, the craft ≈ 0.08 (scored at its own measured yield × H\*). No ties. Even paid to want hp, a scorer reads the craft at about a fortieth of the loaf.

**The structural finding is this milestone's real result: the night is too rare to carry a morning slot.** Rests occur **0.31 per journey**, and a traveler who prices a night rests only when nothing better is on the menu — by which point they are nearly full, so the clamp takes the bonus. That is a **frequency** problem rather than a size problem. **Only the +1 craft was measured, and the inference that a larger bonus fares no better is a DESIGN INFERENCE, not a result** — the reasoning is that a bigger bonus lands on the same rests under the same ceiling, but `sleeper(H)` scores recoverable hp, so a larger bonus can change which options are chosen and every state after them. The plan that produced these figures requires a full re-run with its own recalibration before +2 could be spoken about at all, and that re-run was not done. **The ledger is closed at this village size, empirically.** What the morning can pay out of what exists — preparation, food, a rung, a night — has been tried, and the substitute reward for the withdrawal is the VILLAGE milestone's to carry: an inn, a shop, work, coin, none of which exist (the paragraph below).

The reason it was reverted, recorded as the ruling it is: **the third button is not a choice, it is a trap.** Taking it costs about 11pp of best ending against the smith and returns +0.0pp, and its label was not readable before the click — all three persona sessions answered **no** when asked whether it says what it does (the persona arm, its seeds and its question are named in § *Encounters*; the label was written expressly to state the effect and still did not land). A button that costs the traveler real ground while returning nothing, and does not say so beforehand, is worse than the missing option it was built to replace. This project cut the shepherd at +1.3pp and the per-leg weather cue at +0.3pp; keeping a +0.0pp option would break its own standard. So the withdrawal ships: with every rung known the morning still offers two, still uncompensated, and `VISION.md` § *The full codex is a design target, not an accident* still carries it as the failure that section forbids.

No shop, no coin, no inventory, and one village — the state as built, not the direction. `VISION.md` puts several villages on the road, each with an inn, a shop and work, and coin to spend across them. None of it exists yet.

Villager prose keeps the NPC rules already at the top of this file.
