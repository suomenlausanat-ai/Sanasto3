import { createContext, useContext, useEffect } from 'react';

export interface AppHeaderState {
  title: string;
  onBack?: () => void;
  hideChrome?: boolean;
}

const AppHeaderContext = createContext<(header: AppHeaderState | null) => void>(() => {});

export function AppHeaderProvider({
  value,
  children,
}: {
  value: (header: AppHeaderState | null) => void;
  children: React.ReactNode;
}) {
  return <AppHeaderContext.Provider value={value}>{children}</AppHeaderContext.Provider>;
}

export function useAppHeader(header: AppHeaderState | null) {
  const setHeader = useContext(AppHeaderContext);
  useEffect(() => {
    setHeader(header);
    return () => setHeader(null);
  }, [header, setHeader]);
}
