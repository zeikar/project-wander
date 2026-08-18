# Project Wander

> A seeded fantasy travel RPG about walking from village to village, learning what lives on the road, and leaving before you have seen everything.

---

# Vision

Project Wander is **not** a game about saving the world.

It is a game about **traveling through a world worth paying attention to.**

The player is a traveler, not a hero.

The goal is not to become strong.

The goal is to understand a little more of the world than you did last time.

The tone is quiet. A long road, small towns on it, weather, and a destination that matters far less than what happened getting there.

When players finish a run, we want them to say:

> "I want to see what else is out there."

instead of

> "That build was overpowered."

---

# Core Fantasy

You are a traveler.

You are walking a long road, and there are villages on it.

Between the villages there is weather, animals, strangers, and things people left behind.

In the villages there are beds, shops, work, and people who know things you do not.

You will not see all of it.

---

# The Shape of a Journey

A journey is a **chain**, not a road with an end:

```text
Village
  → Road
      → Village
          → Road
              → Village
                  → ... → the far destination
```

The road is where the game happens.

The village is where you decide what to spend, what to carry, and whether to stay another day.

A run ends when you reach the far destination, or when the road ends you.

The destination exists because the journey needs one. It is not the point.

---

# Design Pillars

## 1. Journey over Destination

The road itself is the game.

Travel must always be able to create a story: a fork, a sky, an animal, a stranger, a thing found.

Travel must never feel like the loading screen between villages.

---

## 2. Knowledge is the Progression

This is a **codex roguelike**. What carries across journeys is **what you know**, not what you own.

A finished journey leaves behind:

- entries in the codex
- an understanding of how animals behave
- knowledge of what a road looks like before it goes wrong

A finished journey does **not** leave behind:

- levels
- permanent stat increases
- an equipment collection
- a bank of gold

The traveler does not get stronger. The **player** does.

That puts the whole game on one bet: **the knowledge itself has to be worth having.** Three things make it so, and a fourth kills it.

### Show the locked door first

Learning something is only satisfying if you knew you were missing it.

The world should keep doing things the traveler cannot explain — an animal behaving oddly, a villager saying something that does not parse yet, a thing on the road with no obvious use. Ignorance has to be **visible** before knowledge can be a payoff.

An option that simply appears once you know the animal is not a payoff. Nobody was waiting for it.

### Deep and wide

Many animals, and many layers on each.

A species is not one fact. It is behaviour, habitat, what it wants, what it avoids, what it does under a particular sky, what it does to somebody else's food. The traveler should be able to meet the same animal on their tenth journey and still learn something.

Wide alone is a checklist you finish. Deep alone is a small world. This game wants both.

### Knowledge multiplies

Two things known together should do what neither does alone.

Knowing the bees, and knowing what wind does, is knowing when the comb can be taken. That third fact is the one nobody wrote down — but be exact about what is emergent and what is not. **The intersection is authored** (weather already reprices and closes specific options by hand); what falls out of the pair is the player's inference, not the content.

So depth comes from combination, and combination still costs authoring. Species against weather, against items, against places, against the situation they turn up in — those axes exist, but multiplying them blindly buys a large table of inert cells. **Author the intersections that change a readable decision, and leave the rest empty.** A cross-product is a budget, not a feature.

### The other trap: observation as the new answer key

Knowledge is permanent and resources are not. A traveler who is about to lose their hp and food at the end of the run anyway should, in pure metagame terms, **always stop and watch** — which makes the first meeting with any species a non-decision, exactly the way a known animal's free answer used to be.

Pricing observation against the resources of a single run does not fix this, because the run is the cheap thing.

**Layers do not fix this**, and it is worth being clear about why, because they look like they do. Splitting a permanent reward across five layers turns one automatic purchase into five. Requiring a particular sky or item is an **access condition, not a price**: fail it and there was no choice, meet it and watching is automatic again. Layers change how often the question is asked, never how it is answered.

The only thing that can outbid permanent knowledge is **other permanent knowledge.**

So the cost of watching this animal has to be **not learning something else.** Then observation competes with itself, and a traveler can pass something by knowing exactly what they are giving up.

Concretely, and as one rule rather than three: **a leg can hold more than one thing worth knowing, and the traveler resolves exactly one of them.** The animal and the place are both there, both readable, and choosing either ends the leg.

