import type { AppConfig, ValidationResult, BGHonorValues } from '../types';

/**
 * Validate BGHonorValues for a single BG.
 */
function validateBGHonor(bgHonor: BGHonorValues, bgName: string, errors: string[]): void {
  if (bgHonor.honorPerWin < 0) {
    errors.push(`${bgName}.honorPerWin must be >= 0`);
  }
  if (bgHonor.honorPerLoss < 0) {
    errors.push(`${bgName}.honorPerLoss must be >= 0`);
  }
}

/**
 * Validate the complete AppConfig.
 */
export function validateConfig(config: AppConfig): ValidationResult {
  const errors: string[] = [];

  // Phase validation
  if (config.phase !== 'classic' && config.phase !== 'tbc') {
    errors.push('phase must be "classic" or "tbc"');
  }

  // Win rate validation
  if (config.winRate < 0 || config.winRate > 1) {
    errors.push('winRate must be between 0 and 1');
  }

  // Multiplier validation
  if (config.bgHonorMult <= 0) {
    errors.push('bgHonorMult must be > 0');
  }
  if (config.questHonorMult <= 0) {
    errors.push('questHonorMult must be > 0');
  }

  // Date validation
  if (config.startDate > config.endDate) {
    errors.push('endDate must be after or equal to startDate');
  }

  // Starting values validation
  if (config.startingHonor < 0) {
    errors.push('startingHonor must be >= 0');
  }
  if (config.startingMarks < 0) {
    errors.push('startingMarks must be >= 0');
  }

  // Target validation
  if (config.honorTarget <= 0) {
    errors.push('honorTarget must be > 0');
  }

  // Threshold validation
  if (config.marksThresholdPerBG < 0) {
    errors.push('marksThresholdPerBG must be >= 0');
  }

  // Per-BG honor values validation
  if (config.bgHonor) {
    validateBGHonor(config.bgHonor.wsg, 'wsg', errors);
    validateBGHonor(config.bgHonor.ab, 'ab', errors);
    validateBGHonor(config.bgHonor.av, 'av', errors);
    validateBGHonor(config.bgHonor.eots, 'eots', errors);
  } else {
    errors.push('bgHonor configuration is required');
  }

  // Quest honor values validation
  if (config.dailyQuestHonor < 0) {
    errors.push('dailyQuestHonor must be >= 0');
  }
  if (config.turnInHonor < 0) {
    errors.push('turnInHonor must be >= 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
