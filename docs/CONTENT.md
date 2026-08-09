NPC

Never exposition dumps.

Talk like real travelers.

---

Villages

Should feel lived in.

Never exist only for quests.

---

Monsters

Should feel like animals.

Not evil by default.

---

Encounters

Every encounter carries one `codex: "teaches"` option and one `codex: "requires"` option.

They share a menu slot: the observation is offered until the species is known, what it unlocks only after.

Every encounter also carries a `fieldNote` — the one thing watching it taught, in the traveler's words.

An observe option must be strictly worse in deltas than the encounter's best comparable answer.

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

Five species, met in nine situations. A species is picked first and one of its situations second, so giving an animal more ways to be met splits its own share and never makes it commoner.

Three species can feed you, and one of them — the wolves — only in one of its two situations.

That ratio is not flavour. Adding cost-shaped animals thins the share of encounters that can feed you, and an eight-leg road runs on food. It moves in both directions: the wolves' second situation lifted the share of encounters offering food from 55.6% to 64.5%, which is a difficulty change, not a content addition.

A second situation is worth authoring when it poses a DIFFERENT decision, not when it dresses the same one. Two shapes have earned it so far — a scene where nothing is in your way and the question is whether to take a risk at all (`wallow-boar`, `wolves-at-a-kill`), and a scene where the animal's known answer has nowhere to go (`sow-and-litter`, whose sow will not follow her nose off the road; `walled-lane-stag`, whose lane has no uphill).

An observation must be strictly dominated by an option that is always offered. That gap is the price of the knowledge.

`read-the-pack` was the weakest observation in the game at 10.3% of its offers, and the fix was on the payoff side rather than the price: `show-your-kit` was the only `requires` option asking for two preparation HELD, which an eight-leg road spends. At one it is offered 130 times across 300 seeds instead of 59, and `read-the-pack` reaches 19.0%.

It was not lowered to zero, which measured better again at 20.4%. `requiresPreparation` would then have exactly one consumer left — the state a playtest already found registers with nobody — and the label promises a kit to show.


---

Labels

Food and preparation are stated as exact numbers, in both directions.

HP is never a number. It is a scale with three steps — a little blood, blood, a lot of blood — hinged on the one HP figure the game does state outright: what a leg costs when there is nothing left to eat.

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
