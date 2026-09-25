import { create } from 'zustand';

interface GlobalState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  
  // Theme state
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;

  // Global notification/toast state (for Phase 2 UI polish)
  toast: { message: string; type: 'success' | 'error' | 'info' | null } | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  
  theme: 'dark', // Default to dark for premium feel
  setTheme: (theme) => set({ theme }),

  toast: null,
  showToast: (message, type) => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set({ toast: null });
    }, 4000); // Auto-hide after 4 seconds
  },
  hideToast: () => set({ toast: null }),
}));
