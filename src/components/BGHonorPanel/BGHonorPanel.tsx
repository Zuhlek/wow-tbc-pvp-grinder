import type { BGHonorConfig, BGHonorValues, Phase } from '../../types';
import { PHASE_CONFIG } from '../../types';
import { NumberInput } from '../NumberInput';
import './BGHonorPanel.css';

interface BGHonorPanelProps {
  bgHonor: BGHonorConfig;
  phase: Phase;
  onBGHonorChange: (bg: keyof BGHonorConfig, values: Partial<BGHonorValues>) => void;
}

const BG_NAMES: Record<keyof BGHonorConfig, string> = {
  wsg: 'Warsong Gulch',
  ab: 'Arathi Basin',
  av: 'Alterac Valley',
  eots: "Eye of the Storm",
};

const BG_SHORT_NAMES: Record<keyof BGHonorConfig, string> = {
  wsg: 'WSG',
  ab: 'AB',
  av: 'AV',
  eots: 'EotS',
};

export function BGHonorPanel({ bgHonor, phase, onBGHonorChange }: BGHonorPanelProps) {
  const activeBGs = PHASE_CONFIG[phase].bgKeys;

  return (
    <div className="panel">
      <h3 className="panel-title">
        BG Honor Values
        <span className="panel-subtitle">per battleground type</span>
      </h3>

      <div className="bg-honor-grid">
        <div className="bg-honor-header">
          <span>BG</span>
          <span className="text-right">Win</span>
          <span className="text-right">Loss</span>
        </div>

        {(Object.keys(bgHonor) as Array<keyof BGHonorConfig>).map((bg) => {
          const isActive = (activeBGs as readonly string[]).includes(bg);

          return (
            <div
              key={bg}
              className={`bg-honor-row ${!isActive ? 'inactive' : ''}`}
            >
              <span className="bg-name" title={BG_NAMES[bg]}>
                {BG_SHORT_NAMES[bg]}
                {!isActive && <span className="inactive-badge">TBC</span>}
              </span>
              <NumberInput
                min={0}
                value={bgHonor[bg].honorPerWin}
                onChange={(v) => onBGHonorChange(bg, { honorPerWin: v })}
                disabled={!isActive}
                className="text-right"
              />
              <NumberInput
                min={0}
                value={bgHonor[bg].honorPerLoss}
                onChange={(v) => onBGHonorChange(bg, { honorPerLoss: v })}
                disabled={!isActive}
                className="text-right"
              />
            </div>
          );
        })}
      </div>

    </div>
  );
}
