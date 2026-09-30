import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, locales } from "../i18n";
import type { Strings } from "../i18n";

export const StringsContext = createContext<Strings>(locales[DEFAULT_LOCALE]);

export function useStrings(): Strings {
  return useContext(StringsContext);
}
