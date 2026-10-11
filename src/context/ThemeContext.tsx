"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "aspiremint_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();

  // Helper to determine resolved theme
  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  // Apply theme to DOM
  const applyThemeToDOM = (resolved: ResolvedTheme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (resolved === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  };

  // Sync cookie for SSR hydration
  const syncCookie = (resolved: ResolvedTheme) => {
    if (typeof document === "undefined") return;
    document.cookie = `${THEME_STORAGE_KEY}=${resolved}; path=/; max-age=31536000; SameSite=Lax`;
  };

  // Initialize theme on mount
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      let initialTheme: ThemeMode = "light";
      let initialResolved: ResolvedTheme = "light";

      if (storedTheme === "dark" || storedTheme === "light" || storedTheme === "system") {
        initialTheme = storedTheme;
        initialResolved = storedTheme === "system" ? getSystemTheme() : storedTheme;
      } else {
        // Check if dark class was already set by anti-flash script
        const hasDarkClass = document.documentElement.classList.contains("dark");
        if (hasDarkClass) {
          initialTheme = "dark";
          initialResolved = "dark";
        } else {
          const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          if (systemPrefersDark) {
            initialTheme = "dark";
            initialResolved = "dark";
          }
        }
      }

      setThemeState(initialTheme);
      setResolvedTheme(initialResolved);
      applyThemeToDOM(initialResolved);
      syncCookie(initialResolved);
    } catch (e) {
      console.warn("Failed to read theme preference from storage:", e);
    } finally {
      setMounted(true);
    }
  }, []);

  // Listen for system theme changes if using 'system'
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const newResolved = e.matches ? "dark" : "light";
      setResolvedTheme(newResolved);
      applyThemeToDOM(newResolved);
      syncCookie(newResolved);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mounted, theme]);

  const setTheme = (newTheme: ThemeMode) => {
    startTransition(() => {
      setThemeState(newTheme);
      const newResolved = newTheme === "system" ? getSystemTheme() : newTheme;
      setResolvedTheme(newResolved);
      applyThemeToDOM(newResolved);
      syncCookie(newResolved);

      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch (e) {
        console.warn("Failed to persist theme preference:", e);
      }

      window.dispatchEvent(
        new CustomEvent("ASPIREMINT_THEME_CHANGED", {
          detail: { theme: newTheme, resolved: newResolved }
        })
      );
    });
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  const isDark = resolvedTheme === "dark";

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        isDark,
        setTheme,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback for components rendered outside ThemeProvider
    return {
      theme: "light" as ThemeMode,
      resolvedTheme: "light" as ResolvedTheme,
      isDark: false,
      setTheme: () => {},
      toggleTheme: () => {}
    };
  }
  return context;
}
