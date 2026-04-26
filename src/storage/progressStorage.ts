const PROGRESS_KEY = 'word-match3.progress.v1';

export type ProgressData = {
  unlockedLevel: number;
  completedLevels: number[];
  bestScores: Record<number, number>;
  lastLevelId: number;
};

export function getDefaultProgress(): ProgressData {
  return {
    unlockedLevel: 1,
    completedLevels: [],
    bestScores: {},
    lastLevelId: 1
  };
}

export function loadProgress(): ProgressData {
  if (typeof window === 'undefined') {
    return getDefaultProgress();
  }

  const defaults = getDefaultProgress();

  try {
    const rawValue = window.localStorage.getItem(PROGRESS_KEY);

    if (!rawValue) {
      return defaults;
    }

    const parsed = JSON.parse(rawValue) as Partial<ProgressData>;
    return {
      ...defaults,
      ...parsed,
      completedLevels: Array.isArray(parsed.completedLevels)
        ? parsed.completedLevels
        : defaults.completedLevels,
      bestScores: parsed.bestScores ?? defaults.bestScores
    };
  } catch {
    return defaults;
  }
}

export function saveProgress(progress: ProgressData): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage failures so gameplay can continue.
  }
}
