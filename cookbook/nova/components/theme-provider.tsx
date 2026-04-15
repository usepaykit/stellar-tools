"use client";

import React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // On mount, read from localStorage and apply
  useEffect(() => {
    const stored = localStorage.getItem("neural-core-theme") as Theme | null;
    const initialTheme = stored || "dark";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(initialTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(initialTheme);
    setMounted(true);
  }, []);

  // When theme changes, update DOM and localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
    localStorage.setItem("neural-core-theme", newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
