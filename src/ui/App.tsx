import { useEffect, useReducer, useState } from "react";
import { reduce } from "../core/reducer";
import { createInitialState } from "../core/state";
import { detectLocale, locales } from "../i18n";
import type { LocaleId } from "../i18n";
import { EndScreen, MapScreen, SceneScreen, TitleScreen } from "./screens";
import { loadKnown, loadLocale, saveKnown, saveLocale } from "./storage";
import { StringsContext } from "./strings";

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
    createInitialState(loadKnown()),
  );

  useEffect(() => {
    saveKnown(state.known);
  }, [state.known]);
  useEffect(() => {
    saveLocale(locale);
    document.documentElement.lang = locales[locale].meta.htmlLang;
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
              <select value={locale} onChange={(e) => setLocale(e.target.value as LocaleId)}>
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
