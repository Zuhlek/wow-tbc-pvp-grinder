import { useRef, useState } from 'react';
import type { AppConfig, DayEntry } from '../../types';
import { parseImportData } from '../../utils/migration';
import './ImportExport.css';

interface ImportButtonProps {
  onImport: (config: AppConfig, entries: DayEntry[]) => void;
}

export function ImportButton({ onImport }: ImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = parseImportData(data);

      if (result.success && result.data) {
        onImport(result.data.config, result.data.entries);
      } else {
        setError(result.error || 'Failed to import file');
      }
    } catch {
      setError('Invalid JSON file');
    }

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="import-wrapper">
      <button
        type="button"
        className="import-export-btn"
        onClick={handleClick}
        title="Import configuration and overrides from JSON file"
      >
        Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {error && (
        <div className="import-error">
          {error}
          <button
            type="button"
            className="dismiss-btn"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
