import type { SupportedCefr } from './glossary.js';

export type LevelDefinition = {
  id: number;
  label: string;
  cefr: SupportedCefr;
  boardSize: number;
  moves: number;
  targetScore: number;
  groupsPerBoard: number;
  minWordsPerGroup: number;
  maxWordsPerGroup: number;
  unlockBy: number | null;
};

export const levels: LevelDefinition[] = [
  {
    id: 1,
    label: 'Level 1',
    cefr: 'A1',
    boardSize: 4,
    moves: 20,
    targetScore: 700,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: null
  },
  {
    id: 2,
    label: 'Level 2',
    cefr: 'A1',
    boardSize: 4,
    moves: 19,
    targetScore: 820,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: 1
  },
  {
    id: 3,
    label: 'Level 3',
    cefr: 'A1',
    boardSize: 4,
    moves: 18,
    targetScore: 940,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: 2
  },
  {
    id: 4,
    label: 'Level 4',
    cefr: 'A1',
    boardSize: 4,
    moves: 17,
    targetScore: 1080,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: 3
  },
  {
    id: 5,
    label: 'Level 5',
    cefr: 'A1',
    boardSize: 4,
    moves: 16,
    targetScore: 1220,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: 4
  },
  {
    id: 6,
    label: 'Level 6',
    cefr: 'A1',
    boardSize: 4,
    moves: 19,
    targetScore: 1380,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: 5
  },
  {
    id: 7,
    label: 'Level 7',
    cefr: 'A2',
    boardSize: 4,
    moves: 18,
    targetScore: 1560,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: 6
  },
  {
    id: 8,
    label: 'Level 8',
    cefr: 'A2',
    boardSize: 4,
    moves: 17,
    targetScore: 1760,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: 7
  },
  {
    id: 9,
    label: 'Level 9',
    cefr: 'A2',
    boardSize: 4,
    moves: 16,
    targetScore: 1980,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: 8
  },
  {
    id: 10,
    label: 'Level 10',
    cefr: 'A2',
    boardSize: 4,
    moves: 15,
    targetScore: 2220,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: 9
  },
  {
    id: 11,
    label: 'Level 11',
    cefr: 'A2',
    boardSize: 4,
    moves: 18,
    targetScore: 2300,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: 10
  },
  {
    id: 12,
    label: 'Level 12',
    cefr: 'A2',
    boardSize: 4,
    moves: 17,
    targetScore: 2540,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: 11
  },
  {
    id: 13,
    label: 'Level 13',
    cefr: 'B1',
    boardSize: 4,
    moves: 16,
    targetScore: 2800,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: 12
  },
  {
    id: 14,
    label: 'Level 14',
    cefr: 'B1',
    boardSize: 4,
    moves: 15,
    targetScore: 3080,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: 13
  },
  {
    id: 15,
    label: 'Level 15',
    cefr: 'B1',
    boardSize: 4,
    moves: 14,
    targetScore: 3380,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: 14
  },
  {
    id: 16,
    label: 'Level 16',
    cefr: 'B1',
    boardSize: 4,
    moves: 17,
    targetScore: 3440,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: 15
  },
  {
    id: 17,
    label: 'Level 17',
    cefr: 'B1',
    boardSize: 4,
    moves: 16,
    targetScore: 3700,
    groupsPerBoard: 4,
    minWordsPerGroup: 3,
    maxWordsPerGroup: 4,
    unlockBy: 16
  },
  {
    id: 18,
    label: 'Level 18',
    cefr: 'B2',
    boardSize: 4,
    moves: 15,
    targetScore: 3970,
    groupsPerBoard: 3,
    minWordsPerGroup: 5,
    maxWordsPerGroup: 6,
    unlockBy: 17
  },
  {
    id: 19,
    label: 'Level 19',
    cefr: 'B2',
    boardSize: 4,
    moves: 14,
    targetScore: 4250,
    groupsPerBoard: 3,
    minWordsPerGroup: 5,
    maxWordsPerGroup: 6,
    unlockBy: 18
  },
  {
    id: 20,
    label: 'Level 20',
    cefr: 'B2',
    boardSize: 4,
    moves: 13,
    targetScore: 4540,
    groupsPerBoard: 3,
    minWordsPerGroup: 5,
    maxWordsPerGroup: 6,
    unlockBy: 19
  }
];

export const defaultLevel = levels[0];
