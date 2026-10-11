import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  importOpen: boolean;
  playlistVideoId: string | null;
  toast: string | null;
  toggleSidebar: () => void;
  closeMobileNav: () => void;
  setImportOpen: (open: boolean) => void;
  setPlaylistVideoId: (id: string | null) => void;
  notify: (message: string | null) => void;
}
export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  importOpen: false,
  playlistVideoId: null,
  toast: null,
  toggleSidebar: () =>
    set((state) =>
      window.matchMedia("(max-width: 900px)").matches
        ? { mobileNavOpen: !state.mobileNavOpen }
        : { sidebarCollapsed: !state.sidebarCollapsed },
    ),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  setImportOpen: (importOpen) => set({ importOpen }),
  setPlaylistVideoId: (playlistVideoId) => set({ playlistVideoId }),
  notify: (toast) => set({ toast }),
}));
