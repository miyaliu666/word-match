import type { LevelDefinition } from '../../data/levels';

export type PublicTile = {
  id: string;
  word: string;
};

export type PublicBoard = PublicTile[][];

export type BoardPosition = {
  row: number;
  col: number;
};

export type ReviewWord = {
  id: string;
  word: string;
  translation: string;
};

export type ReviewGroup = {
  label: string;
  words: ReviewWord[];
};

export type GameStatus = 'playing' | 'won' | 'lost';

export type ResolutionStep = {
  kind: 'match' | 'shuffle';
  matchedIds: string[];
  matchedWords: string[];
  scoreDelta: number;
  nextBoard: PublicBoard;
  spawnOffsets: Record<string, number>;
  combo: number;
  scoreTotal: number;
  status: string;
};

export type SwapResult =
  | {
      accepted: false;
      boardAfterSwap: PublicBoard;
      revertedBoard: PublicBoard;
      resolutionSteps: [];
      movesLeft: number;
      score: number;
      gameStatus: 'playing';
      status: string;
      swapIds: [string, string];
    }
  | {
      accepted: true;
      boardAfterSwap: PublicBoard;
      resolutionSteps: ResolutionStep[];
      movesLeft: number;
      score: number;
      gameStatus: GameStatus;
      status: string;
      swapIds: [string, string];
    };

export type GameSnapshot = {
  board: PublicBoard;
  level: LevelDefinition;
  score: number;
  movesLeft: number;
  targetScore: number;
  status: GameStatus;
  statusMessage: string;
};
