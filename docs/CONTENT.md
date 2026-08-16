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

They share a menu slot: the observation is offered until the species is known, what it unlocks only after.

A `fieldNote` belongs to the SPECIES, not to the encounter — every situation that teaches an animal teaches the same note.

An option id is unique across every animal and every place, not only within its own scene. A leg can hold two scenes at once and the chosen option is resolved to its scene by id alone, so a collision would serve the wrong deltas, the wrong log line, and a `teaches` option that learns the wrong thing. Pinned by test. (The § *Places* line about a shared id space is about SCENE ids and still holds; this is the option-level rule beside it.)

The codex gate resolves the species of the scene that OWNS the option, never the leg's first slot. It used to read the first slot, which was sound only while a leg held at most one animal; with two, an option belonging to the second would have been gated on the first one's species — its observation refused as already learned, its unlocked answer opened on knowledge nobody had. **Slot order is presentation only now**, and global option-id uniqueness above is what the resolution rests on. Pinned by a test that goes red whichever slot a wrong gate reads.

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

What the pair measured, and what it did not (300 seeds; instruments named; nothing retuned): with the four scoring policies pooled, the place takes the pair on 83.9% / 85.8% of eligible decisions under the two tie salts — under the >90% gate, so the pair is not a fake choice, but only just, and `hoarder` alone fails it at 92.6% / 93.5%. The observation is taken on 4.7%, all of it by `learner`; the other three price knowledge at exactly 0 by construction, so that column is a property of the policy set rather than of the road. Under a calibrated scorer that prices a codex entry at K = 4 (≈ 1.3 hungry-day meals on that harness's scale, selected identically by both salts) the pair goes to roughly half — observation 49.3% / 48.6% — which says the mechanic CAN be a live decision and that nothing in the shipped scoring makes it one. Read all of it against one limit: the place teaches nothing, so what was priced is knowledge against a RESOURCE, not `VISION.md`'s knowledge against other knowledge.

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

`TWO_ANIMAL_CHANCE = 0.25` subdivides the ANIMAL band: a quarter of animal legs hold a second animal beside the first, and the traveler answers exactly one. **The two are always DIFFERENT species** — two situations of one animal teach the same codex entry, so the choice would collapse to resource deltas, which is the question the place pair already answered. The second is drawn uniform over the four species that are not the first, `filter` preserving list order.

Carved from the animal band and NOT the place band, and the reason is not the one that governs places. Both sides here are animals, so a two-animal leg still ends with exactly one animal answered — the count answered per journey is what it always was, and the count MET goes up. Eating into the place band instead would have had to consume one of the two shapes already standing there, making places rarer; a place is a food source, so that is a difficulty change wearing a knowledge change's name. Three legs in four still hold a LONE animal, deliberately: that is where a first meeting is FORCED, and a forced meeting is how a species no policy would choose still gets learned.

0.25 is a starting value, not a measured one, and it shipped before it was swept exactly as `PAIR_CHANCE` did. The only guard on it is a test that both shapes stay reachable — red at 0 and at 1.

What it measured (300 seeds, both tie salts, baseline `6e99e05`; the slot cohort is every decision on a two-animal leg, the strict cohort is one where both species are unknown and both observations affordable):

- **Neither slot wins.** The leg's own draw takes 48.1% / 48.7% of the slot cohort (n=1561/1560, four scoring policies pooled) — no policy exceeds 56.6%. The slot gate passes on both salts.
- **Neither animal's knowledge wins.** Under the calibrated scorer at K\*=4 the split between the two observations is 47.3% / 47.2%, and at K=9 — where both observations outrank every resource answer — 45.9% / 41.7%. The knowledge gate passes on both salts.
- **Knowledge still loses to a resource**: 93.4% of the strict cohort goes to a resource answer. Do not set that against the place pair's 83.9% / 85.8% as though they were the same reading — different cohort, different alternatives, different denominator.
- **The instrument's ceiling, and it is the important line here.** A flat K prices every species' knowledge identically, so this sweep can only see knowledge-against-knowledge where the two observations' RESOURCE prices differ. Where they match the decision ties and the salt decides it — 34% of decisions at K\*, and 100% of the shipped policies' 76/75-decision cohort, which is why that particular figure is reported and then discarded. **Nothing here models wanting one species more than another**, and that is what `VISION.md` is actually asking for.
- **The answered mix tilted.** Every scoring policy moved +2.7 to +4.6pp toward the waxwings (2 of 2 situations feed you) and −1.7 to −4.1pp away from the red stag (0 of 2) — a spread of 8-13pp where it used to sit within 1.5pp of uniform. It has not become a codex failure: species known at arrival rose 3.27 → 3.43 and every species rose, the stag included, because a policy that wants entries declines the RESOURCE answer rather than the species. Recorded as the thing to re-measure if this rate ever goes up.

A species is learned once, so its `fieldNote` is what the codex shows no matter which situation taught it. Name no place in it. A note reading "at a hollow's mouth" has the codex describe a hollow to a traveler who watched a straw skep.

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

Every sky other than clear must close something AND open something. A sky that only subtracts is a tax, not weather, and is rejected: rain closes a scent answer and a tinder answer, and reprices a third open under the wet (`reach-in`, hp -3 to -1 in the rain); wind closes a downwind answer and a spread-cloth answer, and reprices a third open under the gust (`take-the-windfall`, food +1 to +2 in the wind).

Clear is the baseline. It is never itself authored a closure or a reprice — both are typed to the two skies that are not clear, so clear is simply what is left when neither fires, and it restores every answer and every price the other two touched.

A closed answer keeps its button and gains a reason. It never leaves the menu: a menu that reshuffles under a closed door is harder to learn than one that only explains why the door will not open.

A weather reprice must move a band or a printed number, or it does not exist on screen. HP is a three-step scale and food and preparation are exact figures (see Labels) — a reprice that shifts the underlying delta without crossing a band or changing a printed digit is invisible to the only two things a player can read.

Weather never changes what the road turns up. It only prices and closes the answers to whatever was already going to be there; a fork's own sign and the chance behind it are untouched by the sky above the leg.

The travel screen already carried a result line, a road-toll line, and a road-rule line before weather added a standing line of its own, and a playtest had already found the screen busy. Folding the sky into the fork's own sign prose was considered and deliberately deferred, not forgotten.

A forecast of tomorrow's sky was designed, built, and measured before it was ever written into a line. All thirty points of the declared rate grid failed. Precision was reachable at 0.55-0.83 across both seed sets — honest enough to word — but it fired on only 201 of 2236 encounters and changed the pick on 44 of 300 journeys, moving no outcome: worth at most +0.3pp against a declared +3pp bar. Measured worthless rather than merely unproven, it was removed rather than shipped as decoration.

The Ashfold shepherd was built on the argument that this was not that cue coming back. What was dropped was a free per-leg hint about whether tomorrow clears; what he sold was the whole standing block — today's sky, how many legs it holds, and what follows — bought with the morning's only choice, which is to say at the price of the smith, the baker and the trapper all three. A forecast nobody spends anything on and a forecast that costs every other thing the morning could have given looked like different instruments.

The village's gate then ran, and they are the same instrument. Over 300 seeds, five blind policies forced onto each villager averaged 16.3% best-ending with the smith, 14.1% with the baker, 12.0% with the trapper and 8.9% with the shepherd — choosing him cost about 7.4pp against the smith. A paired experiment, one policy consuming the forecast against an identical one ignoring it and both forced onto the shepherd, put the forecast's own worth at +1.3pp. He was cut. The village ships with three.

Note which way round the evidence runs, because it now runs the same way twice. The per-leg cue was measured against a declared bar and failed it at +0.3pp. The shepherd was a design argument until it was measured, and it failed too. Price is not what makes a forecast decide something.

---

Village

The departure morning is a fixed roster of three, never seeded. Variation comes from state, not from the menu.

Every option gives. None charges hp, food, or preparation.

The three currencies — a point of gear, a point of food, and one animal's worth of knowledge — are pairwise distinct: no villager carries more than one, pinned by test.

Gear and food each give exactly +1, and nothing else on that option moves.

It was four. The fourth read out the sky ahead and was measured and cut; the figures are in the Weather section above.

The road starts one meal short of what it used to, and that is what makes the morning a choice rather than a bonus. Measured over 300 seeds against five blind policies, the village as a free handout took a careful line's best ending from 20.7% to 34.3% and its death rate from 10.0% to 5.0% while food opportunity barely moved (59.2% to 60.3%) — a head start, not a better-fed road. So `journey.start` took a food back off it: the baker returns the traveler to the old starting line, the smith trades that meal for a point of gear, and the trapper leaves the meal spent and an animal known.

Take back ONE resource, not one per villager. Cutting preparation as well was measured and reverted: three villagers hand back one resource between them, so a start two short is still one short at the gate. Careful play fell to a 10.7% best ending and 18.7% deaths — as far past the correction as the village had been past the other way — and preparation at 1 collapsed `show-your-kit`, which needs a point HELD, from 130 offers per 300 seeds to 28, dragging `read-the-pack` from 19.0% of its offers to 9.8% and three other observations under the decoration line behind it.

The knowledge villager's species is seed-picked among the species still unknown, and materialized onto the offered option — never authored in content, because a static id has no way to know what this traveler has already learned.

With all five species known, that villager is withdrawn and the morning offers two. A recorded limitation, deliberately not compensated: a substitute reward is a new system, and more species or a second village would dissolve the limitation rather than address it.

No shop, no coin, no inventory, and one village — the state as built, not the direction. `VISION.md` puts several villages on the road, each with an inn, a shop and work, and coin to spend across them. None of it exists yet.

Villager prose keeps the NPC rules already at the top of this file.
