"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BotInfo, BotMetadata } from "@/lib/types";

interface ProbeProgress {
  checked: number;
  total: number;
}

interface AppState {
  botToken: string | null;
  openaiKey: string | null;
  botInfo: BotInfo | null;
  defaultMetadata: BotMetadata | null;
  configuredLanguages: string[];
  languageMetadata: Record<string, BotMetadata>;
  isProbing: boolean;
  probeProgress: ProbeProgress | null;
}

interface AppActions {
  connect: (
    token: string,
    openaiKey: string | null,
    botInfo: BotInfo,
  ) => void;
  disconnect: () => void;
  setDefaultMetadata: (meta: BotMetadata) => void;
  setConfiguredLanguages: (langs: string[]) => void;
  setLanguageMetadata: (langCode: string, meta: BotMetadata) => void;
  addLanguage: (langCode: string) => void;
  removeLanguage: (langCode: string) => void;
  setIsProbing: (v: boolean) => void;
  setProbeProgress: (p: ProbeProgress | null) => void;
  updateLanguageMetadataCache: (langCode: string, meta: BotMetadata) => void;
}

type AppContextValue = AppState & AppActions;

const AppContext = createContext<AppContextValue | null>(null);

const initialState: AppState = {
  botToken: null,
  openaiKey: null,
  botInfo: null,
  defaultMetadata: null,
  configuredLanguages: [],
  languageMetadata: {},
  isProbing: false,
  probeProgress: null,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const connect = useCallback(
    (token: string, openaiKey: string | null, botInfo: BotInfo) => {
      setState((prev) => ({
        ...prev,
        botToken: token,
        openaiKey: openaiKey || null,
        botInfo,
        defaultMetadata: null,
        configuredLanguages: [],
        languageMetadata: {},
      }));
    },
    [],
  );

  const disconnect = useCallback(() => {
    setState(initialState);
  }, []);

  const setDefaultMetadata = useCallback((meta: BotMetadata) => {
    setState((prev) => ({ ...prev, defaultMetadata: meta }));
  }, []);

  const setConfiguredLanguages = useCallback((langs: string[]) => {
    setState((prev) => ({ ...prev, configuredLanguages: langs }));
  }, []);

  const setLanguageMetadata = useCallback(
    (langCode: string, meta: BotMetadata) => {
      setState((prev) => ({
        ...prev,
        languageMetadata: { ...prev.languageMetadata, [langCode]: meta },
      }));
    },
    [],
  );

  const addLanguage = useCallback((langCode: string) => {
    setState((prev) => {
      if (prev.configuredLanguages.includes(langCode)) return prev;
      return {
        ...prev,
        configuredLanguages: [...prev.configuredLanguages, langCode],
      };
    });
  }, []);

  const removeLanguage = useCallback((langCode: string) => {
    setState((prev) => {
      const { [langCode]: _, ...rest } = prev.languageMetadata;
      return {
        ...prev,
        configuredLanguages: prev.configuredLanguages.filter(
          (l) => l !== langCode,
        ),
        languageMetadata: rest,
      };
    });
  }, []);

  const setIsProbing = useCallback((v: boolean) => {
    setState((prev) => ({ ...prev, isProbing: v }));
  }, []);

  const setProbeProgress = useCallback(
    (p: ProbeProgress | null) => {
      setState((prev) => ({ ...prev, probeProgress: p }));
    },
    [],
  );

  const updateLanguageMetadataCache = useCallback(
    (langCode: string, meta: BotMetadata) => {
      setState((prev) => ({
        ...prev,
        languageMetadata: { ...prev.languageMetadata, [langCode]: meta },
      }));
    },
    [],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      connect,
      disconnect,
      setDefaultMetadata,
      setConfiguredLanguages,
      setLanguageMetadata,
      addLanguage,
      removeLanguage,
      setIsProbing,
      setProbeProgress,
      updateLanguageMetadataCache,
    }),
    [
      state,
      connect,
      disconnect,
      setDefaultMetadata,
      setConfiguredLanguages,
      setLanguageMetadata,
      addLanguage,
      removeLanguage,
      setIsProbing,
      setProbeProgress,
      updateLanguageMetadataCache,
    ],
  );

  return <AppContext value={value}>{children}</AppContext>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
