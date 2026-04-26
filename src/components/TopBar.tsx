type TopBarProps = {
  levelLabel: string;
  movesLeft: number;
  score: number;
  targetScore: number;
  disabled: boolean;
  onOpenLevels: () => void;
};

export function TopBar({
  levelLabel,
  movesLeft,
  score,
  targetScore,
  disabled,
  onOpenLevels
}: TopBarProps) {
  const compactLevelLabel = levelLabel.replace(/^level\s+/i, '');

  return (
    <header className="top-bar panel">
      <div className="top-bar__stats" aria-label="Current round status">
        <button className="stat-chip stat-chip--level stat-chip--interactive" type="button" onClick={onOpenLevels} disabled={disabled}>
          <span className="stat-chip__label">Level</span>
          <strong>{compactLevelLabel}</strong>
        </button>
        <div className="stat-chip stat-chip--moves">
          <span className="stat-chip__label">Moves</span>
          <strong>{movesLeft}</strong>
        </div>
        <div className="stat-chip stat-chip--score">
          <span className="stat-chip__label">Score</span>
          <strong>{score}</strong>
        </div>
        <div className="stat-chip stat-chip--target">
          <span className="stat-chip__label">Target</span>
          <strong>{targetScore}</strong>
        </div>
      </div>
    </header>
  );
}

type ActionBarProps = {
  disabled: boolean;
  onHint: () => void;
  onOpenSettings: () => void;
  onRestart: () => void;
};

export function ActionBar({ disabled, onHint, onOpenSettings, onRestart }: ActionBarProps) {
  return (
    <section className="action-bar panel" aria-label="Round actions">
      <button className="button button--ghost" type="button" onClick={onHint} disabled={disabled}>
        Hint
      </button>
      <button className="button button--ghost" type="button" onClick={onRestart} disabled={disabled}>
        Restart
      </button>
      <button className="button button--ghost" type="button" onClick={onOpenSettings}>
        Settings
      </button>
    </section>
  );
}
