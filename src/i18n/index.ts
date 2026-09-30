// The languages the game ships in. To add one: write `xx.ts` exporting a
// `Strings` object (copy `ko.ts` and translate it), then add it here.
// `i18n.test.ts` checks every registered locale covers all game text.
import { ko } from "./ko";
import type { Strings } from "./types";

export const locales = { ko } satisfies Record<string, Strings>;

export type LocaleId = keyof typeof locales;

export const DEFAULT_LOCALE: LocaleId = "ko";

export function isLocaleId(value: unknown): value is LocaleId {
  return typeof value === "string" && Object.hasOwn(locales, value);
}

// A saved choice wins; otherwise the first browser language we have; else the
// default. Matches on the primary subtag, so "en-GB" finds "en".
export function detectLocale(
  saved: string | null,
  browserLanguages: readonly string[],
): LocaleId {
  if (isLocaleId(saved)) {
    return saved;
  }
  for (const tag of browserLanguages) {
    const primary = tag.toLowerCase().split("-")[0];
    if (isLocaleId(primary)) {
      return primary;
    }
  }
  return DEFAULT_LOCALE;
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
