import { create } from "zustand";

export interface GoogleProfile {
  name: string;
  email?: string;
}
interface AuthState {
  accessToken: string | null;
  expiresAt: number;
  profile: GoogleProfile | null;
  status: "disconnected" | "connecting" | "connected";
  error: string | null;
  begin: () => void;
  accept: (token: string, seconds: number) => void;
  setProfile: (token: string, profile: GoogleProfile) => void;
  disconnect: (message?: string) => void;
  fail: (message: string) => void;
}
// Deliberately not persisted: no OAuth token or Google profile is written to browser storage.
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  expiresAt: 0,
  profile: null,
  status: "disconnected",
  error: null,
  begin: () => set({ status: "connecting", error: null }),
  accept: (accessToken, seconds) =>
    set({
      accessToken,
      expiresAt: Date.now() + seconds * 1000,
      status: "connected",
      profile: null,
      error: null,
    }),
  setProfile: (token, profile) =>
    set((state) => (state.accessToken === token ? { profile } : {})),
  disconnect: (message) =>
    set({
      accessToken: null,
      expiresAt: 0,
      profile: null,
      status: "disconnected",
      error: message ?? null,
    }),
  fail: (error) =>
    set((state) => ({
      error,
      status: state.accessToken ? "connected" : "disconnected",
    })),
}));
