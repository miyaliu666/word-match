import type { Glossary } from '../../data/glossary';
import type { LevelDefinition } from '../../data/levels';
import { findMatches, hasLegalMove } from './matchDetector';
import { sampleWithoutReplacement, shuffleArray } from './seedRandom';
import type { ActiveGroupState, GeneratedBoardState, InternalBoard, TileMeta, WordMeta } from './types.internal';

function normalizeWord(word: string): string {
  return word.trim().toLocaleLowerCase();
}

function createBoard(size: number, ids: string[]): InternalBoard {
  const board: InternalBoard = [];

  for (let row = 0; row < size; row += 1) {
    board.push(ids.slice(row * size, row * size + size));
  }

  return board;
}

function getInitialWordCounts(level: LevelDefinition): number[] {
  const boardCells = level.boardSize * level.boardSize;
  const minimumRequiredCells = level.groupsPerBoard * level.minWordsPerGroup;

  if (minimumRequiredCells > boardCells) {
    throw new Error('Level configuration requires more tiles than the board can hold.');
  }

  const counts = Array.from({ length: level.groupsPerBoard }, () => level.minWordsPerGroup);
  let remainingCells = boardCells - minimumRequiredCells;
  let groupIndex = 0;

  while (remainingCells > 0) {
    counts[groupIndex] += 1;
    remainingCells -= 1;
    groupIndex = (groupIndex + 1) % counts.length;
  }

  const maxCount = Math.max(...counts);

  if (maxCount > level.maxWordsPerGroup) {
    throw new Error('Level configuration exceeds the maximum words per group.');
  }

  return counts;
}

export function generateBoardState(
  level: LevelDefinition,
  glossary: Glossary,
  random: () => number,
  maxAttempts = 400
): GeneratedBoardState {
  const initialWordCounts = getInitialWordCounts(level);
  const maxInitialWordsPerGroup = Math.max(...initialWordCounts);
  const eligibleGroups = glossary.groups.filter(
    (group) => group.cefr === level.cefr && group.words.length >= maxInitialWordsPerGroup
  );

  if (eligibleGroups.length < level.groupsPerBoard) {
    throw new Error('Not enough groups to generate a playable board.');
  }

  const selectedGroups = sampleWithoutReplacement(eligibleGroups, level.groupsPerBoard, random);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const tileMetaById = new Map<string, TileMeta>();
    const groupTokenByTileId = new Map<string, string>();
    const wordMetaByWordId = new Map<string, WordMeta>();
    const activeGroups: ActiveGroupState[] = [];
    const seenWordIds = new Set<string>();
    const boardTileIds: string[] = [];
    const boardWords = new Set<string>();
    let tileCounter = 0;
    let validSelection = true;

    selectedGroups.forEach((group, index) => {
      const selectedWords = sampleWithoutReplacement(group.words, initialWordCounts[index]!, random);

      if (selectedWords.some((word) => boardWords.has(normalizeWord(word.text.en)))) {
        validSelection = false;
        return;
      }

      activeGroups.push({
        token: group.id,
        label: group.displayName.en,
        words: group.words,
        unusedWordIds: group.words
          .filter((word) => !selectedWords.some((selectedWord) => selectedWord.id === word.id))
          .map((word) => word.id)
      });

      for (const word of group.words) {
        wordMetaByWordId.set(word.id, {
          wordId: word.id,
          text: word.text,
          groupToken: group.id,
          groupLabel: group.displayName.en
        });
      }

      for (const word of selectedWords) {
        const tileId = `t_${attempt}_${tileCounter}_${word.id}`;
        tileCounter += 1;
        tileMetaById.set(tileId, {
          id: tileId,
          word: word.text.en,
          translation: word.text.zh,
          wordId: word.id
        });
        groupTokenByTileId.set(tileId, group.id);
        boardTileIds.push(tileId);
        boardWords.add(normalizeWord(word.text.en));
        seenWordIds.add(word.id);
      }
    });

    if (!validSelection) {
      continue;
    }

    for (let layoutAttempt = 0; layoutAttempt < maxAttempts; layoutAttempt += 1) {
      const boardIds = createBoard(level.boardSize, shuffleArray(boardTileIds, random));

      if (!findMatches(boardIds, groupTokenByTileId) && hasLegalMove(boardIds, groupTokenByTileId)) {
        return {
          boardIds,
          tileMetaById,
          groupTokenByTileId,
          wordMetaByWordId,
          activeGroups,
          seenWordIds
        };
      }
    }
  }

  throw new Error('Unable to generate a valid opening board.');
}
