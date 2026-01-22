import { describe, it, expect } from 'vitest';
import type { AppConfig, DayResult, DayEntry, BGHonorConfig } from '../../types';
import {
  expectedMarksPerGame,
  expectedHonorForBG,
  expectedHonorPerGame,
  computeTurnInSets,
  computeDayResult,
  computeForecast,
  findGoalReachedDay,
  computeRequiredDailyGames,
} from '../calculations';
import { validateConfig } from '../validation';

const defaultBGHonor: BGHonorConfig = {
  wsg: { honorPerWin: 785, honorPerLoss: 271 },
  ab: { honorPerWin: 626, honorPerLoss: 318 },
  av: { honorPerWin: 687, honorPerLoss: 374 },
  eots: { honorPerWin: 700, honorPerLoss: 350 },
};

const simpleBGHonor: BGHonorConfig = {
  wsg: { honorPerWin: 200, honorPerLoss: 100 },
  ab: { honorPerWin: 200, honorPerLoss: 100 },
  av: { honorPerWin: 200, honorPerLoss: 100 },
  eots: { honorPerWin: 200, honorPerLoss: 100 },
};

const validConfig: AppConfig = {
  startDate: '2024-01-18',
  endDate: '2024-02-15',
  phase: 'classic',
  bgHonor: simpleBGHonor,
  dailyQuestHonor: 419,
  turnInHonor: 314,
  winRate: 0.5,
  marksThresholdPerBG: 50,
  enableTurnIns: true,
  bgHonorMult: 1.0,
  questHonorMult: 1.0,
  honorTarget: 75000,
  startingHonor: 0,
  startingMarksPerBG: 0,
};

describe('expectedMarksPerGame', () => {
  it('returns 1 for 0% winrate', () => {
    expect(expectedMarksPerGame(0)).toBe(1);
  });

  it('returns 3 for 100% winrate', () => {
    expect(expectedMarksPerGame(1)).toBe(3);
  });

  it('returns 2 for 50% winrate', () => {
    expect(expectedMarksPerGame(0.5)).toBe(2);
  });

  it('returns 2.3 for 65% winrate', () => {
    expect(expectedMarksPerGame(0.65)).toBeCloseTo(2.3);
  });
});

describe('expectedHonorForBG', () => {
  const bgHonor = { honorPerWin: 200, honorPerLoss: 100 };

  it('50% WR averages win/loss honor', () => {
    expect(expectedHonorForBG(bgHonor, 0.5)).toBe(150);
  });

  it('100% WR returns win honor', () => {
    expect(expectedHonorForBG(bgHonor, 1.0)).toBe(200);
  });

  it('0% WR returns loss honor', () => {
    expect(expectedHonorForBG(bgHonor, 0.0)).toBe(100);
  });
});

describe('expectedHonorPerGame', () => {
  it('calculates mean honor across Classic BGs (3 BGs)', () => {
    const config: AppConfig = {
      ...validConfig,
      phase: 'classic',
      bgHonor: {
        wsg: { honorPerWin: 300, honorPerLoss: 100 },
        ab: { honorPerWin: 200, honorPerLoss: 100 },
        av: { honorPerWin: 200, honorPerLoss: 100 },
        eots: { honorPerWin: 200, honorPerLoss: 100 },
      },
    };
    expect(expectedHonorPerGame(config, 0.5)).toBeCloseTo(166.67, 1);
  });

  it('calculates mean honor across TBC BGs (4 BGs)', () => {
    const config: AppConfig = {
      ...validConfig,
      phase: 'tbc',
      bgHonor: {
        wsg: { honorPerWin: 200, honorPerLoss: 100 },
        ab: { honorPerWin: 200, honorPerLoss: 100 },
        av: { honorPerWin: 200, honorPerLoss: 100 },
        eots: { honorPerWin: 400, honorPerLoss: 200 },
      },
    };
    expect(expectedHonorPerGame(config, 0.5)).toBe(187.5);
  });

  it('uses uniform values correctly', () => {
    const config: AppConfig = { ...validConfig, phase: 'classic' };
    expect(expectedHonorPerGame(config, 0.5)).toBe(150);
  });
});

