import { Layout } from './components/Layout';
import {
  TimelineInput,
  GameSettingsInput,
  MultiplierInput,
  StartingStateInput,
  TargetInput,
} from './components/ConfigPanel';
import { PhaseSettingsPanel } from './components/PhaseSettingsPanel';
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

  const { entries } = useEntries();
  const { dailyGamesRequired, goalDay, isValid } = useForecast(config, entries);

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
              onMarksThresholdChange={(v) => updateConfig({ marksThresholdPerBG: v })}
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
          <div className="panel summary-panel">
            <h3 className="panel-title">Summary</h3>

            {!isValid ? (
              <div className="validation-errors">
                <p className="text-danger">Configuration has errors:</p>
                <ul>
                  {validation.errors.map((error, i) => (
                    <li key={i} className="text-danger">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="summary-content">
                <div className="summary-row">
                  <span className="summary-label">Honor Progress:</span>
                  <span className="summary-value">
                    {config.startingHonor.toLocaleString()} /{' '}
                    {config.honorTarget.toLocaleString()}
                  </span>
                </div>

                <div className="summary-row">
                  <span className="summary-label">Remaining:</span>
                  <span className="summary-value">
                    {Math.max(
                      0,
                      config.honorTarget - config.startingHonor
                    ).toLocaleString()}{' '}
                    honor
                  </span>
                </div>

                <div className="summary-row">
                  <span className="summary-label">Starting Marks:</span>
                  <span className="summary-value">{config.startingMarks}</span>
                </div>

                <hr />

                <div className="summary-row highlight">
                  <span className="summary-label">Required Games/Day:</span>
                  <span className="summary-value">
                    {dailyGamesRequired.toFixed(1)}
                  </span>
                </div>

                {goalDay && (
                  <div className="summary-row">
                    <span className="summary-label">Goal Reached:</span>
                    <span className="summary-value text-success">
                      Day {goalDay.dayIndex} ({goalDay.date})
                    </span>
                  </div>
                )}

                {!goalDay && (
                  <div className="summary-row">
                    <span className="summary-label">Goal Reached:</span>
                    <span className="summary-value text-warning">
                      Not within timeframe
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="panel">
            <h3 className="panel-title">Forecast</h3>
            <p className="text-muted">
              Forecast table will be added in Sprint 5
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;
