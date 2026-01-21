import type { PhaseConfig } from '../../types';
import '../ConfigPanel/ConfigPanel.css';

interface PhaseSettingsPanelProps {
  classicConfig: PhaseConfig;
  tbcConfig: PhaseConfig;
  onClassicChange: (updates: Partial<PhaseConfig>) => void;
  onTbcChange: (updates: Partial<PhaseConfig>) => void;
}

export function PhaseSettingsPanel({
  classicConfig,
  tbcConfig,
  onClassicChange,
  onTbcChange,
}: PhaseSettingsPanelProps) {
  return (
    <div className="panel">
      <h3 className="panel-title">Phase Settings</h3>

      <table className="phase-table">
        <thead>
          <tr>
            <th></th>
            <th>
              <span className="badge badge-classic">Classic</span>
              <div className="text-muted">(3 BGs)</div>
            </th>
            <th>
              <span className="badge badge-tbc">TBC</span>
              <div className="text-muted">(4 BGs)</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Honor/Win</td>
            <td>
              <input
                type="number"
                min="0"
                value={classicConfig.honorPerWin}
                onChange={(e) =>
                  onClassicChange({ honorPerWin: Number(e.target.value) })
                }
              />
            </td>
            <td>
              <input
                type="number"
                min="0"
                value={tbcConfig.honorPerWin}
                onChange={(e) =>
                  onTbcChange({ honorPerWin: Number(e.target.value) })
                }
              />
            </td>
          </tr>
          <tr>
            <td>Honor/Loss</td>
            <td>
              <input
                type="number"
                min="0"
                value={classicConfig.honorPerLoss}
                onChange={(e) =>
                  onClassicChange({ honorPerLoss: Number(e.target.value) })
                }
              />
            </td>
            <td>
              <input
                type="number"
                min="0"
                value={tbcConfig.honorPerLoss}
                onChange={(e) =>
                  onTbcChange({ honorPerLoss: Number(e.target.value) })
                }
              />
            </td>
          </tr>
          <tr>
            <td>Daily Quest</td>
            <td>
              <input
                type="number"
                min="0"
                value={classicConfig.dailyQuestHonorBase}
                onChange={(e) =>
                  onClassicChange({ dailyQuestHonorBase: Number(e.target.value) })
                }
              />
            </td>
            <td>
              <input
                type="number"
                min="0"
                value={tbcConfig.dailyQuestHonorBase}
                onChange={(e) =>
                  onTbcChange({ dailyQuestHonorBase: Number(e.target.value) })
                }
              />
            </td>
          </tr>
          <tr>
            <td>Turn-in Honor</td>
            <td>
              <input
                type="number"
                min="0"
                value={classicConfig.turnInHonorBase}
                onChange={(e) =>
                  onClassicChange({ turnInHonorBase: Number(e.target.value) })
                }
              />
            </td>
            <td>
              <input
                type="number"
                min="0"
                value={tbcConfig.turnInHonorBase}
                onChange={(e) =>
                  onTbcChange({ turnInHonorBase: Number(e.target.value) })
                }
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
