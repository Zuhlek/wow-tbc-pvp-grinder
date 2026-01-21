import { useCallback } from 'react';
import type { AppConfig, DayEntry } from './types';
import { Layout } from './components/Layout';
import {
  TimelineInput,
  GameSettingsInput,
  MultiplierInput,
  StartingStateInput,
  TargetInput,
} from './components/ConfigPanel';
import { BGHonorPanel } from './components/BGHonorPanel';
import { Summary } from './components/Summary';
import { ForecastTable } from './components/ForecastTable';
import { useConfig } from './hooks/useConfig';
import { useEntries } from './hooks/useEntries';
import { useForecast } from './hooks/useForecast';
import './App.css';

function App() {
  const {
    config,
    validation,
    updateConfig,
    updateBGHonor,
    setConfig,
    resetConfig,
  } = useConfig();

  const { entries, setOverride, clearOverride, setEntries, clearAllOverrides } = useEntries();
  const { results, dailyGamesRequired, goalDay, isValid } = useForecast(
    config,
    entries
  );

  const handleImport = useCallback(
    (importedConfig: AppConfig, importedEntries: DayEntry[]) => {
      setConfig(importedConfig);
      setEntries(importedEntries);
    },
    [setConfig, setEntries]
  );

  const handleReset = useCallback(() => {
    resetConfig();
    clearAllOverrides();
  }, [resetConfig, clearAllOverrides]);

  return (
    <Layout
      config={config}
      entries={entries}
      onImport={handleImport}
      onReset={handleReset}
    >
      <div className="app-grid">
        <div className="config-column">
          <TimelineInput
            startDate={config.startDate}
            endDate={config.endDate}
            phase={config.phase}
            onStartDateChange={(v) => updateConfig({ startDate: v })}
            onEndDateChange={(v) => updateConfig({ endDate: v })}
            onPhaseChange={(v) => updateConfig({ phase: v })}
            errors={validation.errors}
          />

          <div className="config-row">
            <GameSettingsInput
              winRate={config.winRate}
              marksThresholdPerBG={config.marksThresholdPerBG}
              enableTurnIns={config.enableTurnIns}
              dailyQuestHonor={config.dailyQuestHonor}
              turnInHonor={config.turnInHonor}
              onWinRateChange={(v) => updateConfig({ winRate: v })}
              onMarksThresholdChange={(v) =>
                updateConfig({ marksThresholdPerBG: v })
              }
              onEnableTurnInsChange={(v) => updateConfig({ enableTurnIns: v })}
              onDailyQuestHonorChange={(v) => updateConfig({ dailyQuestHonor: v })}
              onTurnInHonorChange={(v) => updateConfig({ turnInHonor: v })}
              errors={validation.errors}
            />

            <MultiplierInput
              bgHonorMult={config.bgHonorMult}
              questHonorMult={config.questHonorMult}
              onBgHonorMultChange={(v) => updateConfig({ bgHonorMult: v })}
              onQuestHonorMultChange={(v) => updateConfig({ questHonorMult: v })}
              errors={validation.errors}
            />
          </div>

          <BGHonorPanel
            bgHonor={config.bgHonor}
            phase={config.phase}
            onBGHonorChange={updateBGHonor}
          />

          <div className="config-row">
            <StartingStateInput
              startingHonor={config.startingHonor}
              startingMarks={config.startingMarks}
              onStartingHonorChange={(v) => updateConfig({ startingHonor: v })}
              onStartingMarksChange={(v) => updateConfig({ startingMarks: v })}
              errors={validation.errors}
            />

            <TargetInput
              honorTarget={config.honorTarget}
              onHonorTargetChange={(v) => updateConfig({ honorTarget: v })}
              errors={validation.errors}
            />
          </div>
        </div>

        <div className="results-column">
          <Summary
            config={config}
            dailyGamesRequired={dailyGamesRequired}
            goalDay={goalDay}
            totalDays={results.length}
            isValid={isValid}
            errors={validation.errors}
          />

          <ForecastTable
            results={results}
            enableTurnIns={config.enableTurnIns}
            onSetOverride={setOverride}
            onClearOverride={clearOverride}
          />
        </div>
      </div>
    </Layout>
  );
}

export default App;
