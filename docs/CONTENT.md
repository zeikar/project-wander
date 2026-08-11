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

---

Animals

Five species, met in twelve situations. A species is picked first and one of its situations second, so giving an animal more ways to be met splits its own share and never makes it commoner.

How often the road can feed you is therefore an average of per-species RATIOS, not a count of scenes. It ships at 50.0%, and a test pins both the ratios and the average:

| species | situations | of which feed you |
|---|---|---|
| boar | 3 | 1 — the wallow |
| wolves | 2 | 1 — the kill |
| bees | 3 | 2 — not the robbed hollow |
| waxwings | 2 | 2 — this is the second food source |
| red stag | 2 | 0 — a cost animal wherever he is met |

That ratio is not flavour, and it is the largest difficulty knob in the game. Adding situations to an animal that ALWAYS feeds you dilutes the share and makes the road harder; adding a feeding situation to a cost animal does the reverse. Measured over 300 seeds against five blind policies: the wolves' kill took the share from 55.6% to 64.5% and careful play from a 17.7% best ending to 30.3%; the three bee and waxwing situations brought it back to 59.2% and 20.7%. Decide the target BEFORE authoring, or the scenes decide it for you.

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
