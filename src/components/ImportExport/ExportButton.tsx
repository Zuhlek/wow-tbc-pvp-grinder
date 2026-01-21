import type { AppConfig, DayEntry } from '../../types';
import { createExportData, generateExportFilename } from '../../utils/migration';
import './ImportExport.css';

interface ExportButtonProps {
  config: AppConfig;
  entries: DayEntry[];
}

export function ExportButton({ config, entries }: ExportButtonProps) {
  const handleExport = () => {
    const data = createExportData(config, entries);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = generateExportFilename();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      className="import-export-btn"
      onClick={handleExport}
      title="Export configuration and overrides to JSON file"
    >
      Export
    </button>
  );
}
