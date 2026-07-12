"use client";

import { useTheme } from "@/context/ThemeContext";
import Icon from "@/components/ui/Icon";

// Standalone light/dark toggle for the auth pages (no sidebar available there).
export default function AuthThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
    </button>
  );
}
