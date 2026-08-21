"use client";

import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "../theme-toggle";

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

export const MobileLandingNavbar = () => {
  const [active, setActive] = useState("#morph");

  const navRef = useRef<HTMLUListElement>(null);
  const [indicatorX, setIndicatorX] = useState(0);

  useEffect(() => {
    const activeIndex = navLinks.findIndex((item) => item.url === active);

    const activeItem = navRef.current?.children[activeIndex + 1] as
      | HTMLElement
      | undefined;

    const nav = navRef.current;

    if (!activeItem || !nav) return;

    const navRect = nav.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    setIndicatorX(itemRect.left - navRect.left + itemRect.width / 2 - 4);
  }, [active]);

  useEffect(() => {
    const activeIndex = navLinks.findIndex((item) => item.url === active);

    const activeItem = navRef.current?.children[activeIndex + 1] as
      | HTMLElement
      | undefined;

    const nav = navRef.current;

    if (!activeItem || !nav) return;

    const navRect = nav.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    setIndicatorX(itemRect.left - navRect.left + itemRect.width / 2 - 4);
  }, [active]);

  return (
    <nav className="flex w-full justify-center items-center">
      <ul ref={navRef} className="relative flex gap-5 max-w-90">
        <span
          className="pointer-events-none absolute left-0 top-6 flex h-5 w-2 items-center transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(${indicatorX}px)`,
          }}
        >
          <svg
            className="rotate-180"
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
        <ThemeToggle />
      </ul>
    </nav>
  );
};
