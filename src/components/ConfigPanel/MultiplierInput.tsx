import { NumberInput } from '../NumberInput';
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
          <NumberInput
            id="bgHonorMult"
            min={0.1}
            step={0.1}
            value={bgHonorMult}
            onChange={onBgHonorMultChange}
            className={hasError('bghonormult') ? 'input-error' : ''}
          />
          <span className="input-suffix">x</span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="questHonorMult">Quest/Turn-in Mult</label>
        <div className="input-with-suffix">
          <NumberInput
            id="questHonorMult"
            min={0.1}
            step={0.1}
            value={questHonorMult}
            onChange={onQuestHonorMultChange}
            className={hasError('questhonormult') ? 'input-error' : ''}
          />
          <span className="input-suffix">x</span>
        </div>
      </div>
    </div>
  );
}
