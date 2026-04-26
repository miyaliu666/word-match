import type { Glossary } from '../../data/glossary';
import type { LevelDefinition } from '../../data/levels';
import { generateBoardState } from './boardGenerator';
import { applyGravityAndRefill } from './gravity';
import { areAdjacent, findFirstLegalMove, findMatches, swapPositions, hasLegalMove } from './matchDetector';
import { createRandom, createSeed, pickOne } from './seedRandom';
import { shuffleStableBoard } from './shuffle';
import { scoreMatch } from './scoring';
import type {
  BoardPosition,
  GameSnapshot,
  GameStatus,
  PublicBoard,
  ReviewGroup,
  SwapResult
} from './types.public';
import type { ActiveGroupState, InternalBoard, MatchSummary, TileMeta, WordMeta } from './types.internal';

type GameEngineOptions = {
  level: LevelDefinition;
  glossary: Glossary;
  installId: string;
  seedOverride?: string;
};

type PublicBoardContext = {
  boardIds: InternalBoard;
  tileMetaById: Map<string, TileMeta>;
};

// Limit how far automatic cascades can run from a single player swap.
// This keeps combo rewarding without letting one hinted move snowball
// into a near-auto-win.
const MAX_RESOLUTION_STEPS = 3;

function normalizeWord(word: string): string {
  return word.trim().toLocaleLowerCase();
}

function matchedWordsLabel(tileIds: string[], tileMetaById: Map<string, TileMeta>): string[] {
  return [...new Set(tileIds.map((id) => tileMetaById.get(id)?.word).filter((w): w is string => Boolean(w)))].sort(
    (a, b) => a.localeCompare(b)
  );
}

/**
 * Creates a stable signature based on word IDs rather than tile IDs.
 * Tile IDs change when tiles are spawned (due to tileCounter), so using
 * word IDs provides stable repeat detection across the resolution chain.
 */
function createStableBoardSignature(
  board: InternalBoard,
  tileMetaById: Map<string, TileMeta>
): string {
  return board
    .map((row) =>
      row
        .map((tileId) => {
          const meta = tileId ? tileMetaById.get(tileId) : null;
          return meta?.wordId ?? '';
        })
        .join(',')
    )
    .join('||');
}

export class GameEngine {
  private readonly glossary: Glossary;

  private readonly level: LevelDefinition;

  private readonly seed: string;

  private readonly random: () => number;

  private boardIds: InternalBoard;

  private readonly tileMetaById: Map<string, TileMeta>;

  private readonly groupTokenByTileId: Map<string, string>;

  private readonly wordMetaByWordId: Map<string, WordMeta>;

  private readonly activeGroups: ActiveGroupState[];

  private readonly seenWordIds: Set<string>;

  private score = 0;

  private movesLeft: number;

  private status: GameStatus = 'playing';

  private statusMessage = 'Swap nearby words to match three related terms.';

  private tileCounter = 10_000;

  constructor(options: GameEngineOptions) {
    this.glossary = options.glossary;
    this.level = options.level;
    this.seed = createSeed(options.level.id, options.installId, options.seedOverride);
    this.random = createRandom(this.seed);

    const generated = generateBoardState(this.level, this.glossary, this.random);
    this.boardIds = generated.boardIds;
    this.tileMetaById = generated.tileMetaById;
    this.groupTokenByTileId = generated.groupTokenByTileId;
    this.wordMetaByWordId = generated.wordMetaByWordId;
    this.activeGroups = generated.activeGroups;
    this.seenWordIds = generated.seenWordIds;
    this.movesLeft = this.level.moves;
  }

  /**
   * Returns the IDs of the two tiles that form the first legal (match-producing)
   * adjacent pair on the board, or null if no such move exists.
   */
  getFirstLegalMoveIds(): [string, string] | null {
    const move = findFirstLegalMove(this.boardIds, this.groupTokenByTileId);
    if (!move) {
      return null;
    }
    return [this.boardIds[move[0].row][move[0].col]!, this.boardIds[move[1].row][move[1].col]!];
  }

  getSnapshot(): GameSnapshot {
    return {
      board: this.getPublicBoard(),
      level: this.level,
      score: this.score,
      movesLeft: this.movesLeft,
      targetScore: this.level.targetScore,
      status: this.status,
      statusMessage: this.statusMessage
    };
  }

