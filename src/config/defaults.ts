import type { AppConfig, BGHonorConfig } from '../types';

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export const DEFAULT_BG_HONOR: BGHonorConfig = {
  wsg: { honorPerWin: 600, honorPerLoss: 150 },
  ab: { honorPerWin: 500, honorPerLoss: 200 },
  av: { honorPerWin: 700, honorPerLoss: 350 },
  eots: { honorPerWin: 700, honorPerLoss: 350 },
};

/**
 * Default application configuration
 */
export const DEFAULT_CONFIG: AppConfig = {
  startDate: getToday(),
  endDate: '2026-02-05', // Default end date

  phase: 'classic',
  bgHonor: DEFAULT_BG_HONOR,

  dailyQuestHonor: 500,
  turnInHonor: 200,

  winRate: 0.3,
  marksThresholdPerBG: 30,
  enableTurnIns: true,
  bgHonorMult: 2.5,
  questHonorMult: 2.5,
  honorTarget: 75000,
  startingHonor: 20000,
  startingMarksPerBG: 40,
};

/**
 * Create a fresh default config with current date as start date
 */
export function createDefaultConfig(): AppConfig {
  return {
    ...DEFAULT_CONFIG,
    startDate: getToday(),
  };
}
