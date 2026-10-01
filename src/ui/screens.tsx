import type { Dispatch } from "react";
import type { SceneOption } from "../content/types";
import { destinations } from "../content/world";
import {
  canAfford,
  canRead,
  currentNode,
  currentScene,
  isClosed,
  knowsSpeciesOf,
  nextNodes,
  offeredOptions,
  preview,
  weatherAt,
} from "../core/reducer";
import type { GameAction, GameState } from "../core/state";
import { MapView } from "./MapView";
import {
  LastEvent,
  Layout,
  Notebook,
  ROOMY,
  StatusBar,
  WeatherLine,
  signOf,
  spot,
  useMedia,
} from "./parts";
import { useStrings } from "./strings";

type ScreenProps = { state: GameState; dispatch: Dispatch<GameAction>; newSeed: () => number };

export function TitleScreen({ state, dispatch, newSeed }: ScreenProps) {
  const { ui } = useStrings();
  return (
    <div className="cover">
      <h1>{ui.title}</h1>
      <p className="premise">{ui.premise}</p>
      <button className="primary" onClick={() => dispatch({ type: "START", seed: newSeed() })}>
        {ui.setOut}
      </button>
      {state.known.length > 0 && <Notebook known={state.known} open />}
    </div>
  );
}

function MapFigure({ state, dispatch }: Pick<ScreenProps, "state" | "dispatch">) {
  const strings = useStrings();
  return (
    <figure className="map-figure">
      <MapView state={state} dispatch={dispatch} />
      <figcaption>{strings.ui.mapCaption(strings.village.name)}</figcaption>
    </figure>
  );
}

export function MapScreen({ state, dispatch }: ScreenProps) {
  const strings = useStrings();
  const { ui } = strings;
  const roomy = useMedia(ROOMY);
  const tomorrow = weatherAt(state, currentNode(state)!.layer + 1);

  const story =
    state.day === 0 ? (
      <div className="event">
        <h2>{strings.village.name}</h2>
        <p>{strings.village.description}</p>
        <h3 className="label">{ui.rumors}</h3>
        <ul className="rumors">
          {destinations.map((d) => (
            <li key={d.id}>{strings.destinations[d.id]!.rumor}</li>
          ))}
        </ul>
      </div>
    ) : (
      <LastEvent state={state} />
    );

  return (
    <Layout
      kind="map"
      status={<StatusBar state={state} />}
      story={story}
      map={<MapFigure state={state} dispatch={dispatch} />}
      choices={
        <>
          <h3 className="label">{ui.whereNext}</h3>
          {tomorrow && <WeatherLine weather={tomorrow} when="tomorrow" />}
          <ol className="index">
            {nextNodes(state).map((node) => {
              const { place, sign, species } = signOf(strings, state, node);
              return (
                <li key={node.id}>
                  <button
                    className={`row road ${species ? `informed ${spot(species)}` : ""}`}
                    onClick={() => dispatch({ type: "MOVE", nodeId: node.id })}
                  >
                    <span className="l">{place}</span>
                    <span className="v">{sign}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      }
      notes={<Notebook known={state.known} open={roomy} />}
    />
  );
}

export function SceneScreen({ state, dispatch }: ScreenProps) {
  const strings = useStrings();
  const { ui } = strings;
  const roomy = useMedia(ROOMY);
  const scene = currentScene(state)!;
  const variant = currentNode(state)!.variant!;
  const text = strings.scenes[scene.id]!;
  const v = text.variants[variant]!;
  const readable = canRead(state, scene);
  const kicker =
    scene.kind === "place"
      ? ui.aPlace
      : knowsSpeciesOf(state, scene)
        ? strings.species[scene.species!].name
        : ui.unknownAnimal;

  const today = weatherAt(state);
  const hint = (option: SceneOption, affordable: boolean) => {
    if (isClosed(state, option)) {
      return text.options[option.id]!.closed!;
    }
    if (!affordable) {
      return ui.noFood;
    }
    const outcome = preview(state, option);
    const base = outcome ? ui.outcome(outcome.hp, outcome.food) : ui.unknownOutcome;
    return option.study ? ui.withLesson(base) : base;
  };

  return (
    <Layout
      kind="scene"
      status={<StatusBar state={state} />}
      story={
        <article className={`scene ${spot(scene.species)}`}>
          <p className="toll">{state.hungry ? ui.hungry : ui.fed}</p>
          {today && <WeatherLine weather={today} when="today" />}
          <p className="kicker">{kicker}</p>
          <h2>{text.title}</h2>
          <p>{text.description}</p>
          {/* Unread, the tell is printed out of register — the animal's colour
              a hair off the black. Reading it brings the plate into line. */}
          {v.tell && (
            <p className={`tell ${readable ? "in-register" : "off-register"}`}>
              <span>{v.tell}</span>
            </p>
          )}
          {scene.reads !== undefined &&
            (readable ? (
              <div className="gloss">
                <b>{ui.reading}</b>
                <p>{v.reading}</p>
              </div>
            ) : (
              <p className="unreadable">{ui.unreadable}</p>
            ))}
        </article>
      }
      choices={
        <ol className={`index ${spot(scene.species)}`}>
          {offeredOptions(state).map((option, i) => {
            const affordable = canAfford(state, option);
            const closed = isClosed(state, option);
            const certain = preview(state, option) !== null;
            return (
              <li key={option.id}>
                <button
                  className={`row ${option.needs ? "informed" : ""} ${certain ? "" : "unknown"}`}
                  disabled={!affordable || closed}
                  onClick={() => dispatch({ type: "CHOOSE", optionId: option.id })}
                >
                  <span className="k" aria-hidden="true">
                    {option.needs ? "+" : i + 1}
                  </span>
                  <span className="l">{text.options[option.id]!.label}</span>
                  <span className="v">{hint(option, affordable)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      }
      map={<MapFigure state={state} dispatch={dispatch} />}
      notes={<Notebook known={state.known} open={roomy} />}
    />
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
  const destination =
    ending.kind === "arrived" ? strings.destinations[ending.destinationId]! : null;

  return (
    <Layout
      kind="end"
      story={
        <>
          {ending.kind === "died" && state.last?.kind === "chose" && <LastEvent state={state} />}
          <div className="ending">
            <p className="kicker">{ui.daysWalked(state.day)}</p>
            <h2>{destination ? destination.name : ui.diedTitle}</h2>
            <p>
              {destination
                ? ending.kind === "arrived" && ending.saw
                  ? destination.sight
                  : destination.missed
                : ending.kind === "died" && ui.diedOf[ending.cause]}
            </p>
            {destination && ending.kind === "arrived" && !ending.saw && (
              <p className="hint">{destination.hint}</p>
            )}
          </div>
          <section className="learned-list">
            <h3 className="label">{ui.learnedThisJourney}</h3>
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
        </>
      }
      map={<MapFigure state={state} dispatch={dispatch} />}
      choices={
        <>
          {path.length > 0 && (
            <p className="road-behind">
              <span className="label">{ui.theRoadBehind}</span> {ui.road(path)}
            </p>
          )}
          <button className="primary" onClick={() => dispatch({ type: "START", seed: newSeed() })}>
            {ui.setOutAgain}
          </button>
        </>
      }
      notes={<Notebook known={state.known} open />}
    />
  );
}
