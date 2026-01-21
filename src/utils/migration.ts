import type { AppConfig, DayEntry } from '../types';
import { validateConfig } from '../logic/validation';

export const SCHEMA_VERSION = 1;

export interface StoredState {
  version: number;
  config: AppConfig;
  entries: DayEntry[];
  lastUpdated: string;
}

export interface ParseResult {
  success: boolean;
  data?: StoredState;
  error?: string;
}

export function parseImportData(data: unknown): ParseResult {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Invalid data format' };
  }

  const obj = data as Record<string, unknown>;

  if (!obj.config || typeof obj.config !== 'object') {
    return { success: false, error: 'Missing or invalid config' };
  }

  const config = obj.config as AppConfig;
  const validation = validateConfig(config);

  if (!validation.valid) {
    return { success: false, error: `Invalid config: ${validation.errors.join(', ')}` };
  }

  const entries = Array.isArray(obj.entries) ? obj.entries as DayEntry[] : [];

  return {
    success: true,
    data: {
      version: SCHEMA_VERSION,
      config,
      entries,
      lastUpdated: typeof obj.lastUpdated === 'string'
        ? obj.lastUpdated
        : new Date().toISOString(),
    },
  };
}

export function createExportData(config: AppConfig, entries: DayEntry[]): StoredState {
  return {
    version: SCHEMA_VERSION,
    config,
    entries,
    lastUpdated: new Date().toISOString(),
  };
}

export function generateExportFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  return `wow-pvp-grind-${date}.json`;
}
