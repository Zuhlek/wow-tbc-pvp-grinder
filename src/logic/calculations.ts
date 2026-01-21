import type { AppConfig, PhaseConfig, DayResult, DayOverrides, DayEntry } from '../types';

/**
 * Calculate expected marks gained per game based on win rate.
 * Win: 3 marks, Loss: 1 mark
 * Formula: 1 + 2 * winRate
 */
export function expectedMarksPerGame(winRate: number): number {
  return 1 + 2 * winRate;
}

/**
 * Calculate expected honor gained per game based on phase config and win rate.
 * Formula: winRate * honorPerWin + (1 - winRate) * honorPerLoss
 */
export function expectedHonorPerGame(phase: PhaseConfig, winRate: number): number {
  return winRate * phase.honorPerWin + (1 - winRate) * phase.honorPerLoss;
}

/**
 * Calculate number of turn-in sets possible given current marks and reserve threshold.
 * Returns 0 if enableTurnIns is false or marks are below reserve.
 */
export function computeTurnInSets(
  marksBeforeTurnIn: number,
  marksReserve: number,
  marksPerTurnIn: number,
  enableTurnIns: boolean
): number {
  if (!enableTurnIns) {
    return 0;
  }
  const excessMarks = Math.max(0, marksBeforeTurnIn - marksReserve);
  return Math.floor(excessMarks / marksPerTurnIn);
}

/**
 * Get the phase config for a given date.
 * Returns classicConfig if date < tbcStartDate, tbcConfig otherwise.
 */
export function getPhaseForDate(date: string, config: AppConfig): PhaseConfig {
  if (date < config.tbcStartDate) {
    return config.classicConfig;
  }
  return config.tbcConfig;
}

/**
 * Calculate the result for a single day.
 */
export function computeDayResult(
  dayIndex: number,
  date: string,
  honorStart: number,
  marksStart: number,
  config: AppConfig,
  gamesPlanned: number,
  overrides?: DayOverrides
): DayResult {
  const phase = getPhaseForDate(date, config);
  const marksReserve = config.marksThresholdPerBG * phase.numBGs;

  // Marks calculation
  const expectedMarksGained = gamesPlanned * expectedMarksPerGame(config.winRate);
  const marksBeforeTurnIn = marksStart + expectedMarksGained;
  const turnInSets = computeTurnInSets(
    marksBeforeTurnIn,
    marksReserve,
    phase.marksPerTurnIn,
    config.enableTurnIns
  );
  let marksAfterTurnIn = marksBeforeTurnIn - turnInSets * phase.marksPerTurnIn;

  // Honor calculation
  const honorFromBGs = gamesPlanned * expectedHonorPerGame(phase, config.winRate) * config.bgHonorMult;
  const honorFromDailyQuest = phase.dailyQuestHonorBase * config.questHonorMult;
  const honorFromTurnIns = turnInSets * phase.turnInHonorBase * config.questHonorMult;
  const totalHonorGained = honorFromBGs + honorFromDailyQuest + honorFromTurnIns;
  let honorEndOfDay = honorStart + totalHonorGained;

  // Apply overrides
  let overrideApplied = false;
  if (overrides) {
    if (overrides.actualHonorEndOfDay !== undefined) {
      honorEndOfDay = overrides.actualHonorEndOfDay;
      overrideApplied = true;
    }
    if (overrides.actualMarksEndOfDay !== undefined) {
      marksAfterTurnIn = overrides.actualMarksEndOfDay;
      overrideApplied = true;
    }
  }

  return {
    dayIndex,
    date,
    phase: phase.name,
    gamesPlanned,
    honorStart,
    marksStart,
    expectedMarksGained,
    marksBeforeTurnIn,
    marksReserve,
    turnInSets,
    marksAfterTurnIn,
    honorFromBGs,
    honorFromDailyQuest,
    honorFromTurnIns,
    totalHonorGained,
    honorEndOfDay,
    overrideApplied,
    isGoalReachedDay: false, // Will be set by computeForecast
  };
}

/**
 * Add days to a date string (ISO format).
 */
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Calculate the number of days between two date strings (inclusive).
 */
function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // inclusive
}

/**
 * Compute the full forecast from startDate to endDate.
 */
export function computeForecast(
  config: AppConfig,
  entries: DayEntry[],
  dailyGames: number
): { results: DayResult[]; dailyGamesRequired: number } {
  const results: DayResult[] = [];
  const totalDays = daysBetween(config.startDate, config.endDate);

  let currentHonor = config.startingHonor;
  let currentMarks = config.startingMarks;
  let goalReached = false;

  // Create a map of overrides by dayIndex for quick lookup
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
      currentMarks,
      config,
      dailyGames,
      overrides
    );

    // Check if goal is reached for the first time
    if (!goalReached && result.honorEndOfDay >= config.honorTarget) {
      result.isGoalReachedDay = true;
      goalReached = true;
    }

    results.push(result);

    // Update state for next day
    currentHonor = result.honorEndOfDay;
    currentMarks = result.marksAfterTurnIn;
  }

  return { results, dailyGamesRequired: dailyGames };
}

/**
 * Find the first day where the honor target is reached.
 */
export function findGoalReachedDay(results: DayResult[], honorTarget: number): DayResult | null {
  for (const result of results) {
    if (result.honorEndOfDay >= honorTarget) {
      return result;
    }
  }
  return null;
}

/**
 * Calculate the required daily games to reach the honor target by the end date.
 * Uses binary search since the relationship is non-linear (more games → more marks → more turn-ins).
 */
export function computeRequiredDailyGames(config: AppConfig): number {
  // If starting honor already meets target, no games needed
  if (config.startingHonor >= config.honorTarget) {
    return 0;
  }

  // Check if 0 games is sufficient (daily quest alone)
  const zeroGamesResult = computeForecast(config, [], 0);
  const lastDayZeroGames = zeroGamesResult.results[zeroGamesResult.results.length - 1];
  if (lastDayZeroGames.honorEndOfDay >= config.honorTarget) {
    return 0;
  }

  // Binary search for minimum games needed
  let low = 0;
  let high = 100; // Start with reasonable upper bound

  // Expand upper bound if needed
  let highResult = computeForecast(config, [], high);
  let lastDayHigh = highResult.results[highResult.results.length - 1];
  while (lastDayHigh.honorEndOfDay < config.honorTarget && high < 10000) {
    high *= 2;
    highResult = computeForecast(config, [], high);
    lastDayHigh = highResult.results[highResult.results.length - 1];
  }

  // Binary search
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

  // Round up to 1 decimal place to ensure we reach the target
  // Binary search converges to within 0.1, so ceiling ensures we always hit the goal
  return Math.ceil(high * 10) / 10;
}
