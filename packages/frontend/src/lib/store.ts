import { create } from 'zustand'

interface AppState {
  riskLevelFilter: 'all' | 'low' | 'medium' | 'high'
  setRiskLevelFilter: (filter: 'all' | 'low' | 'medium' | 'high') => void
}

export const useAppStore = create<AppState>((set) => ({
  riskLevelFilter: 'all',
  setRiskLevelFilter: (filter) => set({ riskLevelFilter: filter }),
}))
