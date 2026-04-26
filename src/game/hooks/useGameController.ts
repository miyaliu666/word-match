import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildSessionGlossary, loadGlossaryForCefr } from '../../data/glossaryRuntime';
import { defaultLevel, levels } from '../../data/levels';
import { loadInstall } from '../../storage/installStorage';
import { getDefaultProgress, loadProgress, saveProgress, type ProgressData } from '../../storage/progressStorage';
import { getDefaultSettings, loadSettings, saveSettings, type SettingsData } from '../../storage/settingsStorage';
import {
  TILE_INVALID_ANIMATION_MS,
  TILE_MOVE_ANIMATION_MS,
  TILE_REMOVE_ANIMATION_MS,
  TILE_SPAWN_ANIMATION_MS
} from '../animation/timings';
import { audioManager } from '../audio/AudioManager';
import { createRandom, createSeed } from '../engine/seedRandom';
import { GameEngine } from '../engine/GameEngine';
import type { BoardPosition, GameStatus, ReviewGroup } from '../engine/types.public';

const SWAP_DELAY = TILE_MOVE_ANIMATION_MS;
const INVALID_DELAY = TILE_INVALID_ANIMATION_MS;
const REMOVE_DELAY = TILE_REMOVE_ANIMATION_MS;
const FALL_DELAY = TILE_SPAWN_ANIMATION_MS;
const SHUFFLE_DELAY = TILE_MOVE_ANIMATION_MS;
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

function playSound(event: Parameters<typeof audioManager.play>[0], enabled: boolean): void {
  audioManager.play(event, enabled).catch(() => {
    // Ignore non-critical audio failures so gameplay timing stays deterministic.
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
  const [swapPreviewIds, setSwapPreviewIds] = useState<string[]>([]);
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
    async (levelId: number, nextStatus = 'Fresh board loaded.') => {
      roundTokenRef.current += 1;
      const roundToken = roundTokenRef.current;
      window.clearTimeout(hintTimerRef.current);
      const install = loadInstall();
      const nextLevel = levels.find((entry) => entry.id === levelId) ?? defaultLevel;
      setStatusMessage('Loading level...');
      setIsResolving(true);

      const sourceGlossary = await loadGlossaryForCefr(nextLevel.cefr);
      const sessionSeed = createSeed(nextLevel.id, install.installId, debugSeed ? `${debugSeed}:session` : undefined);
      const sessionGlossary = buildSessionGlossary(nextLevel, sourceGlossary, createRandom(sessionSeed));

      if (roundToken !== roundTokenRef.current) {
        return;
      }

      const engine = new GameEngine({
        level: nextLevel,
        glossary: sessionGlossary,
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
      setSwapPreviewIds([]);
      setInvalidIds([]);
      setRemovingIds([]);
      setSpawnOffsets({});
      setReviewGroups([]);
      setReviewOpen(false);
      setRoundResult(null);
      setHintIds([]);
      setComboMatchDetails([]);

      const nextProgress: ProgressData = {
        ...progressRef.current,
        lastLevelId: nextLevel.id
      };
      progressRef.current = nextProgress;
      saveProgress(nextProgress);
      setBestScore(nextProgress.bestScores[nextLevel.id] ?? 0);

      setIsResolving(false);
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

    buildLevel(progress.lastLevelId, 'Board ready.').catch(() => {
      setStatusMessage('Failed to load board. Please retry.');
      setIsResolving(false);
    });
  }, [buildLevel]);

  const persistSettings = useCallback((nextSettings: SettingsData) => {
    settingsRef.current = nextSettings;
    saveSettings(nextSettings);
  }, []);

  useEffect(() => {
    document.body.classList.remove('dark-palette', 'light-palette');
    document.body.classList.add(theme === 'light' ? 'light-palette' : 'dark-palette');
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const warmupAudio = () => {
      if (!settingsRef.current.soundEnabled) {
        return;
      }

      audioManager.ensureReady().catch(() => {
        // Ignore warmup failures and keep game playable.
      });
    };

    window.addEventListener('pointerdown', warmupAudio, { passive: true });
    window.addEventListener('keydown', warmupAudio);

    return () => {
      window.removeEventListener('pointerdown', warmupAudio);
      window.removeEventListener('keydown', warmupAudio);
    };
  }, []);

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

      playSound(status === 'won' ? 'level_complete' : 'level_failed', settingsRef.current.soundEnabled);
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
      await audioManager.ensureReady();
      await audioManager.play('select', true);
    }
  }, [persistSettings]);

  const handleToggleReducedMotion = useCallback(() => {
    const nextValue = !(settingsRef.current.reducedMotion ?? false);
    const nextSettings: SettingsData = {
      ...settingsRef.current,
      reducedMotion: nextValue
    };

    setReducedMotion(nextValue);
    persistSettings(nextSettings);
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

    hintTimerRef.current = window.setTimeout(clearHint, 5000);
  }, [clearHint, isResolving, roundResult]);

  const handleRestart = useCallback(() => {
    buildLevel(level.id).catch(() => {
      setStatusMessage('Failed to reload level. Please retry.');
      setIsResolving(false);
    });
  }, [buildLevel, level.id]);

  const handleSelectLevel = useCallback(
    (levelId: number) => {
      if (isResolving) {
        return;
      }

      buildLevel(levelId).catch(() => {
        setStatusMessage('Failed to open level. Please retry.');
        setIsResolving(false);
      });
      setLevelPickerOpen(false);
    },
    [buildLevel, isResolving]
  );

  const hasNextLevel = levels.some((entry) => entry.id === level.id + 1);

  const handleNextLevel = useCallback(() => {
    if (isResolving || !hasNextLevel) {
      return;
    }

    buildLevel(level.id + 1, 'Next level ready.').catch(() => {
      setStatusMessage('Failed to open next level. Please retry.');
      setIsResolving(false);
    });
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
        audioManager.ensureReady();
      }

      const tile = board[row]?.[col];
      if (!tile) {
        return;
      }

      if (!selectedPosition) {
        setSelectedPosition({ row, col });
        setSelectedId(tile.id);
        setStatusMessage('Tile selected. Choose a neighbor to swap.');
        playSound('select', settingsRef.current.soundEnabled);
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
        playSound('select', settingsRef.current.soundEnabled);
        return;
      }

      setIsResolving(true);
      setSwapPreviewIds([selectedId, tile.id].filter((id): id is string => Boolean(id)));
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
          playSound('invalid', settingsRef.current.soundEnabled);
          await wait(INVALID_DELAY, reducedMotion);
          if (!isCurrentRound()) {
            return;
          }
          setBoard(result.revertedBoard);
          setSwapPreviewIds([]);
          setInvalidIds([]);
          return;
        }

        playSound('swap', settingsRef.current.soundEnabled);
        await wait(SWAP_DELAY, reducedMotion);
        if (!isCurrentRound()) {
          return;
        }
        setSwapPreviewIds([]);

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
            playSound(step.combo > 1 ? 'combo' : 'match', settingsRef.current.soundEnabled);
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
            playSound('shuffle', settingsRef.current.soundEnabled);
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
        setSwapPreviewIds([]);
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
    selectedIds: Array.from(new Set([selectedId, ...swapPreviewIds].filter((id): id is string => Boolean(id)))),
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
    handleToggleReducedMotion,
    handleSetTheme,
    handleRestart,
    handleNextLevel,
    handleSelectLevel,
    handleTileClick,
    handleHint
  };
}