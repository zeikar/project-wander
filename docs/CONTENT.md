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

Five species. Two of them give food.

That ratio is not flavour. Adding cost-shaped animals thins the share of encounters that can feed you, and an eight-leg road runs on food.

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

Each leg carries three signs — what an animal ahead looks like there, what a stopped traveler looks like there, what empty looks like there — in that leg's own terrain.

A sign names a KIND, never a species. Naming the creature was measured and it does not hurt the codex — the repeat rate holds. It simply buys almost nothing: the kind is worth 48.3% of seeds against 51.7% for the species, and a print in the mud does not tell you what to call the animal.

A sign must be true. It is computed from the same band the road then walks, so it cannot promise something the leg does not deliver.
