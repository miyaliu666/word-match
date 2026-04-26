import { useState } from 'react';
import { Board } from '../components/Board';
import { LevelPicker } from '../components/LevelPicker';
import { Modal } from '../components/Modal';
import { ReviewPanel } from '../components/ReviewPanel';
import { ActionBar, TopBar } from '../components/TopBar';
import { useGameController } from '../game/hooks/useGameController';

function isMatchStatusMessage(message: string): boolean {
  return /^Combo x\d+:| matched! \+\d+$/.test(message);
}

export function App() {
  const game = useGameController();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showIntroStatus, setShowIntroStatus] = useState(true);
  const roundResult = game.roundResult;
  const showResultModal = Boolean(roundResult) && !game.reviewOpen;
  const hasComboDetails = game.comboMatchDetails.some((entry) => entry.combo > 1);
  const shouldShowStatusMessage = !hasComboDetails || !isMatchStatusMessage(game.statusMessage);

  return (
    <main className="app-shell">
      <div className="app-frame">
        <section className="play-area">
          <div className="play-area__board" data-board-size={game.board.length}>
            <TopBar
              levelLabel={game.level.label}
              movesLeft={game.movesLeft}
              score={game.score}
              targetScore={game.targetScore}
              disabled={game.isResolving}
              onOpenLevels={() => game.setLevelPickerOpen(true)}
            />
            <section className="status-panel panel" aria-live="polite">
              {showIntroStatus ? (
                <div className="status-panel__intro" aria-label="Intro">
                  <p>Words come from CEFR levels A1 to B2.</p>
                  <p>Swap adjacent tiles to match at least three related words and earn points.</p>
                  <p>Hit the target score before you run out of moves.</p>
                  <div className="status-panel__intro-footer">
                    <button className="button button--primary" type="button" onClick={() => setShowIntroStatus(false)}>
                      Start
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {hasComboDetails ? (
                    <div className="status-panel__combo-details" aria-label="Combo details">
                      {game.comboMatchDetails.map((entry, index) => (
                        <p key={`${entry.combo}-${index}`}>
                          {entry.combo === 1 ? 'Match' : `Combo x${entry.combo}`}: {entry.words.join(', ')}. +
                          {entry.scoreDelta}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {shouldShowStatusMessage ? <p>{game.statusMessage}</p> : null}
                </>
              )}
            </section>
            <Board
              board={game.board}
              selectedId={game.selectedId}
              removingIds={game.removingIds}
              invalidIds={game.invalidIds}
              hintIds={game.hintIds}
              disabled={game.isResolving || Boolean(game.roundResult) || showIntroStatus}
              reducedMotion={game.reducedMotion}
              spawnOffsets={game.spawnOffsets}
              onTileClick={game.handleTileClick}
            />
            <ActionBar
              disabled={game.isResolving || showIntroStatus}
              onHint={game.handleHint}
              onOpenSettings={() => setSettingsOpen(true)}
              onRestart={game.handleRestart}
            />
          </div>
        </section>
      </div>

      {showResultModal ? (
        <Modal
          title={roundResult?.status === 'won' ? 'Level complete' : 'Out of moves'}
          dismissible={false}
          actions={
            <>
              <button className="button button--ghost" type="button" onClick={() => game.setReviewOpen(true)}>
                Review words
              </button>
              {roundResult?.status === 'won' ? (
                <button
                  className="button button--ghost"
                  type="button"
                  disabled={!game.hasNextLevel}
                  onClick={game.handleNextLevel}
                >
                  Next level
                </button>
              ) : null}
              <button className="button button--primary" type="button" onClick={game.handleRestart}>
                Replay
              </button>
            </>
          }
        >
          <div className="result-summary">
            <div className="stat-chip">
              <span className="stat-chip__label">Score</span>
              <strong>{roundResult?.score}</strong>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Best score</span>
              <strong>{roundResult?.bestScore}</strong>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Steps used</span>
              <strong>{roundResult?.stepsUsed}</strong>
            </div>
          </div>
        </Modal>
      ) : null}

      {game.levelPickerOpen ? (
        <LevelPicker
          levels={game.levels}
          currentLevelId={game.level.id}
          completedLevels={game.completedLevels}
          onSelectLevel={game.handleSelectLevel}
          onClose={() => game.setLevelPickerOpen(false)}
        />
      ) : null}

      {game.reviewOpen ? (
        <ReviewPanel groups={game.reviewGroups} onClose={() => game.setReviewOpen(false)} />
      ) : null}

      {settingsOpen ? (
        <Modal title="Settings" onClose={() => setSettingsOpen(false)}>
          <section className="settings-panel" aria-label="Game settings">
            <div className="settings-row">
              <div className="stack-copy">
                <strong>Sound</strong>
              </div>
              <button className="button button--ghost" type="button" onClick={game.handleToggleSound}>
                {game.soundEnabled ? 'On' : 'Off'}
              </button>
            </div>

            <div className="settings-row">
              <div className="stack-copy">
                <strong>Theme</strong>
              </div>
              <div className="settings-theme-actions">
                <button
                  className={`button button--ghost ${game.theme === 'dark' ? 'button--active' : ''}`.trim()}
                  type="button"
                  onClick={() => game.handleSetTheme('dark')}
                >
                  Dark
                </button>
                <button
                  className={`button button--ghost ${game.theme === 'light' ? 'button--active' : ''}`.trim()}
                  type="button"
                  onClick={() => game.handleSetTheme('light')}
                >
                  Light
                </button>
              </div>
            </div>
          </section>
        </Modal>
      ) : null}
    </main>
  );
}
