import './ConfigPanel.css';

interface StartingStateInputProps {
  startingHonor: number;
  startingMarks: number;
  onStartingHonorChange: (value: number) => void;
  onStartingMarksChange: (value: number) => void;
  errors?: string[];
}

export function StartingStateInput({
  startingHonor,
  startingMarks,
  onStartingHonorChange,
  onStartingMarksChange,
  errors = [],
}: StartingStateInputProps) {
  const hasError = (field: string) =>
    errors.some((e) => e.toLowerCase().includes(field.toLowerCase()));

  return (
    <div className="panel">
      <h3 className="panel-title">Starting State</h3>

      <div className="form-group">
        <label htmlFor="startingHonor">Starting Honor</label>
        <input
          type="number"
          id="startingHonor"
          min="0"
          value={startingHonor}
          onChange={(e) => onStartingHonorChange(Number(e.target.value))}
          className={hasError('startinghonor') ? 'input-error' : ''}
        />
      </div>

      <div className="form-group">
        <label htmlFor="startingMarks">Starting Marks</label>
        <input
          type="number"
          id="startingMarks"
          min="0"
          value={startingMarks}
          onChange={(e) => onStartingMarksChange(Number(e.target.value))}
          className={hasError('startingmarks') ? 'input-error' : ''}
        />
        <small className="text-muted">Total marks (unified pool)</small>
      </div>

      {errors.filter((e) => e.includes('starting')).length > 0 && (
        <div className="error-messages">
          {errors
            .filter((e) => e.includes('starting'))
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
