import { useCallback } from 'react';
import type { AppConfig, BGHonorConfig, BGHonorValues, ValidationResult } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { createDefaultConfig } from '../config/defaults';
import { validateConfig } from '../logic/validation';

const STORAGE_KEY = 'wow-pvp-grinder-config';

interface UseConfigReturn {
  config: AppConfig;
  validation: ValidationResult;
  updateConfig: (updates: Partial<AppConfig>) => void;
  updateBGHonor: (bg: keyof BGHonorConfig, values: Partial<BGHonorValues>) => void;
  resetConfig: () => void;
  setConfig: (config: AppConfig) => void;
}

export function useConfig(): UseConfigReturn {
  const [config, setConfigInternal, clearConfig] = useLocalStorage<AppConfig>(
    STORAGE_KEY,
    createDefaultConfig()
  );

  const validation = validateConfig(config);

  const updateConfig = useCallback(
    (updates: Partial<AppConfig>) => {
      setConfigInternal((prev) => ({
        ...prev,
        ...updates,
      }));
    },
    [setConfigInternal]
  );

  const updateBGHonor = useCallback(
    (bg: keyof BGHonorConfig, values: Partial<BGHonorValues>) => {
      setConfigInternal((prev) => ({
        ...prev,
        bgHonor: {
          ...prev.bgHonor,
          [bg]: {
            ...prev.bgHonor[bg],
            ...values,
          },
        },
      }));
    },
    [setConfigInternal]
  );

  const resetConfig = useCallback(() => {
    clearConfig();
    setConfigInternal(createDefaultConfig());
  }, [clearConfig, setConfigInternal]);

  const setConfig = useCallback(
    (newConfig: AppConfig) => {
      setConfigInternal(newConfig);
    },
    [setConfigInternal]
  );

  return {
    config,
    validation,
    updateConfig,
    updateBGHonor,
    resetConfig,
    setConfig,
  };
}
