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

export const LandingNavbar = () => {
  const [active, setActive] = useState("#morph");

  const navRef = useRef<HTMLUListElement>(null);
  const [indicatorY, setIndicatorY] = useState(0);

  useEffect(() => {
    const section = navLinks
      .map(({ url }) => document.querySelector(url))
      .filter((section): section is Element => section != null);

    const observer = new IntersectionObserver(
      (e) => {
        const visible = e
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      {
        threshold: [0.2, 0.5, 0.8],
        rootMargin: "-20% 0px -50% 0px",
      },
    );
    section.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const activeIndex = navLinks.findIndex((item) => item.url === active);

    const activeItem = navRef.current?.children[activeIndex + 1] as
      | HTMLElement
      | undefined;

    if (!activeItem) return;

    setIndicatorY(activeItem.offsetTop + activeItem.offsetHeight / 2);
  }, [active]);

  return (
    <nav className="flex w-full max-w-107 flex-col items-end justify-between px-6 py-18">
      <ul ref={navRef} className="fixed space-y-2">
        <span
          className="pointer-events-none absolute -left-4 -top-3 flex h-5 w-2 items-center transition-transform duration-300 ease-out"
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
            key={item.url}
            className={`relative flex items-center transition-colors duration-200 ease-out ${
              active === item.url
                ? "text-foreground"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                document.querySelector(item.url)?.scrollIntoView({
                  behavior: "smooth",
                });

                setActive(item.url);
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
