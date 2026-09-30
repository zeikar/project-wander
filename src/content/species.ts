import type { FactId, Species, SpeciesId } from "./types";

export const species: readonly Species[] = [
  { id: "boar", facts: ["boar.nose", "boar.sow"] },
  { id: "wolves", facts: ["wolves.rank", "wolves.chase"] },
  { id: "deer", facts: ["deer.drive", "deer.dawn"] },
];

export const allFacts: readonly FactId[] = species.flatMap((s) => s.facts);

export function speciesOfFact(fact: FactId): SpeciesId {
  return species.find((s) => s.facts.includes(fact))!.id;
}