No global clock, no daylight meter, no separate time resource. The existing shape already carries this — one choice completes a leg — and the whole cost is that the other thing was standing right there. Adding a time budget instead would drag the run's end condition and every village's rules along with it, for a decision the leg can already express.

This was an argument. It has now been tested once, in its smallest form: some legs put a place beside the animal and the traveler answers only one of them. Over 300 seeds the place takes that leg on **83.9%–85.8%** of eligible decisions — under the 90% line that would have called it a non-decision, but only just, and one policy fails outright. Give a scorer an explicit price on knowledge — roughly one and a third meals — and the same leg goes to **about half**. So the mechanism works and nothing in the game currently makes it work: a traveler who values only resources walks past the animal almost every time.

A place teaches nothing, though, so what that priced was knowledge against a **resource**. So a second leg shape was built where both sides teach: two animals of different species, answer one, the other is gone. Neither side wins it — no slot takes more than 57% of those legs, and where a scorer prices knowledge at all the two observations split it near evenly at every price tested. **What the pillar asks for holds, as far as this can see it.**

How far that is, said plainly: every instrument here puts the same price on every species' knowledge, so it can only tell the two observations apart by what they cost in food and blood. **Wanting the boar more than the bees is not something anything in this game can yet express** — and until it can, "knowledge against other knowledge" is being tested with the interesting half held constant.

That was the next thing to build, and the half of it that gives knowledge somewhere to differ now exists: the codex learns a species in **rungs**, so a price finally has a cell — a (species, rung) — to attach to. A probe that pays a scorer a premium for one cell moves that cell's uptake by 55-66pp while leaving the same species' other cell bit-identical to the anchor, which is locality with a mechanism behind it rather than luck — but at the 300 seeds the test declared, the four rung-2 cohorts were 8 to 26 decisions wide, so **the declared gate could not be powered and the verdict is inconclusive-for-size**; a supplementary 3000-seed run, outside the declared set and so supporting evidence rather than a pass, clears the bar on every rung-2 cell on both salts. Scope that for exactly what it is: two rungs is the mechanism shown to be expressible, not the tenth journey delivered, and the deeper authoring that would deliver it is the named follow-on — itself a road rebalance, with every baseline in `docs/CONTENT.md` to measure again.

### The trap: an answer key ends the game

Knowledge must be an **edge, not an answer.**

Knowing an animal should **open a choice, not settle one.** The moment a known species has one correct button, the encounter is over before it starts — and once the codex is full, so is the game.

This is not a theory, and the history is worth keeping straight. Carrying the codex between journeys once collapsed every later run into one fixed table of answers, matching on 300 of 300 seeds — and the first diagnosis, that persistence was the culprit, was wrong. The actual cause was that a known animal's answer cost nothing and beat every alternative on every axis, so knowing an animal **ended** its encounter instead of informing it. Once knowing widened the menu rather than settling it, the codex could persist safely. That is how it ships today.

---

## 3. Villages are Punctuation, not Refuge

A village is where the journey takes a breath.

A village offers:

- a bed, for as much of your health back as you are willing to pay for
- goods, for what you can afford
- work, for coin and for a reason to be here
- people, who know things

A village **may** put a traveler back on their feet completely. What it must never do is give it away.

The rule is a **price, not a cap**: full recovery is on the shelf, and it costs enough that taking it is giving up whatever else the purse could have bought. A traveler who arrives wrecked can leave whole and leave poor. That is a decision. An arbitrary ceiling on healing is not.

This works because hp is not what carries the journey's arc — **the road is.** What cannot be recovered in a village is the thing walked past three legs ago, and no amount of coin buys that back. So resetting hp costs the run nothing it needed.

The one thing to watch is the leg before a gate, where damage is nearly free. The price is what answers it: arrive in pieces and the purse empties on the bed, so there is nothing left for the shelf.

Ashfold is the precedent for the **shape** — one morning, exactly one of three people — and for nothing more. It has never tested an inn, a shop, work, coin, or a visit made of several actions, so it proves that an exclusive choice works, not that a visit budget will. A village should still be a **bounded number of choices**; staying longer is one of the things that number is spent on.

---

## 4. What is Lost

The pressure in this game is **not** starving to death.

