import type { AppConfig, DayEntry } from '../types';
import { validateConfig } from '../logic/validation';

export const CURRENT_SCHEMA_VERSION = 1;

export interface StoredState {
  version: number;
  config: AppConfig;
  entries: DayEntry[];
  lastUpdated: string;
}

export interface MigrationResult {
  success: boolean;
  data?: StoredState;
  error?: string;
}

/**
 * Migrate data from older schema versions to current version.
 * Currently only version 1 exists, so this is a placeholder for future migrations.
 */
export function migrate(data: unknown): MigrationResult {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Invalid data format' };
  }

  const obj = data as Record<string, unknown>;

  // Check for version field
  const version = typeof obj.version === 'number' ? obj.version : 0;

  // Handle missing version (assume v1)
  if (version === 0 || version === 1) {
    // Validate the config
    if (!obj.config || typeof obj.config !== 'object') {
      return { success: false, error: 'Missing or invalid config' };
    }

    const config = obj.config as AppConfig;
    const validation = validateConfig(config);

    if (!validation.valid) {
      return { success: false, error: `Invalid config: ${validation.errors.join(', ')}` };
    }

    // Validate entries
    const entries = Array.isArray(obj.entries) ? obj.entries as DayEntry[] : [];

    return {
      success: true,
      data: {
        version: CURRENT_SCHEMA_VERSION,
        config,
        entries,
        lastUpdated: typeof obj.lastUpdated === 'string'
          ? obj.lastUpdated
          : new Date().toISOString(),
      },
    };
  }

  // Future: Handle migrations from version 2, 3, etc.
  if (version > CURRENT_SCHEMA_VERSION) {
    return {
      success: false,
      error: `Data version ${version} is newer than supported version ${CURRENT_SCHEMA_VERSION}`,
    };
  }

  return { success: false, error: `Unknown schema version: ${version}` };
}

/**
 * Create exportable state from current config and entries.
 */
export function createExportData(config: AppConfig, entries: DayEntry[]): StoredState {
  return {
    version: CURRENT_SCHEMA_VERSION,
    config,
    entries,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Generate filename for export.
 */
export function generateExportFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  return `wow-pvp-grind-${date}.json`;
}
