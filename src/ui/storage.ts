// The notebook and the chosen language outlive a page load. Browser storage
// can be missing or refuse (private windows, blocked site data); the game then
// simply starts with an empty notebook.
import { allFacts } from "../content/species";
import type { FactId } from "../content/types";

const KNOWN_KEY = "wander.v1.known";
const LOCALE_KEY = "wander.v1.locale";

export function loadKnown(): FactId[] {
  try {
    const raw = localStorage.getItem(KNOWN_KEY);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // Only facts this version of the game has; an old save may carry others.
    return parsed.filter((f): f is FactId => allFacts.includes(f as FactId));
  } catch (error) {
    console.warn("Could not read the saved notebook:", error);
    return [];
  }
}

export function saveKnown(known: readonly FactId[]): void {
  try {
    localStorage.setItem(KNOWN_KEY, JSON.stringify(known));
  } catch (error) {
    console.warn("Could not save the notebook:", error);
  }
}

export function loadLocale(): string | null {
  try {
    return localStorage.getItem(LOCALE_KEY);
  } catch (error) {
    console.warn("Could not read the saved language:", error);
    return null;
  }
}

export function saveLocale(locale: string): void {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch (error) {
    console.warn("Could not save the language:", error);
  }
}
