// Phase-specific configuration
export interface PhaseConfig {
  name: 'classic' | 'tbc';
  numBGs: number; // 3 for classic, 4 for tbc
  marksPerTurnIn: number; // same as numBGs
  honorPerWin: number; // BG honor on win
  honorPerLoss: number; // BG honor on loss
  dailyQuestHonorBase: number; // e.g., 419 classic, 600 tbc
  turnInHonorBase: number; // honor per turn-in set
}

// Main application configuration
export interface AppConfig {
  // Phase transition
  startDate: string; // ISO date, calculation begins
  tbcStartDate: string; // ISO date, switch to TBC rules
  endDate: string; // ISO date, goal should be reached by this date

  // Phase-specific settings
  classicConfig: PhaseConfig;
  tbcConfig: PhaseConfig;

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
  phase: 'classic' | 'tbc';

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