describe('computeTurnInSets', () => {
  it('no turn-in when exactly at threshold', () => {
    expect(computeTurnInSets(50, 50, true)).toBe(0);
  });

  it('1 set when 1 mark excess per BG', () => {
    expect(computeTurnInSets(51, 50, true)).toBe(1);
  });

  it('floors partial sets', () => {
    expect(computeTurnInSets(53, 50, true)).toBe(3);
  });

  it('no turn-in when below threshold', () => {
    expect(computeTurnInSets(40, 50, true)).toBe(0);
  });

  it('returns 0 when enableTurnIns is false', () => {
    expect(computeTurnInSets(60, 50, false)).toBe(0);
  });
});

describe('computeRequiredDailyGames', () => {
  const baseConfig: AppConfig = {
    ...validConfig,
    startDate: '2024-01-01',
    endDate: '2024-01-10',
    phase: 'classic',
    startingHonor: 0,
    startingMarksPerBG: 0,
    honorTarget: 20000,
    winRate: 0.5,
    marksThresholdPerBG: 50,
    enableTurnIns: true,
  };

  it('calculates games needed for target', () => {
    const games = computeRequiredDailyGames(baseConfig);
    const { results } = computeForecast(baseConfig, [], games);
    const lastDay = results[results.length - 1];
    expect(lastDay.honorEndOfDay).toBeGreaterThanOrEqual(20000);
  });

  it('accounts for starting honor', () => {
    const games = computeRequiredDailyGames({ ...baseConfig, startingHonor: 10000 });
    const gamesFromZero = computeRequiredDailyGames(baseConfig);
    expect(games).toBeLessThan(gamesFromZero);
  });

  it('no turn-ins requires more games', () => {
    const gamesWithTurnIns = computeRequiredDailyGames(baseConfig);
    const gamesWithoutTurnIns = computeRequiredDailyGames({ ...baseConfig, enableTurnIns: false });
    expect(gamesWithoutTurnIns).toBeGreaterThan(gamesWithTurnIns);
  });

  it('returns 0 when daily quest alone is sufficient', () => {
    const config = { ...baseConfig, honorTarget: 4000 };
    const games = computeRequiredDailyGames(config);
    expect(games).toBe(0);
  });

  it('returns 0 when starting honor already meets target', () => {
    const config = { ...baseConfig, startingHonor: 25000, honorTarget: 20000 };
    const games = computeRequiredDailyGames(config);
    expect(games).toBe(0);
  });
});

describe('computeDayResult', () => {
  it('Classic day with no turn-in', () => {
    const config: AppConfig = {
      ...validConfig,
      phase: 'classic',
      winRate: 0.5,
      marksThresholdPerBG: 50,
      bgHonorMult: 1.0,
      questHonorMult: 1.0,
    };

    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 10);

    // 10 games * 2 marks / 3 BGs = 6.67 marks per BG
    expect(result.expectedMarksGainedPerBG).toBeCloseTo(6.67, 1);
    expect(result.marksPerBGBeforeTurnIn).toBeCloseTo(6.67, 1);
    expect(result.turnInSets).toBe(0); // 6.67 < 50
    expect(result.honorFromBGs).toBe(1500); // 10 × 150 × 1.0
    expect(result.honorFromDailyQuest).toBe(419);
    expect(result.honorFromTurnIns).toBe(0);
    expect(result.totalHonorGained).toBe(1919);
    expect(result.honorEndOfDay).toBe(1919);
  });

  it('Classic day with turn-ins', () => {
    const config: AppConfig = {
      ...validConfig,
      phase: 'classic',
      winRate: 0.5,
      marksThresholdPerBG: 50,
      bgHonorMult: 1.0,
      questHonorMult: 1.0,
    };

    // Start with 60 marks per BG (10 excess over 50 threshold)
    const result = computeDayResult(1, '2024-01-15', 0, 60, config, 10);

    expect(result.marksPerBGStart).toBe(60);
    // 60 + 6.67 = 66.67 marks per BG
    // excess = 66.67 - 50 = 16.67 -> 16 turn-in sets
    expect(result.turnInSets).toBe(16);
    expect(result.honorFromTurnIns).toBe(16 * 314);
  });

  it('Override applies to honor', () => {
    const config: AppConfig = { ...validConfig };

    const overrides = { actualHonorEndOfDay: 5000 };
    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 10, overrides);

    expect(result.honorEndOfDay).toBe(5000);
    expect(result.overrideApplied).toBe(true);
  });

  it('Override applies to marks', () => {
    const config: AppConfig = { ...validConfig };

    const overrides = { actualMarksPerBG: 100 };
    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 10, overrides);

    expect(result.marksPerBGEnd).toBe(100);
    expect(result.overrideApplied).toBe(true);
  });
});

