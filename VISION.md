# Project Wander

> A procedural AI-assisted fantasy travel RPG focused on exploration, discovery, and memorable journeys.

---

# Vision

Project Wander is **not** a traditional RPG about saving the world.

It is a game about **traveling through a fantasy world because the world itself is worth exploring.**

The player is an adventurer driven by curiosity rather than destiny.

The goal is not to become the strongest hero.

The goal is to experience many different journeys.

When players finish a run, we want them to say:

> "That was a great journey."

instead of

> "That build was overpowered."

---

# Core Fantasy

You are a young adventurer.

You leave your hometown simply because the world is larger than you imagined.

You travel through villages, forests, ruins, mountains and forgotten roads.

You meet strangers.

You discover creatures.

You solve problems.

You slowly learn how this world works.

---

# Design Pillars

## 1. Journey over Destination

The destination exists only because the journey needs one.

The road itself is the game.

Travel should always create stories.

Examples:

- choosing different routes
- random encounters
- weather
- camping
- companions
- villages
- unexpected discoveries

---

## 2. Discovery over Grinding

The game rewards curiosity.

Players should constantly discover:

- new places
- new monsters
- new NPCs
- new stories
- new solutions

The game should never become repetitive monster farming.

---

## 3. AI Makes People Feel Alive

AI exists to make characters believable.

AI should primarily generate:

- NPC dialogue
- companion dialogue
- quest descriptions
- rumors
- reactions
- storytelling

AI does NOT control gameplay rules.

Game rules are deterministic.

---

## 4. Small Stories over Epic Destiny

Personal stories are more important than saving the world.

Examples:

- helping a lonely villager
- camping during rain
- finding an abandoned tower
- protecting a traveling merchant
- discovering an unknown creature

These moments should be memorable.

---

## 5. Every Journey is Different

Every run should feel different.

Randomization should affect:

- regions
- NPC relationships
- monster traits
- quests
- encounters
- companions

The player should always wonder:

> "What kind of journey will I have this time?"

---

# Player Fantasy

The player is NOT:

- The chosen one
- A legendary hero
- A king
- A god

The player IS:

- an adventurer
- a traveler
- a curious explorer

---

# Core Gameplay Loop

Accept Journey

↓

Travel

↓

Encounter

↓

Make Choices

↓

Camp

↓

Continue Journey

↓

Complete Objective

↓

Return

↓

Start Another Journey

---

# AI Philosophy

AI is a storyteller.

AI is NOT the game engine.

The engine determines:

- combat
- rewards
- resources
- probabilities
- progression
- world state

AI generates:

- dialogue
- descriptions
- personalities
- emotional reactions
- flavor text

If AI is disabled, the game must still be fully playable.

---

# Monster Codex

The codex is not just a collection.

It is a travel journal.

Players gradually learn:

- appearance
- behavior
- habitat
- weaknesses
- drops
- ecology
- myths
- cultural knowledge

Knowledge should unlock gameplay options.

Not just information.

---

# Combat

Combat is important.

Combat is NOT the focus.

Players should often be able to:

- avoid
- observe
- negotiate
- lure
- prepare

instead of simply attacking.

---

# Travel

Travel is the main gameplay.

Travel includes:

- route planning
- resource management
- camping
- conversations
- weather
- encounters
- exploration

Travel should never feel like walking between quests.

Travel IS the quest.

---

# Resources

Keep resources simple.

Initial prototype:

- HP
- Food
- Preparation

Avoid complex survival mechanics until the core gameplay is proven fun.

---

# Prototype Scope

Build the smallest possible game.

One village.

One companion.

Three monsters.

One quest.

One destination.

20-minute playtime.

The objective is NOT content.

The objective is validating the gameplay loop.

---

# Architecture Philosophy

The game should be data-driven.

Separate:

- Game Rules
- Content
- UI
- AI

Game logic must be deterministic.

UI should only render state.

AI should never modify core game rules.

---

# Things We Intentionally Avoid

- giant open worlds
- MMORPG systems
- complex crafting
- massive inventories
- generic engine architecture
- ECS before necessary
- overengineering
- "future proof" abstractions
- building tools before building the game

Ship gameplay first.

---

# Success Metric

A successful prototype is one where players voluntarily start another journey immediately after finishing the previous one.

Not because they want better loot.

Because they want another adventure.

---

# Development Principle

Whenever there are multiple implementation choices, prefer:

- simpler
- smaller
- more playable
- easier to iterate

over

- more generic
- more scalable
- more abstract

Prototype first.

Optimize later.