import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('streamify-theme') ||"dim", // Default theme
  setTheme: (theme) => {
    localStorage.setItem('streamify-theme', theme); // Save theme to localStorage
    set({ theme })
  }
}));
