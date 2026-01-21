import type { ReactNode } from 'react';
import type { AppConfig, DayEntry } from '../../types';
import { ExportButton, ImportButton } from '../ImportExport';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  config: AppConfig;
  entries: DayEntry[];
  onImport: (config: AppConfig, entries: DayEntry[]) => void;
  onReset: () => void;
}

export function Layout({ children, config, entries, onImport, onReset }: LayoutProps) {
  const handleReset = () => {
    if (window.confirm('Reset all settings to defaults? This will clear your current configuration and overrides.')) {
      onReset();
    }
  };

  return (
    <div className="layout">
      <header className="header">
        <h1 className="header-title">WoW PvP Grind Planner</h1>
        <div className="header-actions">
          <button
            type="button"
            className="reset-btn"
            onClick={handleReset}
            title="Reset all settings to defaults"
          >
            Reset
          </button>
          <ImportButton onImport={onImport} />
          <ExportButton config={config} entries={entries} />
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}
