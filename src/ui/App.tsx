import { useEffect, useReducer, useState } from "react";
import { currentNode, reduce, weatherAt } from "../core/reducer";
import { createInitialState } from "../core/state";
import { detectLocale, locales } from "../i18n";
import type { LocaleId } from "../i18n";
import { EndScreen, MapScreen, SceneScreen, TitleScreen } from "./screens";
import {
  loadBeen,
  loadKnown,
  loadLocale,
  loadMet,
  loadOpen,
  saveBeen,
  saveKnown,
  saveLocale,
  saveMet,
  saveOpen,
} from "./storage";
import { StringsContext } from "./strings";
import { WeatherSky } from "./WeatherSky";

// The UI is the one place randomness may come from: the core takes the seed
// as data, so every journey stays reproducible.
function newSeed(): number {
  return (Math.random() * 0x100000000) >>> 0;
}

export default function App() {
  const [locale, setLocale] = useState<LocaleId>(() =>
    detectLocale(loadLocale(), navigator.languages ?? []),
  );
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(loadKnown(), loadOpen(), loadBeen(), loadMet()),
  );

  useEffect(() => {
    saveKnown(state.known);
  }, [state.known]);
  useEffect(() => {
    saveOpen(state.open);
  }, [state.open]);
  useEffect(() => {
    saveBeen(state.been);
  }, [state.been]);
  useEffect(() => {
    saveMet(state.met);
  }, [state.met]);
  // Only an explicit choice is saved. Saving the detected language would pin
  // every returning player to it, even after their own language ships.
  const chooseLocale = (id: LocaleId) => {
    setLocale(id);
    saveLocale(id);
  };
  useEffect(() => {
    document.documentElement.lang = locales[locale].meta.htmlLang;
    document.title = locales[locale].ui.title;
  }, [locale]);

  // Scroll to the top whenever the screen changes, so a new scene starts at
  // its title rather than wherever the last one was left.
  const screenKey = `${state.phase}:${state.at}:${state.day}`;
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screenKey]);

  const strings = locales[locale];
  const props = { state, dispatch, newSeed };
  const localeIds = Object.keys(locales) as LocaleId[];

  return (
    <StringsContext.Provider value={strings}>
      {/* On the map the page wears tomorrow's sky — the one the forecast names
          and the road about to be chosen will be walked under — so it carries
          straight on into the scene. */}
      <WeatherSky
        weather={
          state.phase === "map"
            ? weatherAt(state, currentNode(state)!.layer + 1)
            : state.phase === "scene"
              ? weatherAt(state)
              : undefined
        }
      />
      <main className="page">
        <div className="screen" key={screenKey}>
          {state.phase === "title" && <TitleScreen {...props} />}
          {state.phase === "map" && <MapScreen {...props} />}
          {state.phase === "scene" && <SceneScreen {...props} />}
          {state.phase === "end" && <EndScreen {...props} />}
        </div>
        {localeIds.length > 1 && (
          <footer className="footer">
            <label>
              {strings.ui.language}{" "}
              <select value={locale} onChange={(e) => chooseLocale(e.target.value as LocaleId)}>
                {localeIds.map((id) => (
                  <option key={id} value={id}>
                    {locales[id].meta.name}
                  </option>
                ))}
              </select>
            </label>
          </footer>
        )}
      </main>
    </StringsContext.Provider>
  );
}
