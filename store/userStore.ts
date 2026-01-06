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

// Initialize auth listener
onAuthStateChange((id) => useUserStore.getState().setUserId(id));
getCurrentUserId().then((id) => useUserStore.getState().setUserId(id));
