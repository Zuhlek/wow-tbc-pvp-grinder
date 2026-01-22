import { NumberInput } from '../NumberInput';
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
        <NumberInput
          id="honorTarget"
          min={1}
          value={honorTarget}
          onChange={onHonorTargetChange}
          className={hasError('honortarget') ? 'input-error' : ''}
        />
      </div>
    </div>
  );
}