The pressure is **passing something by.**

A journey should be able to end with the traveler alive, well fed, and quietly aware that they walked past a thing they will now never know about.

The codex is the record of what you did not miss.

Death should exist. It should not be the main thing at stake.

---

## 5. Small Stories over Epic Destiny

Personal stories over world-ending ones:

- a villager who wants something found
- a night out of the rain
- an animal doing something you did not expect
- someone met once, on one road, who does not come back

These are the moments the game is made of.

---

## 6. AI Makes People Feel Alive

AI exists to make characters and places believable.

AI generates:

- village people and their talk
- how a quest is asked for
- companion and NPC reactions
- rumors
- descriptions of a specific moment
- the account of a finished journey

AI does **not** decide:

- what an option costs
- whether something worked
- what a quest rewards
- what the codex learned
- anything that is saved

> Code decides what happened. AI decides how it is described.

The game must be fully playable with AI turned off.

---

## 7. Every Journey is Different

Runs are seeded and reproducible.

What varies between journeys:

- which villages are on this road, and how far apart
- weather
- which animals, in which situations
- what work the villages have
- what is found on the road

The player should always wonder:

> "What kind of journey will I have this time?"

---

# Resources

Keep the count small. Every resource must create a decision, not a chore.

| Resource | What it is | Where it is spent |
|---|---|---|
| **HP** | what the road takes out of you | encounters, hungry legs |
| **Food** | what keeps the road from taking it | every leg walked |
| **Preparation** | what you are carrying and ready to use | encounter options that need kit |
| **Coin** | the only thing hp and capability share a price on | **villages only** |

## Why coin exists

The road already trades these against each other — a cache swaps preparation for food, a comb costs blood and pays in meals — but only **where and when the road happens to offer it.** A wounded traveler carrying a full pack cannot decide to convert; they can only wait to be offered.

**Coin is that conversion made reliable, and it happens in villages.** A night at the inn or a thing on a shelf — one purse, two ways to spend it, at a place you chose to walk to. Liquidity is the job, not the existence of the trade.

This is also where coin is most likely to fail. The standing hypothesis: **a shelf that sells food turns coin into a food voucher**, and it inherits food's dominance the way every food-bearing option in this game has so far. Whether a bed can compete with a meal is unknown and has to be measured, not asserted. **What the shelf sells is the decision that makes or breaks coin.**

## The rule that keeps coin honest

**Coin cannot be spent on the road.**

There is nothing to buy between villages. Coin is stored purchasing power for the next gate — worth carrying, but useless where the journey actually happens. That is what keeps the road about what you carry rather than what you can afford.

It is a weaker guarantee than it looks, and the doc should not overstate it. Weightless stored value is still value, so coin does not stop being a resource out there; it only stops being usable. Whether that is enough to keep it from becoming a second, blurrier food depends entirely on what the shelf sells.

Do not let coin solve an encounter. Ever.

## Resources we are not adding

Thirst, temperature, fatigue, morale, encumbrance, durability, disease, food spoilage.

Not unless play demonstrates a specific need. Each one is a chore until proven otherwise.

---

# The Codex

The codex is a travel journal, not a collection.

It records what the traveler learned about a **species** — not about one meeting with one. What you learn about an animal holds wherever that animal turns up.

An entry is not a single fact. It fills in over many journeys, a layer at a time, and an animal met often should still have something left to give.

Codex knowledge may unlock:

- a way through that the traveler could see but not take
- an explanation for something the road kept doing
- a better reading of what is on a road before walking it
- something to say to someone who also knows

Codex entries that exist only to be collected do not belong here.

**The codex persists across journeys. Nothing else does.**

## The full codex is a design target, not an accident

The codex is finite, because everything authored is finite. Pretending otherwise just makes "unlocks you have not got yet" into the retention mechanism, which is exactly what the success metric below refuses.

So the saturated state has to be **designed for, and it has to be the best version of the game.** A traveler who knows everything should not run out of reasons to walk; the road should simply be more legible to them — signs that meant nothing now mean something, and a journey they would once have survived they can now read.

**Knowledge stops being the reward and becomes the lens** — and that has to be a loop, not a mood. Here is the concrete one:

