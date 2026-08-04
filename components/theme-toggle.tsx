"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => void;
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const updateStyles = (css: string) => {
    let style = document.getElementById(
      "theme-transition",
    ) as HTMLStyleElement | null;

    if (!style) {
      style = document.createElement("style");
      style.id = "theme-transition";
      document.head.appendChild(style);
    }

    style.textContent = css;
  };

  const createAnimation = () => ({
    css: `
      ::view-transition-group(root) {
        animation-duration: 700ms;
        animation-timing-function: ease-out;
      }
  
      ::view-transition-new(root) {
        animation-name: reveal;
      }
  
      ::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
  
      @keyframes reveal {
        from {
          clip-path: polygon(
            0% 100%,
            100% 100%,
            100% 100%,
            0% 100%
          );
        }
  
        to {
          clip-path: polygon(
            0% 0%,
            100% 0%,
            100% 100%,
            0% 100%
          );
        }
      }
    `,
  });

  function cycleTheme() {
    const animation = createAnimation();

    updateStyles(animation.css);

    const switchTheme = () => {
      setTheme(theme === "light" ? "dark" : "light");
    };

    const doc = document as ViewTransitionDocument;

    if (!doc.startViewTransition) {
      switchTheme();
      return;
    }

    doc.startViewTransition(switchTheme);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={cycleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        className="cursor-pointer"
      >
        {theme === "light" ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  );
}