describe('computeForecast - override propagation', () => {
  it('honor override affects subsequent days', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-18',
      endDate: '2024-01-22',
    };

    const entries: DayEntry[] = [
      { dayIndex: 3, date: '2024-01-20', overrides: { actualHonorEndOfDay: 10000 } },
    ];

    const { results } = computeForecast(config, entries, 10);

    expect(results[2].honorEndOfDay).toBe(10000);
    expect(results[2].overrideApplied).toBe(true);
    expect(results[3].honorStart).toBe(10000);
  });

  it('marks override affects subsequent days', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-18',
      endDate: '2024-01-22',
    };

    const entries: DayEntry[] = [
      { dayIndex: 2, date: '2024-01-19', overrides: { actualMarksPerBG: 50 } },
    ];

    const { results } = computeForecast(config, entries, 10);

    expect(results[1].marksPerBGEnd).toBe(50);
    expect(results[2].marksPerBGStart).toBe(50);
  });
});

describe('findGoalReachedDay', () => {
  it('finds first day honor target is reached', () => {
    const results = [
      { dayIndex: 1, honorEndOfDay: 5000 },
      { dayIndex: 2, honorEndOfDay: 10000 },
      { dayIndex: 3, honorEndOfDay: 15000 },
      { dayIndex: 4, honorEndOfDay: 20000 },
    ] as DayResult[];

    const goalDay = findGoalReachedDay(results, 12000);
    expect(goalDay?.dayIndex).toBe(3);
  });

  it('returns null if goal not reached', () => {
    const results = [
      { dayIndex: 1, honorEndOfDay: 5000 },
      { dayIndex: 2, honorEndOfDay: 10000 },
    ] as DayResult[];

    const goalDay = findGoalReachedDay(results, 75000);
    expect(goalDay).toBeNull();
  });
});

