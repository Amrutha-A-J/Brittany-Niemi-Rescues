import type { FosterPlacement, FosterWithPlacements } from "./types";

export type FosterStatus = "fostering" | "available" | "on_break";

export const fosterStatusLabel: Record<FosterStatus, string> = {
  fostering: "Fostering now",
  available: "Available",
  on_break: "On a break",
};

/** The kinds of cats a foster can take (same options as the foster application). */
export const FOSTER_KINDS = ["Kittens", "Bottle babies", "Moms with litters", "Adult cats", "Seniors", "Medical / special needs"];

export const isCurrent = (p: FosterPlacement) => !p.ended_on;

/** Derived numbers shown on the roster. */
export function fosterSummary(f: FosterWithPlacements) {
  const placements = [...f.foster_placements].sort((a, b) => b.started_on.localeCompare(a.started_on));
  const current = placements.filter(isCurrent);
  const status: FosterStatus = current.length ? "fostering" : f.on_break ? "on_break" : "available";
  const lastDate = placements.reduce<string | null>((latest, p) => {
    const d = p.ended_on ?? new Date().toISOString().slice(0, 10);
    return !latest || d > latest ? d : latest;
  }, null);
  return { placements, current, status, count: placements.length, lastDate };
}
