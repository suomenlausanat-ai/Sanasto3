import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { describeError } from '@/lib/errors';
import { parseGameSettings, type GameSetupConfig } from '@/lib/games/gameConfig';
import { supabase } from '@/lib/supabase';

const GAME_SETTINGS_METADATA_KEY = 'game_settings';
const SAVE_DELAY_MS = 800;
const GAME_CATEGORY_FILTER_KEY = 'sanasto.gameCategoryIds';

function readStoredCategoryIds(): string[] | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(GAME_CATEGORY_FILTER_KEY) ?? 'null');
    return Array.isArray(value) && value.every((item): item is string => typeof item === 'string') ? value : null;
  } catch {
    return null;
  }
}

export function useGameSettings(): {
  config: GameSetupConfig;
  updateConfig: (next: GameSetupConfig) => void;
  saveError: string | null;
} {
  const { user } = useAuth();
  const [config, setConfig] = useState<GameSetupConfig>(() => {
    const storedConfig = parseGameSettings(user?.user_metadata?.[GAME_SETTINGS_METADATA_KEY]);
    const storedCategoryIds = readStoredCategoryIds();
    return storedCategoryIds ? { ...storedConfig, categoryIds: storedCategoryIds } : storedConfig;
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const pendingConfig = useRef<GameSetupConfig | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushSave = useCallback((next: GameSetupConfig) => {
    pendingConfig.current = null;
    void supabase.auth
      .updateUser({ data: { [GAME_SETTINGS_METADATA_KEY]: next } })
      .then(({ error }) => {
        if (error) setSaveError(describeError(error));
      });
  }, []);

  const updateConfig = useCallback(
    (next: GameSetupConfig) => {
      setConfig(next);
      setSaveError(null);
      localStorage.setItem(GAME_CATEGORY_FILTER_KEY, JSON.stringify(next.categoryIds));
      pendingConfig.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (pendingConfig.current) flushSave(pendingConfig.current);
      }, SAVE_DELAY_MS);
    },
    [flushSave],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        if (pendingConfig.current) flushSave(pendingConfig.current);
      }
    };
  }, [flushSave]);

  return { config, updateConfig, saveError };
}
