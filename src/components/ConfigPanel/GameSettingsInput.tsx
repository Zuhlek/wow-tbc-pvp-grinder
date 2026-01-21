import './ConfigPanel.css';

interface GameSettingsInputProps {
  winRate: number;
  marksThresholdPerBG: number;
  enableTurnIns: boolean;
  onWinRateChange: (value: number) => void;
  onMarksThresholdChange: (value: number) => void;
  onEnableTurnInsChange: (value: boolean) => void;
  errors?: string[];
}

export function GameSettingsInput({
  winRate,
  marksThresholdPerBG,
  enableTurnIns,
  onWinRateChange,
  onMarksThresholdChange,
  onEnableTurnInsChange,
  errors = [],
}: GameSettingsInputProps) {
  const hasError = (field: string) =>
    errors.some((e) => e.toLowerCase().includes(field.toLowerCase()));

  return (
    <div className="panel">
      <h3 className="panel-title">Game Settings</h3>

      <div className="form-group slider-group">
        <div className="slider-header">
          <label htmlFor="winRate">Win Rate</label>
          <span className="slider-value">{Math.round(winRate * 100)}%</span>
        </div>
        <input
          type="range"
          id="winRate"
          min="0"
          max="100"
          value={winRate * 100}
          onChange={(e) => onWinRateChange(Number(e.target.value) / 100)}
          className={hasError('winrate') ? 'input-error' : ''}
        />
      </div>

      <div className="form-group">
        <label htmlFor="marksThreshold">Marks Threshold</label>
        <div className="input-with-suffix">
          <input
            type="number"
            id="marksThreshold"
            min="0"
            value={marksThresholdPerBG}
            onChange={(e) => onMarksThresholdChange(Number(e.target.value))}
            className={hasError('marksthreshold') ? 'input-error' : ''}
          />
          <span className="input-suffix">per BG type</span>
        </div>
        <small className="text-muted">
          Keep this many marks before turning in (reserve)
        </small>
      </div>

      <div className="form-group">
        <div className="checkbox-row">
          <input
            type="checkbox"
            id="enableTurnIns"
            checked={enableTurnIns}
            onChange={(e) => onEnableTurnInsChange(e.target.checked)}
          />
          <label htmlFor="enableTurnIns">Enable Mark Turn-ins</label>
        </div>
        <small className="text-muted">
          Uncheck to track marks without turning them in
        </small>
      </div>

      {errors.filter((e) => e.includes('winRate') || e.includes('marks')).length > 0 && (
        <div className="error-messages">
          {errors
            .filter((e) => e.includes('winRate') || e.includes('marks'))
            .map((error, i) => (
              <p key={i} className="error-message">
                {error}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
