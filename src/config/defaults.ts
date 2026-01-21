import type { AppConfig, BGHonorConfig } from '../types';

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Default BG honor values based on observed data:
 * WSG - Win: ~785, Loss: ~271
 * AB  - Win: ~626, Loss: ~318
 * AV  - Win: ~687, Loss: ~374
 * EotS (TBC) - Estimated similar to other BGs
 */
export const DEFAULT_BG_HONOR: BGHonorConfig = {
  wsg: { honorPerWin: 785, honorPerLoss: 271 },
  ab: { honorPerWin: 626, honorPerLoss: 318 },
  av: { honorPerWin: 687, honorPerLoss: 374 },
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

  dailyQuestHonor: 419,
  turnInHonor: 314,

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
 * Create a fresh default config with current date as start date
 */
export function createDefaultConfig(): AppConfig {
  return {
    ...DEFAULT_CONFIG,
    startDate: getToday(),
  };
}
