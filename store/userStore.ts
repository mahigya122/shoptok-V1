import { create } from "zustand";
import { getCurrentUserId, onAuthStateChange } from "../services/auth";

type UserState = {
  userId: string | null;
  setUserId: (id: string | null) => void;
};

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),
}));

let initialized = false;

// Initialize auth listener (guarded to avoid duplicate listeners in dev/HMR)
if (!initialized) {
  initialized = true;
  onAuthStateChange((id) => useUserStore.getState().setUserId(id));
  getCurrentUserId().then((id) => useUserStore.getState().setUserId(id));
}
