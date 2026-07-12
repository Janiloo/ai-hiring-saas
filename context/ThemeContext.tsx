"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start "light" so the server render and the first client render agree — a
  // client component can't read the cookie during SSR, so anything derived from
  // `theme` (e.g. the toggle icon) must render identically on both to avoid a
  // hydration mismatch. The real theme is resolved in the mount effect below.
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // On mount, resolve the actual theme from the cookie (which the server also
  // used to set <html class="dark">), or the current DOM class / system pref.
  useEffect(() => {
    const cookie = document.cookie.match(/(?:^|;\s*)theme=(dark|light)/);
    const resolved: Theme = cookie
      ? (cookie[1] as Theme)
      : document.documentElement.classList.contains("dark")
      ? "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    setTheme(resolved);
    setMounted(true);
  }, []);

  // Sync the DOM/cookie only after mount, so we never clobber the correct
  // server-set <html> class with the placeholder "light" value on first paint.
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`;
  }, [theme, mounted]);

  const toggle = () => {
    document.documentElement.classList.add("theme-transitioning");
    setTheme((t) => (t === "light" ? "dark" : "light"));
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning");
    }, 350);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
