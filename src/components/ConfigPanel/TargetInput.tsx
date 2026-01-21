import './ConfigPanel.css';

interface TargetInputProps {
  honorTarget: number;
  onHonorTargetChange: (value: number) => void;
  errors?: string[];
}

export function TargetInput({
  honorTarget,
  onHonorTargetChange,
  errors = [],
}: TargetInputProps) {
  const hasError = (field: string) =>
    errors.some((e) => e.toLowerCase().includes(field.toLowerCase()));

  return (
    <div className="panel">
      <h3 className="panel-title">Target</h3>

      <div className="form-group">
        <label htmlFor="honorTarget">Honor Target</label>
        <input
          type="number"
          id="honorTarget"
          min="1"
          value={honorTarget}
          onChange={(e) => onHonorTargetChange(Number(e.target.value))}
          className={hasError('honortarget') ? 'input-error' : ''}
        />
        <small className="text-muted">Honor goal to reach by end date</small>
      </div>

      {errors.filter((e) => e.includes('honorTarget')).length > 0 && (
        <div className="error-messages">
          {errors
            .filter((e) => e.includes('honorTarget'))
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
