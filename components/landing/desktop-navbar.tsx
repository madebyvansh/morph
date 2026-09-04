"use client";

import { useEffect, useRef, useState } from "react";

const navLinks = [
  {
    title: "Morph",
    url: "#morph",
  },
  {
    title: "What?",
    url: "#what",
  },
  {
    title: "Demo",
    url: "#demo",
  },
  {
    title: "FAQ",
    url: "#faq",
  },
];

export const DesktopLandingNavbar = () => {
  const [active, setActive] = useState("#morph");

  const navRef = useRef<HTMLUListElement>(null);
  const [indicatorY, setIndicatorY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const viewportCenter = window.innerHeight / 2;

      let currentSection = navLinks[0].url;
      let closestDistance = Infinity;

      for (const { url } of navLinks) {
        const section = document.querySelector(url) as HTMLElement | null;

        if (!section) continue;

        const rect = section.getBoundingClientRect();

        // Ignore sections that are completely outside viewport
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          continue;
        }

        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          currentSection = url;
        }
      }

      setActive(currentSection);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const activeItem = navRef.current?.querySelector(
      `[data-nav="${active}"]`,
    ) as HTMLElement | null;

    if (!activeItem) return;

    setIndicatorY(activeItem.offsetTop + activeItem.offsetHeight / 2);
  }, [active]);

  return (
    <nav className="hidden lg:flex w-full max-w-96 flex-col items-end justify-between px-6 py-12 mt-2">
      <ul ref={navRef} className="fixed space-y-2">
        <span
          className="pointer-events-none absolute -left-4 top-[-0.65rem] flex h-5 w-2 items-center transition-transform duration-300 ease-out"
          style={{
            transform: `translateY(${indicatorY}px)`,
          }}
        >
          <svg
            className="-rotate-90"
            width="8"
            height="5"
            viewBox="0 0 8 5"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <polygon points="0,0 8,0 4,5" fill="#cccccc" />
          </svg>
        </span>

        {navLinks.map((item) => (
          <li
            data-nav={item.url}
            key={item.url}
            className={`relative flex items-center text-sm transition-colors duration-200 ease-out ${
              active === item.url
                ? "text-foreground"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                document.querySelector(item.url)?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className="cursor-pointer"
            >
              {item.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
