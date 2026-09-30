import type { Dispatch } from "react";
import type { SceneOption } from "../content/types";
import { destinations } from "../content/world";
import {
  canAfford,
  canRead,
  currentNode,
  currentScene,
  nextNodes,
  offeredOptions,
  preview,
} from "../core/reducer";
import type { GameAction, GameState } from "../core/state";
import { MapView } from "./MapView";
import { LastEvent, Notebook, StatusBar, signOf } from "./parts";
import { useStrings } from "./strings";

type ScreenProps = { state: GameState; dispatch: Dispatch<GameAction>; newSeed: () => number };

export function TitleScreen({ state, dispatch, newSeed }: ScreenProps) {
  const { ui } = useStrings();
  return (
    <div className="title-screen">
      <h1>{ui.title}</h1>
      <p className="premise">{ui.premise}</p>
      <button className="primary" onClick={() => dispatch({ type: "START", seed: newSeed() })}>
        {ui.setOut}
      </button>
      {state.known.length > 0 && <Notebook known={state.known} />}
    </div>
  );
}

export function MapScreen({ state, dispatch }: ScreenProps) {
  const strings = useStrings();
  const { ui } = strings;
  const atVillage = state.day === 0;

  return (
    <>
      <StatusBar state={state} />
      {atVillage ? (
        <div className="event">
          <h2>{strings.village.name}</h2>
          <p>{strings.village.description}</p>
          <h3 className="small-heading">{ui.rumors}</h3>
          <ul className="rumors">
            {destinations.map((d) => (
              <li key={d.id}>{strings.destinations[d.id]!.rumor}</li>
            ))}
          </ul>
        </div>
      ) : (
        <LastEvent state={state} />
      )}
      <MapView state={state} dispatch={dispatch} />
      <h3 className="small-heading">{ui.whereNext}</h3>
      <div className="choices">
        {nextNodes(state).map((node) => {
          const { place, sign } = signOf(strings, state, node);
          return (
            <button key={node.id} onClick={() => dispatch({ type: "MOVE", nodeId: node.id })}>
              <span className="choice-label">{place}</span>
              <span className="choice-hint">{sign}</span>
            </button>
          );
        })}
      </div>
      <Notebook known={state.known} />
    </>
  );
}

export function SceneScreen({ state, dispatch }: ScreenProps) {
  const strings = useStrings();
  const { ui } = strings;
  const scene = currentScene(state)!;
  const variant = currentNode(state)!.variant!;
  const text = strings.scenes[scene.id]!;
  const v = text.variants[variant]!;
  const hint = (
    option: SceneOption,
    affordable: boolean,
    outcome: ReturnType<typeof preview>,
  ) => {
    if (!affordable) {
      return ui.noFood;
    }
    const base = outcome ? ui.outcome(outcome.hp, outcome.food) : ui.unknownOutcome;
    return option.study ? ui.withLesson(base) : base;
  };

  return (
    <>
      <StatusBar state={state} />
      <p className="toll">{state.hungry ? ui.hungry : ui.fed}</p>
      <h2>{text.title}</h2>
      <p>{text.description}</p>
      {v.tell && <p className="tell">{v.tell}</p>}
      {scene.reads !== undefined &&
        (canRead(state, scene) ? (
          <aside className="reading">
            <h3>{ui.notebook}</h3>
            <p className="note">{v.reading}</p>
          </aside>
        ) : (
          <p className="unreadable">{ui.unreadable}</p>
        ))}
      <div className="choices">
        {offeredOptions(state).map((option) => {
          const affordable = canAfford(state, option);
          const outcome = preview(state, option);
          return (
            <button
              key={option.id}
              disabled={!affordable}
              className={option.needs ? "informed" : undefined}
              onClick={() => dispatch({ type: "CHOOSE", optionId: option.id })}
            >
              <span className="choice-label">{text.options[option.id]!.label}</span>
              <span className="choice-hint">{hint(option, affordable, outcome)}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export function EndScreen({ state, dispatch, newSeed }: ScreenProps) {
  const strings = useStrings();
  const { ui } = strings;
  const ending = state.ending!;
  // Dying of hunger on the way means the last node was never reached.
  const reached =
    ending.kind === "died" && ending.cause === "hunger"
      ? state.path.slice(1, -1)
      : state.path.slice(1);
  const path = reached
    .map((id) => state.map!.layers.flat().find((n) => n.id === id)!)
    .filter((n) => n.kind === "scene")
    .map((n) => strings.scenes[n.sceneId!]!.title);

  return (
    <>
      {ending.kind === "arrived" ? (
        <div className="ending">
          <h2>{strings.destinations[ending.destinationId]!.name}</h2>
          <p>
            {ending.saw
              ? strings.destinations[ending.destinationId]!.sight
              : strings.destinations[ending.destinationId]!.missed}
          </p>
          {!ending.saw && (
            <p className="hint">{strings.destinations[ending.destinationId]!.hint}</p>
          )}
        </div>
      ) : (
        <div className="ending">
          {state.last?.kind === "chose" && <LastEvent state={state} />}
          <h2>{ui.diedTitle}</h2>
          <p>{ui.diedOf[ending.cause]}</p>
        </div>
      )}

      <p className="faint">{ui.daysWalked(state.day)}</p>
      {path.length > 0 && (
        <p className="road-behind">
          <span className="small-heading">{ui.theRoadBehind}</span> {ui.road(path)}
        </p>
      )}

      <section className="learned-list">
        <h3 className="small-heading">{ui.learnedThisJourney}</h3>
        {state.learnedThisJourney.length === 0 ? (
          <p className="faint">{ui.nothingLearned}</p>
        ) : (
          state.learnedThisJourney.map((f) => (
            <p key={f} className="note">
              {strings.facts[f]}
            </p>
          ))
        )}
      </section>

      <button className="primary" onClick={() => dispatch({ type: "START", seed: newSeed() })}>
        {ui.setOutAgain}
      </button>
      <Notebook known={state.known} />
    </>
  );
}
