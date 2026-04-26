import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { glossary } from '../../data/glossary.js';
import { defaultLevel, levels } from '../../data/levels';
import { loadInstall } from '../../storage/installStorage';
import { getDefaultProgress, loadProgress, saveProgress, type ProgressData } from '../../storage/progressStorage';
import { getDefaultSettings, loadSettings, saveSettings, type SettingsData } from '../../storage/settingsStorage';
import { audioManager } from '../audio/AudioManager';
import { GameEngine } from '../engine/GameEngine';
import type { BoardPosition, GameStatus, ReviewGroup } from '../engine/types.public';

const SWAP_DELAY = 150;
const REMOVE_DELAY = 300;
const FALL_DELAY = 350;
const SHUFFLE_DELAY = 220;
const ROUND_RESULT_MODAL_DELAY = 1200;

type RoundResult = {
  status: Exclude<GameStatus, 'playing'>;
  score: number;
  bestScore: number;
  stepsUsed: number;
};

type ComboMatchDetail = {
  combo: number;
  words: string[];
  scoreDelta: number;
};

function wait(ms: number, reducedMotion: boolean): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, reducedMotion ? 0 : ms);
  });
}

export function useGameController() {
  const engineRef = useRef<GameEngine | null>(null);
  const progressRef = useRef<ProgressData>(getDefaultProgress());
  const settingsRef = useRef<SettingsData>(getDefaultSettings());
  const roundTokenRef = useRef(0);
  const hintTimerRef = useRef(0);
  const debugSeed = useMemo(
    () => new URLSearchParams(window.location.search).get('seed') ?? undefined,
    []
  );

  const [board, setBoard] = useState(() => [] as ReturnType<GameEngine['getSnapshot']>['board']);
  const [level, setLevel] = useState(defaultLevel);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(defaultLevel.moves);
  const [targetScore, setTargetScore] = useState(defaultLevel.targetScore);
  const [statusMessage, setStatusMessage] = useState('Loading...');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<BoardPosition | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [invalidIds, setInvalidIds] = useState<string[]>([]);
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const [spawnOffsets, setSpawnOffsets] = useState<Record<string, number>>({});
  const [levelPickerOpen, setLevelPickerOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewGroups, setReviewGroups] = useState<ReviewGroup[]>([]);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [bestScore, setBestScore] = useState(0);
  const [isResolving, setIsResolving] = useState(false);
  const [hintIds, setHintIds] = useState<string[]>([]);
  const [comboMatchDetails, setComboMatchDetails] = useState<ComboMatchDetail[]>([]);

  const buildLevel = useCallback(
    (levelId: number, nextStatus = 'Fresh board loaded.') => {
      roundTokenRef.current += 1;
      window.clearTimeout(hintTimerRef.current);
      const install = loadInstall();
      const nextLevel = levels.find((entry) => entry.id === levelId) ?? defaultLevel;
      const engine = new GameEngine({
        level: nextLevel,
        glossary,
        installId: install.installId,
        seedOverride: debugSeed
      });

      engineRef.current = engine;
      const snapshot = engine.getSnapshot();
      setBoard(snapshot.board);
      setLevel(snapshot.level);
      setScore(snapshot.score);
      setMovesLeft(snapshot.movesLeft);
      setTargetScore(snapshot.targetScore);
      setStatusMessage(nextStatus);
      setSelectedPosition(null);
      setSelectedId(null);
      setInvalidIds([]);
      setRemovingIds([]);
      setSpawnOffsets({});
      setReviewGroups([]);
      setReviewOpen(false);
      setRoundResult(null);
      setIsResolving(false);
      setHintIds([]);
      setComboMatchDetails([]);

      const nextProgress: ProgressData = {
        ...progressRef.current,
        lastLevelId: nextLevel.id
      };
      progressRef.current = nextProgress;
      saveProgress(nextProgress);
      setBestScore(nextProgress.bestScores[nextLevel.id] ?? 0);
    },
    [debugSeed]
  );

  useEffect(() => {
    const settings = loadSettings();
    const progress = loadProgress();
    loadInstall();

    settingsRef.current = settings;
    progressRef.current = progress;

    setSoundEnabled(settings.soundEnabled);
    setTheme(settings.theme);
    setReducedMotion(settings.reducedMotion ?? false);
    setUnlockedLevel(progress.unlockedLevel);
    setCompletedLevels(progress.completedLevels);

    buildLevel(progress.lastLevelId, 'Board ready.');
  }, [buildLevel]);

  const persistSettings = useCallback((nextSettings: SettingsData) => {
    settingsRef.current = nextSettings;
    saveSettings(nextSettings);
  }, []);

  useEffect(() => {
    document.body.classList.remove('dark-palette', 'light-palette');
    document.body.classList.add(theme === 'light' ? 'light-palette' : 'dark-palette');
  }, [theme]);

  const persistProgress = useCallback((nextProgress: ProgressData) => {
    progressRef.current = nextProgress;
    saveProgress(nextProgress);
    setUnlockedLevel(nextProgress.unlockedLevel);
    setCompletedLevels(nextProgress.completedLevels);
    setBestScore(nextProgress.bestScores[level.id] ?? 0);
  }, [level.id]);

  const finalizeRound = useCallback(
    async (status: Exclude<GameStatus, 'playing'>, finalScore: number, movesRemaining: number) => {
      const currentProgress = progressRef.current;
      const bestForLevel = Math.max(currentProgress.bestScores[level.id] ?? 0, finalScore);
      const completedLevelsNext =
        status === 'won'
          ? Array.from(new Set([...currentProgress.completedLevels, level.id])).sort((left, right) => left - right)
          : currentProgress.completedLevels;
      const nextProgress: ProgressData = {
        ...currentProgress,
        completedLevels: completedLevelsNext,
        bestScores: {
          ...currentProgress.bestScores,
          [level.id]: bestForLevel
        },
        unlockedLevel: Math.max(currentProgress.unlockedLevel, level.id),
        lastLevelId: level.id
      };

      persistProgress(nextProgress);
      setReviewGroups(engineRef.current?.getReviewGroups() ?? []);
      setRoundResult({
        status,
        score: finalScore,
        bestScore: bestForLevel,
        stepsUsed: Math.max(level.moves - movesRemaining, 0)
      });
      setStatusMessage(status === 'won' ? 'Level complete.' : 'Out of moves.');

      await audioManager.play(status === 'won' ? 'level_complete' : 'level_failed', settingsRef.current.soundEnabled);
    },
    [level.id, persistProgress]
  );

  const handleToggleSound = useCallback(async () => {
    const nextValue = !settingsRef.current.soundEnabled;
    const nextSettings: SettingsData = {
      ...settingsRef.current,
      soundEnabled: nextValue
    };

    setSoundEnabled(nextValue);
    persistSettings(nextSettings);

    if (nextValue) {
      await audioManager.play('select', true);
    }
  }, [persistSettings]);

  const handleSetTheme = useCallback(
    (nextTheme: 'dark' | 'light') => {
      if (settingsRef.current.theme === nextTheme) {
        return;
      }

      const nextSettings: SettingsData = {
        ...settingsRef.current,
        theme: nextTheme
      };

      setTheme(nextTheme);
      persistSettings(nextSettings);
    },
    [persistSettings]
  );

  const clearHint = useCallback(() => {
    setHintIds([]);
    hintTimerRef.current = 0;
  }, []);

  const handleHint = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || isResolving || Boolean(roundResult)) {
      return;
    }

    window.clearTimeout(hintTimerRef.current);
    const moveIds = engine.getFirstLegalMoveIds();
    if (!moveIds) {
      setStatusMessage('No moves found — shuffling...');
      return;
    }

    setHintIds([moveIds[0], moveIds[1]]);
    setStatusMessage('Try this match.');

    if (settingsRef.current.soundEnabled) {
      audioManager.play('select', true).catch(() => {});
    }

    hintTimerRef.current = window.setTimeout(clearHint, 5000);
  }, [clearHint, isResolving, roundResult]);

  const handleRestart = useCallback(() => {
    buildLevel(level.id);
  }, [buildLevel, level.id]);

  const handleSelectLevel = useCallback(
    (levelId: number) => {
      if (isResolving) {
        return;
      }

      buildLevel(levelId);
      setLevelPickerOpen(false);
    },
    [buildLevel, isResolving]
  );

  const hasNextLevel = levels.some((entry) => entry.id === level.id + 1);

  const handleNextLevel = useCallback(() => {
    if (isResolving || !hasNextLevel) {
      return;
    }

    buildLevel(level.id + 1, 'Next level ready.');
  }, [buildLevel, hasNextLevel, isResolving, level.id]);

  const handleTileClick = useCallback(
    async (row: number, col: number) => {
      const engine = engineRef.current;
      if (!engine || isResolving || Boolean(roundResult) || levelPickerOpen || reviewOpen) {
        return;
      }

      window.clearTimeout(hintTimerRef.current);
      clearHint();

      if (settingsRef.current.soundEnabled) {
        await audioManager.ensureReady();
      }

      const tile = board[row]?.[col];
      if (!tile) {
        return;
      }

      if (!selectedPosition) {
        setSelectedPosition({ row, col });
        setSelectedId(tile.id);
        setStatusMessage('Tile selected. Choose a neighbor to swap.');
        await audioManager.play('select', settingsRef.current.soundEnabled);
        return;
      }

      if (selectedPosition.row === row && selectedPosition.col === col) {
        setSelectedPosition(null);
        setSelectedId(null);
        setStatusMessage('Selection cleared.');
        return;
      }

      const rowDelta = Math.abs(selectedPosition.row - row);
      const colDelta = Math.abs(selectedPosition.col - col);

      if (rowDelta + colDelta !== 1) {
        setSelectedPosition({ row, col });
        setSelectedId(tile.id);
        setStatusMessage('Choose a neighboring tile to swap.');
        await audioManager.play('select', settingsRef.current.soundEnabled);
        return;
      }

      setIsResolving(true);
      setSelectedPosition(null);
      setSelectedId(null);
      setSpawnOffsets({});
      setComboMatchDetails([]);
      const roundToken = roundTokenRef.current;

      const isCurrentRound = () => roundTokenRef.current === roundToken;
      try {
        const result = engine.trySwap(selectedPosition, { row, col });
        setBoard(result.boardAfterSwap);
        setMovesLeft(result.movesLeft);

        if (!result.accepted) {
          setStatusMessage(result.status);
          setInvalidIds(result.swapIds);
          await audioManager.play('invalid', settingsRef.current.soundEnabled);
          await wait(SWAP_DELAY, reducedMotion);
          if (!isCurrentRound()) {
            return;
          }
          setBoard(result.revertedBoard);
          setInvalidIds([]);
          return;
        }

        await audioManager.play('swap', settingsRef.current.soundEnabled);
        await wait(SWAP_DELAY, reducedMotion);
        if (!isCurrentRound()) {
          return;
        }

        for (const step of result.resolutionSteps) {
          if (step.kind === 'match') {
            setComboMatchDetails((previous) => [
              ...previous,
              {
                combo: step.combo,
                words: step.matchedWords,
                scoreDelta: step.scoreDelta
              }
            ]);
            setRemovingIds(step.matchedIds);
            setStatusMessage(step.status);
            await audioManager.play(step.combo > 1 ? 'combo' : 'match', settingsRef.current.soundEnabled);
            await wait(REMOVE_DELAY, reducedMotion);
            if (!isCurrentRound()) {
              return;
            }
            setRemovingIds([]);
            setBoard(step.nextBoard);
            setSpawnOffsets(step.spawnOffsets);
            setScore(step.scoreTotal);
            await wait(FALL_DELAY, reducedMotion);
            if (!isCurrentRound()) {
              return;
            }
          } else {
            setBoard(step.nextBoard);
            setSpawnOffsets({});
            setStatusMessage(step.status);
            await audioManager.play('shuffle', settingsRef.current.soundEnabled);
            await wait(SHUFFLE_DELAY, reducedMotion);
            if (!isCurrentRound()) {
              return;
            }
          }
        }

        if (result.gameStatus === 'won' || result.gameStatus === 'lost') {
          await wait(ROUND_RESULT_MODAL_DELAY, reducedMotion);
          if (!isCurrentRound()) {
            return;
          }
          await finalizeRound(result.gameStatus, result.score, result.movesLeft);
        } else {
          setScore(result.score);
          setStatusMessage(result.status);
        }
      } catch (error) {
        if (!isCurrentRound()) {
          return;
        }
        setStatusMessage('Move failed unexpectedly. Try again.');
        setComboMatchDetails([]);
        setInvalidIds([]);
        setRemovingIds([]);
        setSpawnOffsets({});
        console.error('Failed to resolve tile swap.', error);
      } finally {
        if (isCurrentRound()) {
          setIsResolving(false);
        }
      }
    },
    [
      board,
      clearHint,
      finalizeRound,
      isResolving,
      levelPickerOpen,
      reducedMotion,
      reviewOpen,
      roundResult,
      selectedPosition
    ]
  );

  return {
    board,
    level,
    levels,
    score,
    bestScore,
    movesLeft,
    targetScore,
    statusMessage,
    soundEnabled,
    theme,
    reducedMotion,
    selectedId,
    invalidIds,
    removingIds,
    hintIds,
    comboMatchDetails,
    spawnOffsets,
    levelPickerOpen,
    reviewOpen,
    reviewGroups,
    roundResult,
    unlockedLevel,
    completedLevels,
    hasNextLevel,
    isResolving,
    setLevelPickerOpen: (nextOpen: boolean) => {
      if (isResolving && nextOpen) {
        return;
      }

      setLevelPickerOpen(nextOpen);
    },
    setReviewOpen,
    setRoundResult,
    handleToggleSound,
    handleSetTheme,
    handleRestart,
    handleNextLevel,
    handleSelectLevel,
    handleTileClick,
    handleHint
  };
}