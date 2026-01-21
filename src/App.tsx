import { Layout } from './components/Layout';
import {
  TimelineInput,
  GameSettingsInput,
  MultiplierInput,
  StartingStateInput,
  TargetInput,
} from './components/ConfigPanel';
import { PhaseSettingsPanel } from './components/PhaseSettingsPanel';
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
    updateClassicConfig,
    updateTbcConfig,
  } = useConfig();

  const { entries, setOverride, clearOverride } = useEntries();
  const { results, dailyGamesRequired, goalDay, isValid } = useForecast(
    config,
    entries
  );

  return (
    <Layout>
      <div className="app-grid">
        <div className="config-column">
          <TimelineInput
            startDate={config.startDate}
            tbcStartDate={config.tbcStartDate}
            endDate={config.endDate}
            onStartDateChange={(v) => updateConfig({ startDate: v })}
            onTbcStartDateChange={(v) => updateConfig({ tbcStartDate: v })}
            onEndDateChange={(v) => updateConfig({ endDate: v })}
            errors={validation.errors}
          />

          <div className="config-row">
            <GameSettingsInput
              winRate={config.winRate}
              marksThresholdPerBG={config.marksThresholdPerBG}
              enableTurnIns={config.enableTurnIns}
              onWinRateChange={(v) => updateConfig({ winRate: v })}
              onMarksThresholdChange={(v) =>
                updateConfig({ marksThresholdPerBG: v })
              }
              onEnableTurnInsChange={(v) => updateConfig({ enableTurnIns: v })}
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

          <PhaseSettingsPanel
            classicConfig={config.classicConfig}
            tbcConfig={config.tbcConfig}
            onClassicChange={updateClassicConfig}
            onTbcChange={updateTbcConfig}
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
