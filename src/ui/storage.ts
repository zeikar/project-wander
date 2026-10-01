// The notebook, the far places reached and the chosen language outlive a page load. Browser storage
// can be missing or refuse (private windows, blocked site data); the game then
// simply starts with an empty notebook.
import { allFacts } from "../content/species";
import type { FactId, RegionId } from "../content/types";
import { FIRST_REGION, destinations, regions } from "../content/world";
import type { Been } from "../core/state";

const KNOWN_KEY = "wander.v1.known";
const OPEN_KEY = "wander.v1.open";
const BEEN_KEY = "wander.v1.been";
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

export function loadOpen(): RegionId[] {
  try {
    const raw = localStorage.getItem(OPEN_KEY);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [FIRST_REGION];
    }
    // The first village is always known, so a damaged save still has one to
    // set out from.
    const saved = regions.map((r) => r.id).filter((id) => parsed.includes(id));
    return [FIRST_REGION, ...saved.filter((id) => id !== FIRST_REGION)];
  } catch (error) {
    console.warn("Could not read the saved ways:", error);
    return [FIRST_REGION];
  }
}

export function saveOpen(open: readonly RegionId[]): void {
  try {
    localStorage.setItem(OPEN_KEY, JSON.stringify(open));
  } catch (error) {
    console.warn("Could not save the ways:", error);
  }
}

export function loadBeen(): Been {
  try {
    const raw = localStorage.getItem(BEEN_KEY);
    const parsed: unknown = raw === null ? {} : JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }
    const count = (n: unknown) => (Number.isInteger(n) && (n as number) > 0 ? (n as number) : 0);
    const been: Record<string, { missed: number; saw: number }> = {};
    for (const { id } of destinations) {
      const entry = (parsed as Record<string, unknown>)[id];
      if (typeof entry === "object" && entry !== null) {
        const { missed, saw } = entry as Record<string, unknown>;
        been[id] = { missed: count(missed), saw: count(saw) };
      }
    }
    return been;
  } catch (error) {
    console.warn("Could not read the saved far places:", error);
    return {};
  }
}

export function saveBeen(been: Been): void {
  try {
    localStorage.setItem(BEEN_KEY, JSON.stringify(been));
  } catch (error) {
    console.warn("Could not save the far places:", error);
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
