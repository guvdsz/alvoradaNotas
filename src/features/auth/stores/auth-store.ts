import { create } from "zustand";

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated";

export type AuthUser = {
  id: string;
  email: string | null;
};

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  setStatus: (status: AuthStatus) => void;
  setUser: (user: AuthUser | null) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: "idle",
  user: null,
  setStatus: (status) => set({ status }),
  setUser: (user) =>
    set({
      user,
      status: user ? "authenticated" : "unauthenticated",
    }),
  reset: () => set({ status: "unauthenticated", user: null }),
}));
