import type { AppConfig, DayResult, DayOverrides, DayEntry, BGHonorValues } from '../types';
import { PHASE_CONFIG } from '../types';

/**
 * Calculate expected marks gained per game based on win rate.
 * Win: 3 marks, Loss: 1 mark
 * Since we assume equal BG distribution, marks per game = marks per BG per game.
 */
export function expectedMarksPerGame(winRate: number): number {
  return 1 + 2 * winRate;
}

/**
 * Calculate expected honor for a single BG based on win rate.
 */
export function expectedHonorForBG(bgHonor: BGHonorValues, winRate: number): number {
  return winRate * bgHonor.honorPerWin + (1 - winRate) * bgHonor.honorPerLoss;
}

/**
 * Calculate mean expected honor per game across all active BGs.
 */
export function expectedHonorPerGame(config: AppConfig, winRate: number): number {
  const phaseConfig = PHASE_CONFIG[config.phase];
  const bgKeys = phaseConfig.bgKeys;

  let totalHonor = 0;
  for (const bg of bgKeys) {
    totalHonor += expectedHonorForBG(config.bgHonor[bg], winRate);
  }

  return totalHonor / bgKeys.length;
}

/**
 * Calculate number of turn-in sets possible.
 * A turn-in requires 1 mark from each BG type, so marksPerBG is the limiting factor.
 */
export function computeTurnInSets(
  marksPerBG: number,
  thresholdPerBG: number,
  enableTurnIns: boolean
): number {
  if (!enableTurnIns) {
    return 0;
  }
  const excessPerBG = Math.max(0, marksPerBG - thresholdPerBG);
  return Math.floor(excessPerBG);
}

/**
 * Calculate the result for a single day.
 * All marks values are per-BG (assuming equal distribution across BG types).
 */
