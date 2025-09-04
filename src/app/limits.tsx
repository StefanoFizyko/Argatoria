// Returns [min, max] for Grupa Dowódcza
export function getGrupaDowodczaLimits(gamePoints: number): [number, number] {
  return gamePoints <= 1500 ? [1, 3] : [2, 6];
}

// Returns [min, max] for Czempion
export function getCzempionLimits(gamePoints: number): [number, number] {
  return gamePoints <= 1500 ? [1, 3] : [1, 6];
}

// Returns max number of Mag units
export function getMagLimit(gamePoints: number): number {
  return Math.floor(gamePoints / 500);
}

// Returns min/max for podstawowe oddziały
export function getMinPodstawowe(gamePoints: number): number {
  return gamePoints <= 1000 ? 2 : 4;
}
export function getMaxRzadkie(gamePoints: number): number {
  return gamePoints <= 1500 ? 4 : 8;
}
export function getMaxUnikalne(gamePoints: number): number {
  return gamePoints <= 1500 ? 3 : 6;
}

// Minimum total bohaterowie in army
export const MIN_BOHATEROWIE_TOTAL = 4;

// Only one Generał allowed
export const MAX_GENERAŁ = 1;

// Only one artifact per Generał allowed
export const MAX_ARTIFACTS_PER_GENERAŁ = 1;

// Only one banner in total for entire army (for Grupa Dowódcza)
export const MAX_BANNERS_TOTAL = 1;

// Only allow banners if gamePoints >= 1000
export function areBannersAllowed(gamePoints: number): boolean {
  return gamePoints >= 1000;
}

