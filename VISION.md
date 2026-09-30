# Wander

> A seeded, text-first travel game about walking across a region you do not know yet, learning what lives on the road, and arriving somewhere because you finally understood how to.

This is the second start. The first prototype is kept at the `v0-prototype` tag; what it taught is at the bottom of this file.

---

## The fantasy

You are a traveler, not a hero. The world is not in danger. It is simply larger than you imagined, and worth paying attention to.

The tone is quiet: roads, weather, animals, a few people, and a place you heard about.

When a journey ends, the player should want to set out again — **not because something unlocked, but because there is something left to find out.**

---

## One journey

1. In the village you hear a few rumours. Each one is a place at the far edge of the map.
2. The region is a map made fresh from a seed. Every day you choose the next road. From a day away you can see only a **sign** — tracks, smoke, a silence.
3. Where the road takes you, something is going on: an animal, a place, a sky. You read it and choose.
4. The journey ends when you reach one of the far places, or when the road ends you.

## What carries over

**Only what you know.** No levels, no gear, no gold. The traveler does not get stronger; the player does.

Knowledge works as a lens, in three ways:

- **Signs** on the map name what made them.
- **Tells** in a scene — a boar with its nose down, wolves matching your pace — read as what they mean, and an option you could only guess at shows what it will cost.
- **New answers** appear that only someone who knows would think of.

And the far places themselves: arriving is not the same as seeing. The white stag comes to the lake at dawn, from one side, and only the traveler who knows how deer come to water will see it. The rumour is the locked door; knowledge is the key; and the journey that missed it tells you what kind of thing you were missing.

---

## Pillars

**The road is the game.** Every day is a choice between roads you can partly read. No loading screens between villages.

**Reading, not arithmetic.** A decision should turn on understanding what is in front of you, not on adding up three numbers. Resources exist to give choices weight — two of them, hp and food — and stay small.

**Knowledge opens choices, it never settles them.** Knowing an animal should show you what things cost and add a new way through. It must not leave one correct button.

**Something is always left.** A journey should be able to end with the traveler alive, fed, and aware of exactly what they walked past.

**Small stories.** An animal doing something you did not expect. A note on a shepherd's wall. Someone met once.

---

## The look

A two-colour field guide: black ink on uncoated paper, and one spot colour per animal. The spot colour belongs to knowledge alone — a tell the traveler cannot read yet is printed a hair out of register, and knowing the animal brings it into line. On a wide screen the map, the day and the notebook sit side by side, like a spread of the guide.

---

## Open questions

- **Should the far places be villages?** v0 imagined a chain of villages with the destination as one more town; v1 made them sights you have to know how to see. Nothing built yet depends on the answer — a destination is just a node.

---

## AI, if it comes

AI may describe people, moments and journeys. It never decides what anything costs, whether it worked, or what was learned. The game must be fully playable without it.

---

## What we deliberately avoid

- levels, stat growth, equipment tiers, loot tables, crafting
- more resources than the choices need
- knowledge that ends encounters instead of opening them
- monsters that are animals with bigger numbers
- engines, plugin systems, editors — build the game, not a tool

---

## What the first prototype taught

The first version shipped seven milestones without anyone playing it, and measured everything except whether it was fun. These are the lessons worth keeping:

- **A choice the player cannot read is not a choice.** A fork was worth 2.7 points when it described the roads, 17.3 when it said what was on them today.
- **Whatever gives the binding resource wins everything.** An option worth 3 food was taken 99.8% of the time. A new choice must offer a different *kind* of trade, not a bigger one.
- **Knowledge that settles an encounter destroys it.** A persistent codex once collapsed every run into one table of answers — because a known animal's answer was free and dominant.
- **Information is worth nothing if it cannot change a decision.** Three informational features were built and cut for this.
- **Say what a choice gives, not only what it costs.** An option whose payoff was unlabelled read as pure loss, and players skipped it even where it paid.
- **Same road every journey kills the second journey.** Variety has to be structural, not just which animal turns up.
- **No simulation replaces a person playing.** Sweeps find broken numbers; only playing finds whether it is worth playing. Every milestone now ends with someone playing it.
