const INSTALL_KEY = 'word-match3.install.v1';

export type InstallData = {
  installId: string;
  createdAt: number;
};

function createInstallData(): InstallData {
  const installId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `install_${Math.random().toString(36).slice(2, 10)}`;

  return {
    installId,
    createdAt: Date.now()
  };
}

export function loadInstall(): InstallData {
  if (typeof window === 'undefined') {
    return createInstallData();
  }

  try {
    const rawValue = window.localStorage.getItem(INSTALL_KEY);

    if (rawValue) {
      try {
        const parsed = JSON.parse(rawValue) as Partial<InstallData>;
        if (parsed.installId && parsed.createdAt) {
          return {
            installId: parsed.installId,
            createdAt: parsed.createdAt
          };
        }
      } catch {
        // Ignore broken storage and recreate below.
      }
    }
  } catch {
    // Ignore storage access failures and recreate below.
  }

  const install = createInstallData();

  try {
    window.localStorage.setItem(INSTALL_KEY, JSON.stringify(install));
  } catch {
    // Ignore storage failures so gameplay can continue.
  }

  return install;
}
