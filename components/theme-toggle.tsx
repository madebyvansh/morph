"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  function cycleTheme() {
    if (theme === "light") setTheme("dark");
    else setTheme("light");
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="cursor-pointer"
    >
      {theme === "light" && <Sun size={20} aria-hidden="true" />}
      {theme === "dark" && <Moon size={20} aria-hidden="true" />}
    </button>
  );
}
