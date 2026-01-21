import './ConfigPanel.css';

interface MultiplierInputProps {
  bgHonorMult: number;
  questHonorMult: number;
  onBgHonorMultChange: (value: number) => void;
  onQuestHonorMultChange: (value: number) => void;
  errors?: string[];
}

export function MultiplierInput({
  bgHonorMult,
  questHonorMult,
  onBgHonorMultChange,
  onQuestHonorMultChange,
  errors = [],
}: MultiplierInputProps) {
  const hasError = (field: string) =>
    errors.some((e) => e.toLowerCase().includes(field.toLowerCase()));

  return (
    <div className="panel">
      <h3 className="panel-title">Multipliers</h3>

      <div className="form-group">
        <label htmlFor="bgHonorMult">BG Honor Multiplier</label>
        <div className="input-with-suffix">
          <input
            type="number"
            id="bgHonorMult"
            min="0.1"
            step="0.1"
            value={bgHonorMult}
            onChange={(e) => onBgHonorMultChange(Number(e.target.value))}
            className={hasError('bghonormult') ? 'input-error' : ''}
          />
          <span className="input-suffix">x</span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="questHonorMult">Quest/Turn-in Multiplier</label>
        <div className="input-with-suffix">
          <input
            type="number"
            id="questHonorMult"
            min="0.1"
            step="0.1"
            value={questHonorMult}
            onChange={(e) => onQuestHonorMultChange(Number(e.target.value))}
            className={hasError('questhonormult') ? 'input-error' : ''}
          />
          <span className="input-suffix">x</span>
        </div>
        <small className="text-muted">Applies to daily quest and turn-in honor</small>
      </div>

      {errors.filter((e) => e.includes('Mult')).length > 0 && (
        <div className="error-messages">
          {errors
            .filter((e) => e.includes('Mult'))
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
