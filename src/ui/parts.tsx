import { useEffect, useState } from "react";
import type { Dispatch, ReactNode } from "react";
import { findScene } from "../content/scenes";
import { species, speciesOfFact } from "../content/species";
import type { RegionId, SpeciesId, Weather } from "../content/types";
import { MAX_FOOD, MAX_HP } from "../content/world";
import type { MapNode } from "../core/map";
import { knowsSpeciesOf } from "../core/reducer";
import type { GameAction, GameState } from "../core/state";
import type { Strings } from "../i18n";
import { resultText } from "../i18n";
import { useStrings } from "./strings";

// Each animal is printed in its own spot colour, the way a field guide gives
// every plate one ink besides black. Only knowledge uses it.
export function spot(id: SpeciesId | undefined): string {
  return id === undefined ? "" : `spot-${id}`;
}

// Whether the window matches a media query, kept current as it resizes.
export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

// Wide enough for the notebook to stand open in its own column. Narrower, it
// folds, so the day in front of the traveler still fits in one view.
export const ROOMY = "(min-width: 1360px)";

// The screen's five parts. On a phone they stack in reading order. Wider, the
// map takes the left column and the story and choices the right; widest, the
// notebook gets a column of its own, like notes in a margin.
export function Layout({
  kind,
  status,
  story,
  map,
  choices,
  notes,
}: {
  kind: "map" | "scene" | "end";
  status?: ReactNode;
  story: ReactNode;
  map: ReactNode;
  choices: ReactNode;
  notes: ReactNode;
}) {
  return (
    <div className={`layout layout--${kind}`}>
      {status && <div className="area-status">{status}</div>}
      <div className="area-story">{story}</div>
      <div className="area-map">{map}</div>
      <div className="area-choices">{choices}</div>
      <div className="area-notes">{notes}</div>
    </div>
  );
}

export function StatusBar({ state }: { state: GameState }) {
  const { ui } = useStrings();
  return (
    <header className="status">
      <span className="day">{ui.day(state.day)}</span>
      <span className="stats">
        <span>{ui.stat(ui.hp, state.hp, MAX_HP)}</span>
        <span>{ui.stat(ui.food, state.food, MAX_FOOD)}</span>
      </span>
    </header>
  );
}

// The sky over a day, with what it does said where the choice is made. In
// rain the wind's line is left out: rain keeps scent from carrying at all.
export function WeatherLine({ weather, when }: { weather: Weather; when: "today" | "tomorrow" }) {
  const { ui, weather: w } = useStrings();
  const wind = weather.sky === "rain" ? "" : w.windNote[weather.wind];
  return (
    <p className={`weather sky-${weather.sky}`}>
      <b>{ui[when](w.sky[weather.sky], w.wind[weather.wind])}</b>
      {wind && <span>{wind}</span>}
      {w.skyNote[weather.sky] && <span>{w.skyNote[weather.sky]}</span>}
    </p>
  );
}

// Where the next journey starts. One village is one button, as it always was;
// from the second open region on, the villages are listed to choose from.
export function SetOut({
  state,
  dispatch,
  newSeed,
  label,
}: {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  newSeed: () => number;
  label: string;
}) {
  const { ui, regions } = useStrings();
  if (state.open.length === 1) {
    return (
      <button
        className="primary"
        onClick={() => dispatch({ type: "START", seed: newSeed(), region: state.open[0]! })}
      >
        {label}
      </button>
    );
  }
  return (
    <>
      <h3 className="label">{ui.setOutFrom}</h3>
      <ol className="index">
        {state.open.map((id) => (
          <li key={id}>
            <button
              className="row"
              onClick={() => dispatch({ type: "START", seed: newSeed(), region: id })}
            >
              <span className="l">{regions[id].village.name}</span>
              <span className="v">{regions[id].name}</span>
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}

// The notebook, one animal at a time. It never counts what is left — only
// says that there is more, so there is something to go and find out.
export function Notebook({
  known,
  ways,
  open = false,
}: {
  known: GameState["known"];
  ways: readonly RegionId[];
  open?: boolean;
}) {
  const strings = useStrings();
  const entries = species.filter((s) => s.facts.some((f) => known.includes(f)));
  return (
    <details className="notebook" open={open}>
      <summary>{strings.ui.notebook}</summary>
      {entries.length === 0 && <p className="faint">{strings.ui.notebookEmpty}</p>}
      {entries.map((s) => (
        <section key={s.id} className={spot(s.id)}>
          <h3>{strings.species[s.id].name}</h3>
          {s.facts
            .filter((f) => known.includes(f))
            .map((f) => (
              <p key={f} className="note">
                {strings.facts[f]}
              </p>
            ))}
          {s.facts.some((f) => !known.includes(f)) && (
            <p className="faint">{strings.species[s.id].more}</p>
          )}
        </section>
      ))}
      {ways.length > 1 && (
        <section>
          <h3>{strings.ui.ways}</h3>
          {ways.slice(1).map((id) => (
            <p key={id} className="note">
              {strings.regions[id].way}
            </p>
          ))}
        </section>
      )}
    </details>
  );
}

// What happened last, told in the current language from ids in state.
export function LastEvent({ state }: { state: GameState }) {
  const strings = useStrings();
  const last = state.last;
  if (last === null) {
    return null;
  }
  if (last.kind === "quiet") {
    const lines = strings.regions[state.region].quiet.lines;
    return (
      <div className="event">
        <p className="toll">{state.hungry ? strings.ui.hungry : strings.ui.fed}</p>
        <p>{lines[(state.seed + state.day) % lines.length]}</p>
      </div>
    );
  }
  return (
    <div className="event">
      <p>{resultText(strings, last.sceneId, last.optionId, last.variant)}</p>
      {(last.hp !== 0 || last.food !== 0) && (
        <p className="delta">{strings.ui.outcome(last.hp, last.food)}</p>
      )}
      {last.learned && (
        <div className={`gloss learned ${spot(speciesOfFact(last.learned))}`}>
          <b>{strings.ui.learned}</b>
          <p>{strings.facts[last.learned]}</p>
        </div>
      )}
    </div>
  );
}

// What a node looks like from a day away; once the traveler knows the animal
// behind it, the sign says so in words.
export function signOf(
  strings: Strings,
  state: GameState,
  node: MapNode,
): { place: string; sign: string } {
  if (node.kind === "destination") {
    const d = strings.destinations[node.destinationId!]!;
    return { place: d.name, sign: d.rumor };
  }
  // Fog hides what is on a road, never what the road is called.
  const fog = state.map?.weather[node.layer]?.sky === "fog";
  if (node.kind === "scene") {
    const scene = findScene(node.sceneId!)!;
    const text = strings.scenes[scene.id]!;
    if (fog) {
      return { place: text.place, sign: strings.weather.fogSign };
    }
    return {
      place: text.place,
      sign: knowsSpeciesOf(state, scene) && text.signKnown ? text.signKnown : text.sign,
    };
  }
  const quiet = strings.regions[state.region].quiet;
  return { place: quiet.place, sign: fog ? strings.weather.fogSign : quiet.sign };
}
