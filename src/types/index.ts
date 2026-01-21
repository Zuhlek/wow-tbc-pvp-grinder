// Phase type - determines number of BGs and marks per turn-in
export type Phase = 'classic' | 'tbc';

// BG types
export type ClassicBG = 'wsg' | 'ab' | 'av';
export type TbcBG = ClassicBG | 'eots';

// Honor values for a single BG
export interface BGHonorValues {
  honorPerWin: number;
  honorPerLoss: number;
}

// Per-BG honor configuration
export interface BGHonorConfig {
  wsg: BGHonorValues;
  ab: BGHonorValues;
  av: BGHonorValues;
  eots: BGHonorValues; // Only used in TBC phase
}

// Phase constants
export const PHASE_CONFIG = {
  classic: { numBGs: 3, marksPerTurnIn: 3, bgKeys: ['wsg', 'ab', 'av'] as const },
  tbc: { numBGs: 4, marksPerTurnIn: 4, bgKeys: ['wsg', 'ab', 'av', 'eots'] as const },
} as const;

// Main application configuration
export interface AppConfig {
  // Timeline
  startDate: string; // ISO date, calculation begins
  endDate: string; // ISO date, goal should be reached by this date

  // Phase selection (affects numBGs and marksPerTurnIn)
  phase: Phase;

  // Per-BG honor values (user-configurable)
  bgHonor: BGHonorConfig;

  // Quest honor values
  dailyQuestHonor: number; // daily quest honor
  turnInHonor: number; // honor per turn-in set

  // Shared settings
  winRate: number; // 0..1, applies to all BGs
  marksThresholdPerBG: number; // keep X marks per BG type

  // Turn-in control
  enableTurnIns: boolean; // false = "never turn in" mode

  // Multipliers (can change, e.g., prepatch)
  bgHonorMult: number; // scales BG honor
  questHonorMult: number; // scales daily quest + turn-in honor

  // Targets
  honorTarget: number; // e.g., 75000

  // Starting state (Day 0)
  startingHonor: number;
  startingMarks: number; // unified pool
}

// Computed value (not stored, derived from config)
export interface ComputedPlan {
  totalDays: number; // endDate - startDate + 1
  honorNeeded: number; // honorTarget - startingHonor
  dailyGamesRequired: number; // calculated to reach goal by endDate
}

// User overrides for a specific day
export interface DayOverrides {
  actualHonorEndOfDay?: number;
  actualMarksEndOfDay?: number; // unified pool
}

// User entry for a day (with potential overrides)
export interface DayEntry {
  dayIndex: number;
  date: string;
  overrides?: DayOverrides;
}

// Computed result for a single day
export interface DayResult {
  dayIndex: number;
  date: string;

  // Inputs for this day
  gamesPlanned: number;
  honorStart: number;
  marksStart: number;

  // Marks calculation
  expectedMarksGained: number;
  marksBeforeTurnIn: number;
  marksReserve: number; // threshold × numBGs
  turnInSets: number; // 0 if enableTurnIns = false
  marksAfterTurnIn: number;

  // Honor calculation
  honorFromBGs: number;
  honorFromDailyQuest: number;
  honorFromTurnIns: number; // 0 if enableTurnIns = false
  totalHonorGained: number;
  honorEndOfDay: number;

  // Metadata
  overrideApplied: boolean;
  isGoalReachedDay: boolean; // true if this is the first day >= honorTarget
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
