import type { AppConfig, PhaseConfig, ValidationResult } from '../types';

/**
 * Validate a PhaseConfig and return any errors.
 */
function validatePhaseConfig(phase: PhaseConfig, prefix: string): string[] {
  const errors: string[] = [];

  if (phase.honorPerWin < 0) {
    errors.push('honorPerWin must be >= 0');
  }
  if (phase.honorPerLoss < 0) {
    errors.push('honorPerLoss must be >= 0');
  }
  if (phase.dailyQuestHonorBase < 0) {
    errors.push('dailyQuestHonorBase must be >= 0');
  }
  if (phase.turnInHonorBase < 0) {
    errors.push('turnInHonorBase must be >= 0');
  }
  if (phase.numBGs <= 0) {
    errors.push(`${prefix}.numBGs must be > 0`);
  }
  if (phase.marksPerTurnIn <= 0) {
    errors.push(`${prefix}.marksPerTurnIn must be > 0`);
  }

  return errors;
}

/**
 * Validate the complete AppConfig.
 */
export function validateConfig(config: AppConfig): ValidationResult {
  const errors: string[] = [];

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
  if (config.tbcStartDate < config.startDate) {
    errors.push('tbcStartDate must be after or equal to startDate');
  }
  if (config.tbcStartDate > config.endDate) {
    errors.push('tbcStartDate must be before or equal to endDate');
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

  // Phase config validation
  errors.push(...validatePhaseConfig(config.classicConfig, 'classicConfig'));
  errors.push(...validatePhaseConfig(config.tbcConfig, 'tbcConfig'));

  return {
    valid: errors.length === 0,
    errors,
  };
}
