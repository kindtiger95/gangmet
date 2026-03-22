'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppContextValue {
  selectedWorkplaceId: number | null;
  setSelectedWorkplaceId: (id: number | null) => void;
  currentYear: number;
  currentMonth: number;
  setCurrentYear: (y: number) => void;
  setCurrentMonth: (m: number) => void;
  navigateMonth: (delta: number) => void;
  isAdminMode: boolean;
  toggleAdminMode: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const now = new Date();
  const [selectedWorkplaceId, setSelectedWorkplaceIdState] = useState<number | null>(null);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Persist selectedWorkplaceId in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('selectedWorkplaceId');
    if (stored) setSelectedWorkplaceIdState(Number(stored));
  }, []);

  function setSelectedWorkplaceId(id: number | null) {
    setSelectedWorkplaceIdState(id);
    if (id === null) {
      localStorage.removeItem('selectedWorkplaceId');
    } else {
      localStorage.setItem('selectedWorkplaceId', String(id));
    }
  }

  function navigateMonth(delta: number) {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  }

  function toggleAdminMode() {
    setIsAdminMode((prev) => !prev);
  }

  return (
    <AppContext.Provider value={{
      selectedWorkplaceId, setSelectedWorkplaceId,
      currentYear, currentMonth, setCurrentYear, setCurrentMonth,
      navigateMonth, isAdminMode, toggleAdminMode,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