export function computeDayResult(
  dayIndex: number,
  date: string,
  honorStart: number,
  marksPerBGStart: number,
  config: AppConfig,
  gamesPlanned: number,
  overrides?: DayOverrides
): DayResult {
  const { numBGs } = PHASE_CONFIG[config.phase];

  // Marks calculation (per BG)
  // Each game gives marks for one random BG, so on average marks per BG = total marks / numBGs
  const totalMarksGained = gamesPlanned * expectedMarksPerGame(config.winRate);
  const expectedMarksGainedPerBG = totalMarksGained / numBGs;
  const marksPerBGBeforeTurnIn = marksPerBGStart + expectedMarksGainedPerBG;

  const turnInSets = computeTurnInSets(
    marksPerBGBeforeTurnIn,
    config.marksThresholdPerBG,
    config.enableTurnIns
  );
  let marksPerBGEnd = marksPerBGBeforeTurnIn - turnInSets;

  // Honor calculation
  const honorFromBGs =
    gamesPlanned * expectedHonorPerGame(config, config.winRate) * config.bgHonorMult;
  const honorFromDailyQuest = config.dailyQuestHonor * config.questHonorMult;
  const honorFromTurnIns = turnInSets * config.turnInHonor * config.questHonorMult;
  const totalHonorGained = honorFromBGs + honorFromDailyQuest + honorFromTurnIns;
  let honorEndOfDay = honorStart + totalHonorGained;

  // Apply overrides
  let overrideApplied = false;
  if (overrides) {
    if (overrides.actualHonorEndOfDay !== undefined) {
      honorEndOfDay = overrides.actualHonorEndOfDay;
      overrideApplied = true;
    }
    if (overrides.actualMarksPerBG !== undefined) {
      marksPerBGEnd = overrides.actualMarksPerBG;
      overrideApplied = true;
    }
  }

  return {
    dayIndex,
    date,
    gamesPlanned,
    honorStart,
    marksPerBGStart,
    expectedMarksGainedPerBG,
    marksPerBGBeforeTurnIn,
    turnInSets,
    marksPerBGEnd,
    honorFromBGs,
    honorFromDailyQuest,
    honorFromTurnIns,
    totalHonorGained,
    honorEndOfDay,
    overrideApplied,
    isGoalReachedDay: false,
  };
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export function computeForecast(
  config: AppConfig,
  entries: DayEntry[],
  dailyGames: number
): { results: DayResult[]; dailyGamesRequired: number } {
  const results: DayResult[] = [];
  const totalDays = daysBetween(config.startDate, config.endDate);

  let currentHonor = config.startingHonor;
  let currentMarksPerBG = config.startingMarksPerBG;
  let goalReached = false;

  const overridesMap = new Map<number, DayOverrides>();
  for (const entry of entries) {
    if (entry.overrides) {
      overridesMap.set(entry.dayIndex, entry.overrides);
    }
  }

  for (let i = 0; i < totalDays; i++) {
    const dayIndex = i + 1;
    const date = addDays(config.startDate, i);
    const overrides = overridesMap.get(dayIndex);

    const result = computeDayResult(
      dayIndex,
      date,
      currentHonor,
      currentMarksPerBG,
      config,
      dailyGames,
      overrides
    );

    if (!goalReached && result.honorEndOfDay >= config.honorTarget) {
      result.isGoalReachedDay = true;
      goalReached = true;
    }

    results.push(result);

    currentHonor = result.honorEndOfDay;
    currentMarksPerBG = result.marksPerBGEnd;
  }

  return { results, dailyGamesRequired: dailyGames };
}

export function findGoalReachedDay(
  results: DayResult[],
  honorTarget: number
): DayResult | null {
  for (const result of results) {
    if (result.honorEndOfDay >= honorTarget) {
      return result;
    }
  }
  return null;
}

const MAX_FORECAST_DAYS = 365;

export function computeForecastManual(
  config: AppConfig,
  entries: DayEntry[],
  dailyGames: number
): { results: DayResult[]; dailyGamesRequired: number } {
  const results: DayResult[] = [];

  let currentHonor = config.startingHonor;
  let currentMarksPerBG = config.startingMarksPerBG;
  let goalReached = false;

  const overridesMap = new Map<number, DayOverrides>();
  for (const entry of entries) {
    if (entry.overrides) {
      overridesMap.set(entry.dayIndex, entry.overrides);
    }
  }

  // Continue until goal is reached or max days
  for (let i = 0; i < MAX_FORECAST_DAYS; i++) {
    const dayIndex = i + 1;
    const date = addDays(config.startDate, i);
    const overrides = overridesMap.get(dayIndex);

    const result = computeDayResult(
      dayIndex,
      date,
      currentHonor,
      currentMarksPerBG,
      config,
      dailyGames,
      overrides
    );

    if (!goalReached && result.honorEndOfDay >= config.honorTarget) {
      result.isGoalReachedDay = true;
      goalReached = true;
    }

    results.push(result);

    currentHonor = result.honorEndOfDay;
    currentMarksPerBG = result.marksPerBGEnd;

    // Stop after goal is reached (show a few more days for context)
    if (goalReached && results.length >= dayIndex + 3) {
      break;
    }
  }

  return { results, dailyGamesRequired: dailyGames };
}

export function computeRequiredDailyGames(config: AppConfig): number {
  if (config.startingHonor >= config.honorTarget) {
    return 0;
  }

  const zeroGamesResult = computeForecast(config, [], 0);
  const lastDayZeroGames = zeroGamesResult.results[zeroGamesResult.results.length - 1];
  if (lastDayZeroGames.honorEndOfDay >= config.honorTarget) {
    return 0;
  }

  let low = 0;
  let high = 100;

  let highResult = computeForecast(config, [], high);
  let lastDayHigh = highResult.results[highResult.results.length - 1];
  while (lastDayHigh.honorEndOfDay < config.honorTarget && high < 10000) {
    high *= 2;
    highResult = computeForecast(config, [], high);
    lastDayHigh = highResult.results[highResult.results.length - 1];
  }

  while (high - low > 0.1) {
    const mid = (low + high) / 2;
    const midResult = computeForecast(config, [], mid);
    const lastDayMid = midResult.results[midResult.results.length - 1];

    if (lastDayMid.honorEndOfDay >= config.honorTarget) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.ceil(high * 10) / 10;
}
