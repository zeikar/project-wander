import type { Dispatch } from "react";
import type { SceneOption } from "../content/types";
import { regionById } from "../content/world";
import {
  canAfford,
  canRead,
  currentNode,
  currentScene,
  isClosed,
  knowsSpeciesOf,
  nextNodes,
  nodeById,
  offeredOptions,
  preview,
  teachesForSure,
  weatherAt,
} from "../core/reducer";
import type { GameAction, GameState } from "../core/state";
import { MapView } from "./MapView";
import {
  LastEvent,
  Layout,
  Notebook,
  ROOMY,
  SetOut,
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
      <SetOut state={state} dispatch={dispatch} newSeed={newSeed} label={ui.setOut} />
      {state.known.length > 0 && <Notebook known={state.known} ways={state.open} open />}
    </div>
  );
}

function MapFigure({
  state,
  dispatch,
  mark,
}: Pick<ScreenProps, "state" | "dispatch"> & { mark?: string }) {
  const strings = useStrings();
  return (
    <figure className="map-figure">
      <MapView state={state} dispatch={dispatch} mark={mark} />
      <figcaption>{strings.ui.mapCaption(
          strings.regions[state.region].name,
          strings.regions[state.region].village.name,
        )}</figcaption>
    </figure>
  );
}

export function MapScreen({ state, dispatch }: ScreenProps) {
  const strings = useStrings();
  const { ui } = strings;
  const roomy = useMedia(ROOMY);
  const tomorrow = weatherAt(state, currentNode(state)!.layer + 1);
  const region = strings.regions[state.region];

  const story =
    state.day === 0 ? (
      <div className="event">
        <p className="kicker">{region.name}</p>
        <h2>{region.village.name}</h2>
        <p>{region.village.description}</p>
        <h3 className="label">{ui.rumors}</h3>
        <ul className="rumors">
          {regionById(state.region).destinations.map((d) => (
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
      notes={<Notebook known={state.known} ways={state.open} open={roomy} />}
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
        : scene.kind === "monster"
          ? ui.unknownThing
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
    if (!option.study) {
      return base;
    }
    return teachesForSure(state, option) ? ui.withLesson(base) : ui.withMaybeLesson(base);
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
      notes={<Notebook known={state.known} ways={state.open} open={roomy} />}
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

  let title = ui.diedTitle;
  let told = ending.kind === "died" ? ui.diedOf[ending.cause] : "";
  let visits = 1;
  let hint: string | null = null;
  let lead: string | null = null;
  let mark: string | undefined;
  if (ending.kind === "arrived") {
    const destination = strings.destinations[ending.destinationId]!;
    const been = state.been[ending.destinationId]!;
    title = destination.name;
    visits = been.missed + been.saw;
    if (ending.saw) {
      told = been.saw > 1 ? destination.sightAgain : destination.sight;
    } else {
      told = been.missed > 1 ? destination.missedAgain : destination.missed;
      hint = destination.hint;
      const node = ending.lead ? nodeById(state, ending.lead.nodeId)! : null;
      const scene = node ? strings.scenes[node.sceneId!]! : null;
      const fork = ending.lead?.fork ?? null;
      lead = !node
        ? ui.noLead
        : fork === null
          ? ui.leadTaken(node.layer, scene!.title)
          : ui.leadLeft(fork, scene!.place);
      mark = node?.id;
    }
  }

  return (
    <Layout
      kind="end"
      story={
        <>
          {ending.kind === "died" && state.last?.kind === "chose" && <LastEvent state={state} />}
          <div className="ending">
            <p className="kicker">
              {ui.daysWalked(state.day)}
              {visits > 1 && ` ${ui.nthVisit(visits)}`}
            </p>
            <h2>{title}</h2>
            <p>{told}</p>
            {hint && (
              <div className="hint">
                <p>{hint}</p>
                <p>{lead}</p>
              </div>
            )}
            {ending.kind === "arrived" && ending.opened && (
              <>
                <h3 className="label">{ui.newWay}</h3>
                <p className="hint">{strings.regions[ending.opened].way}</p>
              </>
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
      map={<MapFigure state={state} dispatch={dispatch} mark={mark} />}
      choices={
        <>
          {path.length > 0 && (
            <p className="road-behind">
              <span className="label">{ui.theRoadBehind}</span> {ui.road(path)}
            </p>
          )}
          <SetOut state={state} dispatch={dispatch} newSeed={newSeed} label={ui.setOutAgain} />
        </>
      }
      notes={<Notebook known={state.known} ways={state.open} open />}
    />
  );
}
