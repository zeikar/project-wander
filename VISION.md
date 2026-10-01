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

1. You set out from a village you know, and hear a few rumours there. Each one is a place at the far edge of the map.
2. The region is a map made fresh from a seed. Every day you choose the next road, from at least two; roads may cross. From a day away you can see only a **sign** — tracks, smoke, a silence.
3. Where the road takes you, something is going on: an animal, a place, a sky. You read it and choose.
   Every day has a sky and a wind, and tomorrow's is shown over the map. The wind carries your scent ahead or behind; rain keeps it from carrying and puts out fires; fog hides what is on the roads but not their names — and a name is only the lie of the land, a wood or a waterside that more than one thing can be waiting in. An animal you know plus a wind you can read is a day you can see coming.
4. The journey ends when you reach one of the far places, or when the road ends you.

## What carries over

**Only what you know.** No levels, no gear, no gold. The traveler does not get stronger; the player does.

Knowledge works as a lens, in three ways:

- **Signs** on the map name what made them.
- **Tells** in a scene — a boar with its nose down, wolves matching your pace — read as what they mean, and an option you could only guess at shows what it will cost.
- **New answers** appear that only someone who knows would think of.

And the far places themselves: arriving is not the same as seeing. Every map holds, somewhere, a road where each far place's key can be learned. The white stag comes to the lake at dawn, from one side, and only the traveler who knows how deer come to water will see it. The rumour is the locked door; knowledge is the key; and the journey that missed it tells you what kind of thing you were missing, and where on this map it was — a road you walked past, or one you turned from at a fork, ringed on the map — or that this map had nowhere to learn it.

The far places remember you. Coming back is told as a return: a second miss comes closer to what was missing without saying it, and a second sight shows something the first did not.

## Regions

The world is a chain of regions. Each has its own village, its own animals and places, its own far places, and its own weather.

A region opens through one sight. Arrive at that far place and see it, and you find the way onward. The way is something you know, so it is written in the notebook and kept like a fact.

A journey starts from any village you know. The first region stays playable.

## Animals and monsters

An animal is something you can guess at and be right. Knowing it shows what things cost and adds a way through.

A monster is where ordinary sense is wrong. The creature tells you which guess is unsafe before it costs anything; the warning is there even before you know how to read it. Knowing turns the warning into a resource, and it is still a trade. A monster is never an animal with bigger numbers.

## The marsh

Past the lake where the white stag drinks, a ferry landing opens onto the marsh. Fog is its weather, and it hides the roads more often than in the fields.

A grey heron stands where the water is knee-deep. Otters keep fish under the banks and raid a pack left down at night. The marsh lantern is a light that looks carried and is not: followed at night it leads into deep water, and at dawn it settles only on firm ground.

What lies beyond is only glimpsed — low hills past the lantern shoal, at dawn. No way leads there yet.

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

- **Should the far places hold people?** Partly settled by regions: each region now begins at a village, and a region's gate is a sight, not a town. What stays open is whether a far place should ever be somewhere with people in it — a village to arrive at, not only a thing to see.

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