describe('Edge Cases', () => {
  it('0 games still earns daily quest honor', () => {
    const config: AppConfig = { ...validConfig };

    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 0);

    expect(result.expectedMarksGainedPerBG).toBe(0);
    expect(result.honorFromBGs).toBe(0);
    expect(result.honorFromDailyQuest).toBe(419);
    expect(result.totalHonorGained).toBe(419);
  });

  it('0% winrate gives 1 mark/game and loss honor only', () => {
    const config: AppConfig = { ...validConfig, winRate: 0 };

    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 10);

    // 10 games * 1 mark / 3 BGs = 3.33 marks per BG
    expect(result.expectedMarksGainedPerBG).toBeCloseTo(3.33, 1);
    expect(result.honorFromBGs).toBe(1000); // 10 × 100 (loss honor)
  });

  it('100% winrate gives 3 marks/game and win honor only', () => {
    const config: AppConfig = { ...validConfig, winRate: 1 };

    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 10);

    // 10 games * 3 marks / 3 BGs = 10 marks per BG
    expect(result.expectedMarksGainedPerBG).toBe(10);
    expect(result.honorFromBGs).toBe(2000); // 10 × 200 (win honor)
  });

  it('threshold 0 allows full turn-in', () => {
    const config: AppConfig = {
      ...validConfig,
      marksThresholdPerBG: 0,
    };

    const result = computeDayResult(1, '2024-01-15', 0, 10, config, 10);

    // 10 + 6.67 = 16.67 marks per BG, all can be turned in
    expect(result.turnInSets).toBe(16);
  });

  it('enableTurnIns=false prevents all turn-ins', () => {
    const config: AppConfig = {
      ...validConfig,
      enableTurnIns: false,
      startingMarksPerBG: 60,
    };

    const result = computeDayResult(1, '2024-01-15', 0, 60, config, 10);

    expect(result.turnInSets).toBe(0);
    expect(result.honorFromTurnIns).toBe(0);
  });

  it('goal already reached shows on day 1', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-18',
      endDate: '2024-01-22',
      startingHonor: 80000,
      honorTarget: 75000,
    };

    const { results } = computeForecast(config, [], 10);

    expect(results[0].isGoalReachedDay).toBe(true);
  });
});

describe('isGoalReachedDay flag', () => {
  it('marks exactly one day as goal reached', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-18',
      endDate: '2024-01-30',
      honorTarget: 20000,
    };

    const { results } = computeForecast(config, [], 10);
    const goalDays = results.filter((r) => r.isGoalReachedDay);

    expect(goalDays.length).toBe(1);
  });

  it('no goal day if target not reached', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-18',
      endDate: '2024-01-22',
      honorTarget: 999999999,
    };

    const { results } = computeForecast(config, [], 10);
    const goalDays = results.filter((r) => r.isGoalReachedDay);

    expect(goalDays.length).toBe(0);
  });
});

describe('validateConfig', () => {
  it('rejects winRate > 1', () => {
    const result = validateConfig({ ...validConfig, winRate: 1.5 });
    expect(result.valid).toBe(false);
  });

  it('rejects winRate < 0', () => {
    const result = validateConfig({ ...validConfig, winRate: -0.1 });
    expect(result.valid).toBe(false);
  });

  it('rejects negative BG honor values', () => {
    const result = validateConfig({
      ...validConfig,
      bgHonor: {
        ...validConfig.bgHonor,
        wsg: { honorPerWin: -100, honorPerLoss: 100 },
      },
    });
    expect(result.valid).toBe(false);
  });

  it('rejects bgHonorMult <= 0', () => {
    const result = validateConfig({ ...validConfig, bgHonorMult: 0 });
    expect(result.valid).toBe(false);
  });

  it('rejects endDate before startDate', () => {
    const result = validateConfig({
      ...validConfig,
      startDate: '2024-01-20',
      endDate: '2024-01-15',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects negative startingHonor', () => {
    const result = validateConfig({ ...validConfig, startingHonor: -1000 });
    expect(result.valid).toBe(false);
  });

  it('rejects negative startingMarksPerBG', () => {
    const result = validateConfig({ ...validConfig, startingMarksPerBG: -10 });
    expect(result.valid).toBe(false);
  });

  it('rejects honorTarget <= 0', () => {
    const result = validateConfig({ ...validConfig, honorTarget: 0 });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid phase', () => {
    const result = validateConfig({ ...validConfig, phase: 'invalid' as unknown as 'classic' });
    expect(result.valid).toBe(false);
  });

  it('accepts valid complete config', () => {
    const result = validateConfig(validConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Per-BG Honor with realistic values', () => {
  it('calculates mean honor with real WSG/AB/AV values (Classic)', () => {
    const config: AppConfig = {
      ...validConfig,
      phase: 'classic',
      bgHonor: defaultBGHonor,
      winRate: 0.5,
    };

    const honor = expectedHonorPerGame(config, 0.5);
    expect(honor).toBeCloseTo(510.17, 0);
  });
});
