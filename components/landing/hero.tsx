"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

export const HeroSection = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <section className="w-full h-full">
      <Image
        alt="Logo"
        src={theme === "dark" ? "/dark_logo.png" : "/logo.png"}
        width={40}
        height={40}
      />
    </section>
  );
};
