// The languages the game ships in. To add one: write `xx.ts` exporting a
// `Strings` object (copy `ko.ts` and translate it), then add it here.
// `i18n.test.ts` checks every registered locale covers all game text.
import { en } from "./en";
import { ko } from "./ko";
import type { Strings } from "./types";

export const locales = { ko, en } satisfies Record<string, Strings>;

export type LocaleId = keyof typeof locales;

export const DEFAULT_LOCALE: LocaleId = "ko";

// A saved choice wins; otherwise the first browser language we have; else the
// default. Matches on the primary subtag, so "en-GB" finds "en".
export function detectLocale<Id extends string = LocaleId>(
  saved: string | null,
  browserLanguages: readonly string[],
  available: readonly Id[] = Object.keys(locales) as Id[],
  fallback: Id = DEFAULT_LOCALE as Id,
): Id {
  const has = (value: string | null | undefined): value is Id =>
    value != null && (available as readonly string[]).includes(value);
  if (has(saved)) {
    return saved;
  }
  for (const tag of browserLanguages) {
    const primary = tag.toLowerCase().split("-")[0];
    if (has(primary)) {
      return primary;
    }
  }
  return fallback;
}

// An option's result line for the variant that happened, falling back to "*".
export function resultText(
  strings: Strings,
  sceneId: string,
  optionId: string,
  variant: string,
): string {
  const result = strings.scenes[sceneId]!.options[optionId]!.result;
  return result[variant] ?? result["*"]!;
}

export type { Strings } from "./types";
