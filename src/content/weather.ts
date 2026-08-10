// The sky over one leg of the road. Like journey.ts and encounters.ts this
// owns its own types and imports nothing: content is the bottom of the
// dependency chain. `core/weather.ts` reads this module to derive a script,
// and both the reducer and the UI read that script — the sky reprices and
// closes encounter options, and the three screens a traveler passes through
// on the road (the village morning, the leg, the encounter) each state the
// line below.
export type Weather = "clear" | "rain" | "wind";

// How many legs one weather holds before the sky changes. Long enough to be
// worth noticing — a single-leg weather would read as noise, not a spell of
// bad road — short enough that an eight-leg journey never sees only one sky
// the whole way.
export const WEATHER_MIN_LEGS = 2;
export const WEATHER_MAX_LEGS = 4;

export interface WeatherProse {
  line: string;
}

// One line per sky. Clear is given its own line rather than left blank on
// purpose: a slot that only appears for rain and wind is harder to learn
// than one that is always there and simply has nothing to report.
//
// A forecast cue for rain and wind — a lean on whether tomorrow's sky would
// clear — was designed, built, and measured (Task 5's grid, both seed sets)
// before this line was written. Precision was reachable: 0.55-0.83 across
// the grid, honest enough to word. But it fired on only 201 of 2236
// encounters and changed the pick on 44 of 300 journeys, and none of those
// changes moved an outcome — worth at most +0.3pp against a declared +3pp
// bar. Measured worthless, not merely unlocked, so it was removed rather
// than shipped as decoration nobody's choice depended on.
//
// The Ashfold shepherd was the argument that a forecast BOUGHT with something
// would be a different instrument: not a free per-leg hint, but the whole
// standing block — opening sky, how long it holds, what replaces it — paid for
// against a loaf and a mended strap. He was built, and then measured, and the
// argument did not survive it. Over 300 seeds, five blind policies forced onto
// each villager averaged 16.3% best-ending with the smith, 14.1% with the
// baker, 12.0% with the trapper and 8.9% with him; a paired policy that
// consumed the forecast against an identical one that ignored it, both forced
// onto the shepherd, put the forecast's own worth at +1.3pp against the 7.4pp
// the choice cost. Price does not make a forecast decide anything. Both are
// gone, and this line — a statement of today, never of tomorrow — is what the
// game says about the sky.
//
// AUTHORING RULE: a line may state only physics true of every option in the
// shipped pairing (encounters.ts AND events.ts — both feed `findScene` in
// reducer.ts, and a line auditing only one of them would miss the other
// half of the scenes it has to hold true of) — a line that claims a closure
// some option quietly keeps open teaches the player a rule the game then
// breaks.
//
// rain closes: `scatter-bait`, `bait-a-trace` (both read a SCENT) and
// `smoke-them`, `smoke-it-out-of-the-hollow`, `smoke-them-off-the-kill`,
// `smoke-a-path`, `smoke-the-skep` (all five spend TINDER) — EXCEPT
// `light-torch`, a pitch torch, named outright rather than left for the
// closure to imply away, because that one option stays open under rain.
// wind closes: `net-the-fall` (spreads a groundsheet to catch what falls),
// `wave-your-kit` (spreads the same groundsheet to look large),
// `sheet-over-the-coping` (spreads it over a wall top to climb) and
// `beat-the-hedge-over-your-sheet` (spreads it at a hedge foot to catch) — all
// four keep something spread out — and `wait-downwind` (the traveler working
// FROM downwind). It also adds one thing rain does not: it can work loose
// whatever is hung, which is what `cut-down-the-hang` at the old camp
// already depends on finding hanging in the first place.
//
// The wind line's downwind clause is scoped to what the TRAVELER can WORK
// FROM, not to whether downwind facts exist at all. `count-the-litter-from-
// cover` reads the SOW's own positioning relative to her litter — a fact
// about HER, not a vantage the player is using — and stays open under wind,
// so a clause claiming downwind cannot be trusted AT ALL would contradict
// that option's own result text on the same screen. "No downwind worth
// working from" covers the closed option and leaves the open one alone.
export const weatherProse: Record<Weather, WeatherProse> = {
  clear: {
    line: "No rain to spoil a scent, no wind to spoil a reading — only ordinary road today.",
  },
  rain: {
    line: "Nothing carries a scent in this, and no tinder will smoke — only pitch burns wet.",
  },
  wind: {
    line: "No downwind worth working from, and nothing spread out would stay put — though the wind shakes loose what hung.",
  },
};