  getReviewGroups(): ReviewGroup[] {
    const groups = new Map<string, ReviewGroup>();

    for (const wordId of this.seenWordIds) {
      const wordMeta = this.wordMetaByWordId.get(wordId);
      if (!wordMeta) {
        continue;
      }

      const existing = groups.get(wordMeta.groupLabel) ?? {
        label: wordMeta.groupLabel,
        words: []
      };

      existing.words.push({
        id: wordMeta.wordId,
        word: wordMeta.text.en,
        translation: wordMeta.text.zh
      });

      groups.set(wordMeta.groupLabel, existing);
    }

    return [...groups.values()]
      .map((group) => ({
        ...group,
        words: group.words.sort((left, right) => left.word.localeCompare(right.word))
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }

  trySwap(first: BoardPosition, second: BoardPosition): SwapResult {
    if (this.status !== 'playing') {
      return {
        accepted: false,
        boardAfterSwap: this.getPublicBoard(),
        revertedBoard: this.getPublicBoard(),
        resolutionSteps: [],
        movesLeft: this.movesLeft,
        score: this.score,
        gameStatus: 'playing',
        status: this.statusMessage,
        swapIds: [this.boardIds[first.row][first.col]!, this.boardIds[second.row][second.col]!]
      };
    }

    if (!areAdjacent(first, second)) {
      return {
        accepted: false,
        boardAfterSwap: this.getPublicBoard(),
        revertedBoard: this.getPublicBoard(),
        resolutionSteps: [],
        movesLeft: this.movesLeft,
        score: this.score,
        gameStatus: 'playing',
        status: 'Choose a neighboring tile.',
        swapIds: [this.boardIds[first.row][first.col]!, this.boardIds[second.row][second.col]!]
      };
    }

    const swappedBoard = swapPositions(this.boardIds, first, second);
    const boardAfterSwap = this.getPublicBoard({ boardIds: swappedBoard, tileMetaById: this.tileMetaById });
    const swapIds: [string, string] = [
      swappedBoard[first.row][first.col]!,
      swappedBoard[second.row][second.col]!
    ];
    const openingMatch = findMatches(swappedBoard, this.groupTokenByTileId);

    if (!openingMatch) {
      this.statusMessage = 'No match.';
      return {
        accepted: false,
        boardAfterSwap,
        revertedBoard: this.getPublicBoard(),
        resolutionSteps: [],
        movesLeft: this.movesLeft,
        score: this.score,
        gameStatus: 'playing',
        status: this.statusMessage,
        swapIds
      };
    }

    this.boardIds = swappedBoard;
    this.movesLeft -= 1;

    const steps = [] as Extract<SwapResult, { accepted: true }>['resolutionSteps'];
    let currentMatch: MatchSummary | null = openingMatch;
    let combo = 1;
    const seenBoardStates = new Set<string>();

    while (currentMatch) {
      const scoreDelta = scoreMatch(currentMatch.lineLengths, combo);
      this.score += scoreDelta;

      for (const tileId of currentMatch.ids) {
        const tileMeta = this.tileMetaById.get(tileId);
        if (tileMeta) {
          this.seenWordIds.add(tileMeta.wordId);
        }
      }

      this.removeMatchedTiles(currentMatch.ids);
      const spawnOffsets = applyGravityAndRefill(this.boardIds, () => this.spawnTileId());

      const words = matchedWordsLabel(currentMatch.ids, this.tileMetaById);
      const matchStatus =
        combo === 1
          ? words.length > 0
            ? `${words.join(', ')} matched! +${scoreDelta}`
            : `Nice match. +${scoreDelta}`
          : words.length > 0
            ? `Combo x${combo}: ${words.join(', ')}. +${scoreDelta}`
            : `Combo x${combo}. +${scoreDelta}`;

      steps.push({
        kind: 'match',
        matchedIds: currentMatch.ids,
        matchedWords: words,
        scoreDelta,
        nextBoard: this.getPublicBoard(),
        spawnOffsets,
        combo,
        scoreTotal: this.score,
        status: matchStatus
      });

      // Use stable signature based on word IDs, not tile IDs, to properly
      // detect repeated board states across the resolution chain
      const boardSignature = createStableBoardSignature(this.boardIds, this.tileMetaById);
      const repeatedBoardState = seenBoardStates.has(boardSignature);
      seenBoardStates.add(boardSignature);

      if (repeatedBoardState || steps.length >= MAX_RESOLUTION_STEPS) {
        this.boardIds = shuffleStableBoard(this.boardIds, this.groupTokenByTileId, this.random);
        this.statusMessage = repeatedBoardState
          ? 'Board stabilized.'
          : (steps[steps.length - 1]?.status ?? 'Board stabilized.');
        steps.push({
          kind: 'shuffle',
          matchedIds: [],
          matchedWords: [],
          scoreDelta: 0,
          nextBoard: this.getPublicBoard(),
          spawnOffsets: {},
          combo: 0,
          scoreTotal: this.score,
          status: this.statusMessage
        });
        currentMatch = null;
        break;
      }

      combo += 1;
      currentMatch = findMatches(this.boardIds, this.groupTokenByTileId);
    }

    if (this.score >= this.level.targetScore) {
      this.status = 'won';
      this.statusMessage = 'Level complete.';
    } else if (this.movesLeft <= 0) {
      this.status = 'lost';
      this.statusMessage = 'Out of moves.';
    } else if (!hasLegalMove(this.boardIds, this.groupTokenByTileId)) {
      this.boardIds = shuffleStableBoard(this.boardIds, this.groupTokenByTileId, this.random);
      this.statusMessage = 'Shuffling...';
      steps.push({
        kind: 'shuffle',
        matchedIds: [],
        matchedWords: [],
        scoreDelta: 0,
        nextBoard: this.getPublicBoard(),
        spawnOffsets: {},
        combo: 0,
        scoreTotal: this.score,
        status: this.statusMessage
      });
    } else {
      this.statusMessage = steps[steps.length - 1]?.status ?? 'Board stable.';
    }

    return {
      accepted: true,
      boardAfterSwap,
      resolutionSteps: steps,
      movesLeft: this.movesLeft,
      score: this.score,
      gameStatus: this.status,
      status: this.statusMessage,
      swapIds
    };
  }

  private getPublicBoard(context?: PublicBoardContext): PublicBoard {
    const boardIds = context?.boardIds ?? this.boardIds;
    const tileMetaById = context?.tileMetaById ?? this.tileMetaById;

    return boardIds.map((row) =>
      row.map((tileId) => {
        if (!tileId) {
          throw new Error('Board unexpectedly contains an empty tile.');
        }

        const tile = tileMetaById.get(tileId);
        if (!tile) {
          throw new Error(`Missing tile metadata for ${tileId}.`);
        }

        return {
          id: tile.id,
          word: tile.word
        };
      })
    );
  }

  private removeMatchedTiles(tileIds: string[]): void {
    const matchedSet = new Set(tileIds);

    this.boardIds = this.boardIds.map((row) =>
      row.map((tileId) => (tileId && matchedSet.has(tileId) ? null : tileId))
    );
  }

  private spawnTileId(): string {
    const currentBoardWords = new Set(
      this.boardIds
        .flat()
        .filter((tileId): tileId is string => Boolean(tileId))
        .map((tileId) => this.tileMetaById.get(tileId)?.word)
        .filter((word): word is string => Boolean(word))
        .map((word) => normalizeWord(word))
    );

    const primaryGroups = this.activeGroups.filter((group) =>
      group.unusedWordIds.some((wordId) => {
        const wordText = this.wordMetaByWordId.get(wordId)?.text.en;
        if (!wordText) {
          return false;
        }
        return !currentBoardWords.has(normalizeWord(wordText));
      })
    );
    const eligibleGroups = primaryGroups.length > 0
      ? primaryGroups
      : this.activeGroups.filter((group) =>
          group.words.some((word) => !currentBoardWords.has(normalizeWord(word.text.en)))
        );

    if (eligibleGroups.length === 0) {
      throw new Error('No unique words remain to refill the board.');
    }

    const group = pickOne(eligibleGroups, this.random);
    const preferredWordIds = group.unusedWordIds.filter((wordId) => {
      const wordText = this.wordMetaByWordId.get(wordId)?.text.en;
      if (!wordText) {
        return false;
      }
      return !currentBoardWords.has(normalizeWord(wordText));
    });
    const fallbackWordIds = group.words
      .map((word) => word.id)
      .filter((wordId) => {
        const wordText = this.wordMetaByWordId.get(wordId)?.text.en;
        if (!wordText) {
          return false;
        }
        return !currentBoardWords.has(normalizeWord(wordText));
      });
    const selectedWordId = pickOne(
      preferredWordIds.length > 0 ? preferredWordIds : fallbackWordIds,
      this.random
    );

    group.unusedWordIds = group.unusedWordIds.filter((wordId) => wordId !== selectedWordId);
    const wordMeta = this.wordMetaByWordId.get(selectedWordId);

    if (!wordMeta) {
      throw new Error(`Missing word metadata for ${selectedWordId}.`);
    }

    const tileId = `t_r_${this.tileCounter}_${selectedWordId}`;
    this.tileCounter += 1;
    this.tileMetaById.set(tileId, {
      id: tileId,
      word: wordMeta.text.en,
      translation: wordMeta.text.zh,
      wordId: selectedWordId
    });
    this.groupTokenByTileId.set(tileId, wordMeta.groupToken);
    this.seenWordIds.add(selectedWordId);
    return tileId;
  }
}