> Ignorance sees **that** there is a choice. Knowledge sees **what it costs.**
>
> Every traveler can tell there is something on both ways — that much has to be legible from the first journey, or the fork is not a choice at all. What ignorance cannot do is price it. A traveler who knows everything sees that this fork holds two things **worth having**, knows roughly what each is worth, and knows which one is not going to happen today.

So the full codex does not empty the *What is Lost* pillar — it is what finally makes it bite. Early journeys lose things vaguely: you knew you were passing something. Late journeys lose them **exactly, on purpose, and that is the harder game.** What varies underneath is the seed: which villages, which weather, which animals in which situations, what work was going.

There is already a counterexample shipping. Learn every rung of every animal — nine of them, since the codex went layered — and the departure morning **withdraws** the trapper, offering two choices instead of three, so the saturated state is strictly worse than the ignorant one. Layers moved that state further off (a measured median of journey five instead of journey three) without removing it, which is the point worth keeping: **postponing the failure is not fixing it.** A substitute was then built for that slot and taken back off: a craft bought on the saturated morning that made every night on the road give more back, measured at **+0.0pp** of best ending on both tie salts against the +1.3pp line that cut the shepherd, and costing about 11pp against the smith to take it under `historical` (300 seeds each; the instruments are named in `docs/CONTENT.md` § *Village*). The reason it failed is structural rather than a matter of tuning — nights are rare (0.31 rests a journey) and a traveler rests nearly full, so the recovery ceiling eats the bonus, and a larger one lands on the same nights. **The ledger is closed at this village size:** what the morning can pay out of gear, food, a rung and a night has been tried, and a substitute reward now belongs to the villages, inns, shops and work this file describes and the game does not yet have. So the withdrawal still ships. That is the failure this section exists to forbid. Every system should be checked against a full codex before it ships.

---

# Animals and Monsters

The codex holds two kinds of thing, and the difference between them is **whether ordinary sense is enough.**

| | Ordinary sense | What the codex is worth |
|---|---|---|
| **Animals** | enough — you can guess and be right | knowing makes a good guess better |
| **Monsters** | **not enough, and the creature says so** | knowing is what turns a warning into an answer |

An animal behaves the way a player already expects a boar or a wolf to behave. That is a strength — the player arrives with priors and the road can play against them — but it caps how strange the world can get. Nobody is astonished by a wolf.

Monsters are where the world stops explaining itself. A creature with no real-world counterpart is the locked door the pillar above asks for: it does something inexplicable in front of you, and the framework for it arrives journeys later.

That makes the codex worth **more** on a monster than on an animal, which is where the deepening comes from. The further down the road, the more of what you meet is the kind of thing you can be wrong about.

## Monsters are a knowledge problem, not a combat problem

The material is not the creature's strength. It is that **the traveler's ordinary reading of the situation is wrong** — and that being wrong is survivable only if the creature says so first.

A misread nobody could see coming is not a lesson, it is a gotcha. This project already measured that **a choice the player cannot read is not a choice**, and a monster that punishes ordinary sense without warning breaks exactly the rule the roads were fixed to obey.

So the anomaly is readable on sight: an animal doing what no animal does, a quiet where there should not be one, a shape that is nearly right. And it must say **what kind of wrongness** — that this thing is not hunting, or is not alone, or is not what it is imitating. The precedent is the road signs, which name a kind and never a species, measured to recover almost all the value of naming the animal outright. A warning that says only "something is off" gives every monster the same two buttons: watch it, or leave.

What the traveler still cannot read is *why* — the mechanism, the rule behind it, what it means for the next one of these. That is the locked door, and it opens journeys later.

The test, then:

- An **animal** is something you can guess at, and be right.
- A **monster** tells you, before it costs anything, **which of your guesses is unsafe** — and not yet why.

A monster earns its place by being misreadable **in a way it warned you about**, not by having more hp.

Two failure modes to hold the line against:

- **A monster that is an animal with bigger numbers.** Then it is decoration. The difference must be in **kind**, never in size.
- **Genre gravity.** Players see a monster and reach for a weapon. This is a real cost, not an imagined one. The answer is not to forbid fighting — it is to make sure the one who read the other correctly is the one who walks away.

---

# Villages

Each village should be a place, not a menu with a name on it.

What a village can hold:

