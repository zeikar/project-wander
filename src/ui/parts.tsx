import { species } from "../content/species";
import { MAX_FOOD, MAX_HP } from "../content/world";
import type { MapNode } from "../core/map";
import { findScene } from "../content/scenes";
import { knowsSpeciesOf } from "../core/reducer";
import type { GameState } from "../core/state";
import type { Strings } from "../i18n";
import { resultText } from "../i18n";
import { useStrings } from "./strings";

function Pips({ value, max, label }: { value: number; max: number; label: string }) {
  const { ui } = useStrings();
  return (
    <span className="pips" role="img" aria-label={ui.meter(label, value, max)}>
      {Array.from({ length: max }, (_, i) => (
        <i key={i} className={i < value ? "on" : "off"} />
      ))}
    </span>
  );
}

export function StatusBar({ state }: { state: GameState }) {
  const { ui } = useStrings();
  return (
    <header className="status">
      <span className="day">{ui.day(state.day)}</span>
      <span className="stat">
        {ui.hp} <Pips value={state.hp} max={MAX_HP} label={ui.hp} />
      </span>
      <span className="stat">
        {ui.food} <Pips value={state.food} max={MAX_FOOD} label={ui.food} />
      </span>
    </header>
  );
}

// The notebook, one animal at a time. It never counts what is left — only
// says that there is more, so there is something to go and find out.
export function Notebook({ known, open = false }: { known: GameState["known"]; open?: boolean }) {
  const strings = useStrings();
  const entries = species.filter((s) => s.facts.some((f) => known.includes(f)));
  return (
    <details className="notebook" open={open}>
      <summary>{strings.ui.notebook}</summary>
      {entries.length === 0 && <p className="faint">{strings.ui.notebookEmpty}</p>}
      {entries.map((s) => (
        <section key={s.id}>
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
    const lines = strings.quiet.lines;
    return (
      <div className="event">
        <p>{lines[(state.seed + state.day) % lines.length]}</p>
        <p className="toll">{state.hungry ? strings.ui.hungry : strings.ui.fed}</p>
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
        <aside className="learned">
          <h3>{strings.ui.learned}</h3>
          <p className="note">{strings.facts[last.learned]}</p>
        </aside>
      )}
    </div>
  );
}

// What a node looks like from a day away.
export function signOf(
  strings: Strings,
  state: GameState,
  node: MapNode,
): { place: string; sign: string } {
  if (node.kind === "destination") {
    const d = strings.destinations[node.destinationId!]!;
    return { place: d.name, sign: d.rumor };
  }
  if (node.kind === "scene") {
    const scene = findScene(node.sceneId!)!;
    const text = strings.scenes[scene.id]!;
    const sign = knowsSpeciesOf(state, scene) && text.signKnown ? text.signKnown : text.sign;
    return { place: text.place, sign };
  }
  return { place: strings.quiet.place, sign: strings.quiet.sign };
}
