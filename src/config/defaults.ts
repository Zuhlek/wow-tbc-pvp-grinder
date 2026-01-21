import type { AppConfig } from '../types';

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get a date N days from today in ISO format
 */
function getDaysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Default application configuration
 */
export const DEFAULT_CONFIG: AppConfig = {
  startDate: getToday(),
  tbcStartDate: getDaysFromToday(7), // TBC starts in 1 week by default
  endDate: getDaysFromToday(28), // 4 weeks from now

  classicConfig: {
    name: 'classic',
    numBGs: 3,
    marksPerTurnIn: 3,
    honorPerWin: 200,
    honorPerLoss: 100,
    dailyQuestHonorBase: 419,
    turnInHonorBase: 314,
  },

  tbcConfig: {
    name: 'tbc',
    numBGs: 4,
    marksPerTurnIn: 4,
    honorPerWin: 300,
    honorPerLoss: 150,
    dailyQuestHonorBase: 600,
    turnInHonorBase: 400,
  },

  winRate: 0.5,
  marksThresholdPerBG: 50,
  enableTurnIns: true,
  bgHonorMult: 1.0,
  questHonorMult: 1.0,
  honorTarget: 75000,
  startingHonor: 0,
  startingMarks: 0,
};

/**
 * Create a fresh default config with current dates
 */
export function createDefaultConfig(): AppConfig {
  return {
    ...DEFAULT_CONFIG,
    startDate: getToday(),
    tbcStartDate: getDaysFromToday(7),
    endDate: getDaysFromToday(28),
  };
}
