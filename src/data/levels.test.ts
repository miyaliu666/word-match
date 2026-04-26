import { describe, expect, it } from 'vitest';
import { glossary } from './glossary';
import { levels } from './levels';
import { generateBoardState } from '../game/engine/boardGenerator';
import { createRandom } from '../game/engine/seedRandom';

describe('level progression data', () => {
  it('uses a fixed 4x4 board across all levels', () => {
    expect(levels.every((level) => level.boardSize === 4)).toBe(true);
  });

  it('uses the CEFR split A1(6) / A2(6) / B1(5) / B2(3)', () => {
    expect(levels.filter((level) => level.cefr === 'A1')).toHaveLength(6);
    expect(levels.filter((level) => level.cefr === 'A2')).toHaveLength(6);
    expect(levels.filter((level) => level.cefr === 'B1')).toHaveLength(5);
    expect(levels.filter((level) => level.cefr === 'B2')).toHaveLength(3);
  });

  it('keeps target scores smoothly increasing across levels', () => {
    for (let index = 1; index < levels.length; index += 1) {
      expect(levels[index]!.targetScore).toBeGreaterThan(levels[index - 1]!.targetScore);
    }
  });

  it('can generate a full playable board for every defined level', () => {
    levels.forEach((level) => {
      const generated = generateBoardState(level, glossary, createRandom(`level-${level.id}`));
      const flatBoard = generated.boardIds.flat();

      expect(generated.boardIds).toHaveLength(level.boardSize);
      expect(generated.boardIds.every((row) => row.length === level.boardSize)).toBe(true);
      expect(flatBoard.every((tileId) => tileId !== null)).toBe(true);
      expect(flatBoard).toHaveLength(level.boardSize * level.boardSize);
      expect(generated.activeGroups).toHaveLength(level.groupsPerBoard);
    });
  });
});
