// DashboardContext.tsx
import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

export const DashboardContext = createContext<any>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [cachedStats, setCachedStats] = useState<any>(null);
  const [cachedSettlements, setCachedSettlements] = useState<any[]>([]);
  const [cachedBlacklist, setCachedBlacklist] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('dashboardCache');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCachedStats(parsed.stats);
        setCachedSettlements(parsed.settlements);
        setCachedBlacklist(parsed.blacklist);
      } catch (e) {
        console.error('Failed to load cache', e);
      }
    }
  }, []);

  const updateCache = (stats: any, settlements: any[], blacklist: any[]) => {
    setCachedStats(stats);
    setCachedSettlements(settlements);
    setCachedBlacklist(blacklist);
    setLastUpdate(new Date());

    // Save to localStorage
    localStorage.setItem(
      'dashboardCache',
      JSON.stringify({
        stats,
        settlements,
        blacklist,
        timestamp: new Date().toISOString(),
      })
    );
  };

  const clearCache = () => {
    setCachedStats(null);
    setCachedSettlements([]);
    setCachedBlacklist([]);
    localStorage.removeItem('dashboardCache');
  };

  return (
    <DashboardContext.Provider
      value={{
        cachedStats,
        setCachedStats,
        cachedSettlements,
        setCachedSettlements,
        cachedBlacklist,
        setCachedBlacklist,
        lastUpdate,
        setLastUpdate,
        updateCache,
        clearCache,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}