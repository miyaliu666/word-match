const SETTINGS_KEY = 'word-match3.settings.v1';

export type SettingsData = {
  soundEnabled: boolean;
  reducedMotion?: boolean;
  theme: 'dark' | 'light';
  nativeLanguage: 'zh';
  targetLanguage: 'en';
};

function getDefaultReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getDefaultSettings(): SettingsData {
  return {
    soundEnabled: true,
    reducedMotion: getDefaultReducedMotion(),
    theme: 'dark',
    nativeLanguage: 'zh',
    targetLanguage: 'en'
  };
}

export function loadSettings(): SettingsData {
  if (typeof window === 'undefined') {
    return getDefaultSettings();
  }

  const defaults = getDefaultSettings();

  try {
    const rawValue = window.localStorage.getItem(SETTINGS_KEY);

    if (!rawValue) {
      return defaults;
    }

    const parsed = JSON.parse(rawValue) as Partial<SettingsData>;
    return {
      ...defaults,
      ...parsed
    };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: SettingsData): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage failures so gameplay can continue.
  }
}