- **an inn** — health back, for coin and for a day
- **a shop** — a short shelf, not a catalogue
- **work** — a small job with a reason behind it, paying coin
- **people** — who talk, and who know one thing worth knowing

A village visit is a **budget**, not a shopping trip: a fixed number of things you may do before the road takes you again. You should not be able to buy everything on the shelf, and choosing is the point.

Staying longer is one of the things the budget buys — never a way to escape it.

---

# Combat

Combat exists. Combat is not the focus.

The traveler should usually be able to:

- watch
- avoid
- prepare
- use the right thing
- leave

Fighting should be one of several honest answers, and rarely the best one.

**A monster is not a reason to build a combat system.** What turns this into a combat game is not what stands in the road, it is the shape of the resolution — one read-and-choose becoming rounds of trading damage. Whether an encounter should ever run more than one step is a separate decision, to be taken on its own merits and not drifted into.

---

# Travel

Travel is the main gameplay.

Travel includes route choice, weather, encounters, camping, foraging, things found, and people met.

Travel is the quest.

---

# What We Have Learned

These were expensive. Do not re-learn them.

Every figure below was measured on the loop that exists today — an eight-leg road, one village, five species, one arrival gate. **The lessons carry; the numbers do not.** A chain of villages with coin and layered knowledge is a different system, and it needs its own baselines before any of these rates are quoted at it.

- **Information is worth nothing if it cannot change a decision.** Two informational features were built, measured, and cut — a per-leg weather cue worth +0.3pp and a villager who read the sky ahead, worth +1.3pp against the 7.4pp that choosing him cost.
- **Whatever gives the binding resource wins everything.** An option worth 3 food was taken on 99.8% of its offers and left the three options beside it under 3%. A new choice must offer a different **kind** of trade, not a bigger one.
- **A choice the player cannot read is not a choice.** A fork was worth 2.7 points when it only said what the roads were like, and 17.3 when it said what was on them today.
- **Knowledge that settles an encounter destroys it — and the blame lands in the wrong place.** A persistent codex collapsed every later run into one fixed table of answers, matching on 300 of 300 seeds. Persistence took the blame; the real cause was that a known animal's answer was free and dominant. Knowing has to widen the menu, never shorten it.
- **The simulation measures defects, never fun.** It finds dominant strategies and dead options. It cannot tell you whether anyone wants a second journey.

---

# Things We Intentionally Avoid

- levels, XP, and stat growth
- equipment tiers and loot tables
- large inventories
- crafting
- giant open worlds
- villages that heal for free (healing fully is fine; healing without giving something up is not)
- coin that solves encounters
- knowledge that ends encounters instead of opening them
- monsters that are animals with bigger numbers
- generic engine architecture, ECS, plugin systems
- building tools before building the game

Ship gameplay first.

---

# Prototype Scope

Small enough to finish, long enough to have a shape.

- three or four villages on one road
- a far destination
- **the five species that already exist, and no new ones** — each met in more than one situation, and known in layers
- an inn, a shop, and work in each village
- a handful of items
- coin
- weather
- the codex, persisting across journeys
- roughly 30 minutes per journey

**Build the layers before the species list**, and add no animals at all until they work. Depth is the part that can be got wrong, and a layer structure that fails will have to be unwritten from every species carrying it.

Widening is not a content drop, either. The road picks a **species** first, so every animal added directly lowers the rate at which any one of them is met twice — and meeting the same animal twice is the input layers live on. Adding situations moves the per-species feeding ratio, which is the largest difficulty lever in the game. **Adding a species or a situation is a rebalance of the whole road, and needs the baselines re-measured.**

The long-term want is still many animals, each deep. The prototype is how to earn the right to write them.

The objective is not content.

The objective is a loop worth repeating.

---

# Architecture Philosophy

Game logic is deterministic and seeded.

Separate: game rules, content, UI, AI.

The core imports no React, no DOM, no network, no clock, no `Math.random`.

AI never modifies game state.

---

# Success Metric

A successful prototype is one where the player starts another journey immediately — and **not** because there is something left to unlock.

Because there is something left to find out.

---

# Development Principle

When there are several ways to build it, prefer:

- simpler
- smaller
- more playable
- easier to change

over

- more generic
- more scalable
- more abstract

Prototype first. Measure second. Optimize last.
