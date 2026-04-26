import { describe, expect, it } from 'vitest';
import { glossary } from '../../data/glossary';
import { defaultLevel, levels } from '../../data/levels';
import { GameEngine } from './GameEngine';
import { findFirstLegalMove, findMatches } from './matchDetector';

function normalizeWord(word: string): string {
  return word.trim().toLocaleLowerCase();
}

function createEngine(seed = 'debug-seed') {
  return new GameEngine({
    level: defaultLevel,
    glossary,
    installId: 'test-install-id',
    seedOverride: seed
  });
}

function createGroupTokens(board: ReturnType<GameEngine['getSnapshot']>['board']) {
  const groupTokens = new Map<string, string>();

  for (const group of glossary.groups) {
    for (const word of group.words) {
      board.flat().forEach((tile) => {
        if (tile.word === word.text.en) {
          groupTokens.set(tile.id, group.id);
        }
      });
    }
  }

  return groupTokens;
}

describe('GameEngine MVP board generation', () => {
  it('creates a board that matches the default level size with unique public words and at least one legal move', () => {
    const engine = createEngine();
    const snapshot = engine.getSnapshot();
    const boardCells = defaultLevel.boardSize * defaultLevel.boardSize;

    expect(snapshot.board).toHaveLength(defaultLevel.boardSize);
    expect(snapshot.board.every((row) => row.length === defaultLevel.boardSize)).toBe(true);

    const flatTiles = snapshot.board.flat();
    const uniqueWords = new Set(flatTiles.map((tile) => normalizeWord(tile.word)));

    expect(flatTiles.every((tile) => Object.keys(tile).sort().join(',') === 'id,word')).toBe(true);
    expect(flatTiles).toHaveLength(boardCells);
    expect(uniqueWords.size).toBe(boardCells);

    const boardIds = snapshot.board.map((row) => row.map((tile) => tile.id));
    const groupTokens = createGroupTokens(snapshot.board);

    expect(findMatches(boardIds, groupTokens)).toBeNull();
    expect(findFirstLegalMove(boardIds, groupTokens)).not.toBeNull();
  });

  it('keeps board words unique after repeated refill cycles', () => {
    const targetLevel = levels.find((level) => level.cefr === 'A2');
    expect(targetLevel).toBeDefined();
    const engine = new GameEngine({
      level: targetLevel!,
      glossary,
      installId: 'test-install-id',
      seedOverride: 'unique-refill-seed'
    });

    for (let step = 0; step < 20; step += 1) {
      const snapshot = engine.getSnapshot();
      const flatWords = snapshot.board.flat().map((tile) => normalizeWord(tile.word));
      expect(new Set(flatWords).size, `Board contains duplicate words at step ${step}`).toBe(flatWords.length);

      const hintIds = engine.getFirstLegalMoveIds();
      if (!hintIds) {
        break;
      }

      const positions = new Map<string, { row: number; col: number }>();
      snapshot.board.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
          positions.set(tile.id, { row: rowIndex, col: colIndex });
        });
      });

      const first = positions.get(hintIds[0]);
      const second = positions.get(hintIds[1]);
      expect(first).toBeDefined();
      expect(second).toBeDefined();

      const result = engine.trySwap(first!, second!);
      if (!result.accepted || result.gameStatus !== 'playing') {
        break;
      }
    }
  });

  it('resolves a legal swap into score and move changes', () => {
    const engine = createEngine('legal-move-seed');
    const openingSnapshot = engine.getSnapshot();
    const boardIds = openingSnapshot.board.map((row) => row.map((tile) => tile.id));
    const groupTokens = createGroupTokens(openingSnapshot.board);

    const legalMove = findFirstLegalMove(boardIds, groupTokens);
    expect(legalMove).not.toBeNull();

    const [first, second] = legalMove!;
    const result = engine.trySwap(first, second);

    expect(result.accepted).toBe(true);
    expect(result.movesLeft).toBe(defaultLevel.moves - 1);
    expect(result.score).toBeGreaterThan(0);
    expect(result.resolutionSteps.length).toBeGreaterThan(0);
  });

  it('returns a playable adjacent hint move for every level', () => {
    for (const level of levels) {
      const engine = new GameEngine({
        level,
        glossary,
        installId: 'test-install-id',
        seedOverride: `hint-level-${level.id}`
      });
      const snapshot = engine.getSnapshot();
      const hintIds = engine.getFirstLegalMoveIds();

      expect(hintIds, `Level ${level.id} should have a legal hint move`).not.toBeNull();

      const positions = new Map<string, { row: number; col: number }>();
      snapshot.board.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
          positions.set(tile.id, { row: rowIndex, col: colIndex });
        });
      });

      const [firstId, secondId] = hintIds!;
      const firstPosition = positions.get(firstId);
      const secondPosition = positions.get(secondId);

      expect(firstPosition, `Missing first hint tile on level ${level.id}`).toBeDefined();
      expect(secondPosition, `Missing second hint tile on level ${level.id}`).toBeDefined();

      const manhattanDistance =
        Math.abs(firstPosition!.row - secondPosition!.row) + Math.abs(firstPosition!.col - secondPosition!.col);

      expect(manhattanDistance, `Hint tiles must be adjacent on level ${level.id}`).toBe(1);

      const result = engine.trySwap(firstPosition!, secondPosition!);
      expect(result.accepted, `Hint swap should be accepted on level ${level.id}`).toBe(true);
    }
  });

  it('resolves hinted swaps within a bounded number of steps on every level', () => {
    for (const level of levels) {
      const engine = new GameEngine({
        level,
        glossary,
        installId: 'test-install-id',
        seedOverride: `hint-resolution-${level.id}`
      });
      const snapshot = engine.getSnapshot();
      const boardIds = snapshot.board.map((row) => row.map((tile) => tile.id));
      const legalMove = findFirstLegalMove(boardIds, createGroupTokens(snapshot.board));

      expect(legalMove, `Expected a legal move for level ${level.id}`).not.toBeNull();

      const [first, second] = legalMove!;
      const result = engine.trySwap(first, second);

      expect(result.accepted, `Expected level ${level.id} hinted move to resolve`).toBe(true);
      expect(result.resolutionSteps.length, `Expected bounded resolve steps on level ${level.id}`).toBeLessThanOrEqual(7);
    }
  });
});
