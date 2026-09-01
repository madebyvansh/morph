"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";
import { HeroPreview } from "./hero-preview";

const breakpoint: number = 1024;

export const HeroSection = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <section className="w-full h-full flex flex-col gap-8">
      <div>
        <Image
          alt="Logo"
          src={theme === "dark" ? "/dark_logo.png" : "/logo.png"}
          width={40}
          height={40}
        />
        <div className="w-full mt-3">
          <p className="font-heading text-muted-foreground">X said no</p>
          <h1 className="text-4xl font-semibold">So I built Morph</h1>
        </div>
      </div>
      <div className="w-full text-foreground/70 space-y-8">
        <p>
          I found a GIF I really wanted to use as my X profile picture, but{" "}
          <span className="text-foreground">
            there was no way to make it move
          </span>
          . X kept everything static, while platforms like Discord had already
          figured out how much more fun an{" "}
          <span className="text-foreground">animated profile</span> could be.
        </p>
        <p>
          So instead of waiting for X to add it,{" "}
          <span className="text-foreground">I decided to build it myself</span>.
          Morph is a tiny Chrome extension that lets you{" "}
          <span className="text-foreground">
            turn your X profile picture and banner into GIFs.
          </span>
        </p>
      </div>
      <div className="mx-auto max-w-lg w-full relative">
        <HeroPreview />
        <span
          className={`flex absolute gap-2 items-center -bottom-9 ${window.innerWidth > breakpoint ? "left-1/3 " : "left-[10%]"} text-foreground/50`}
        >
          <span className="text-sm">
            {window.innerWidth > breakpoint ? "Hover here" : "Click here"} in
            this area
          </span>
          <svg
            width="30"
            height="30"
            viewBox="0 0 172 103"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="scale-y-[-1] -rotate-10 mb-4 opacity-50"
          >
            <path
              d="M152.839 85.2563C154.227 79.3686 151.783 75.2583 147.84 72.3145C144.34 69.7039 140.341 67.4821 136.286 65.9268C128.01 62.7608 119.401 60.6501 109.903 59.8169C109.403 61.8721 108.903 63.9272 108.403 65.9824C107.126 71.759 106.348 77.7023 104.459 83.2012C101.071 92.9215 93.9057 99.0314 84.0187 101.92C73.9096 104.864 64.5226 100.809 59.968 91.1997C52.4694 75.3139 57.4684 61.4277 69.9104 53.2626C73.5764 50.8742 77.7979 49.2634 81.9637 47.7637C85.4075 46.4861 89.0735 45.9307 93.406 44.8198C92.9061 42.7647 92.8503 40.5429 91.795 38.9321C89.4066 35.2106 87.1293 31.1003 83.7966 28.4342C65.078 13.4371 44.0265 7.71593 20.42 14.4924C15.1433 15.9921 9.9778 18.0473 6.14521 22.4908C5.47868 23.2685 3.25673 23.2684 2.09029 22.8241C0.146224 22.0465 -0.520313 19.7692 0.423947 18.2139C2.14583 15.4922 4.14555 12.6594 6.64506 10.7154C17.0319 2.71695 29.1961 -0.44914 42.0825 0.050762C55.191 0.550664 67.5777 4.16112 79.1865 10.3821C91.4063 16.9364 100.46 26.2123 105.126 39.4875C105.737 41.2094 106.514 42.9313 107.514 45.4308C123.178 48.8746 139.786 50.9853 155.061 60.6501C155.449 56.873 155.616 54.0958 156.005 51.3741C156.338 48.9301 157.893 47.4304 160.226 46.7639C162.448 46.1529 165.447 47.8193 166.336 50.3743C167.169 52.8183 167.947 55.3178 168.225 57.8728C169.502 68.8707 170.669 79.9241 171.835 90.9775C171.946 92.0884 172.002 93.1993 171.891 94.3102C171.502 98.476 168.558 101.364 164.448 100.753C152.394 98.9203 140.397 96.7541 128.399 94.6989C127.344 94.5323 125.955 94.2546 125.344 93.5325C124.233 92.1994 123.067 90.5887 122.956 88.9779C122.845 87.9781 124.4 86.2006 125.566 85.8673C128.344 84.9786 131.287 84.3676 134.176 84.3676C138.231 84.3676 142.285 85.0341 146.34 85.3119C148.395 85.3674 150.561 85.2563 152.839 85.2563ZM96.072 59.5392C87.0738 58.8727 80.6861 60.4834 75.4649 64.3716C68.4107 69.6483 66.5222 78.1466 70.5215 86.0895C72.5766 90.1998 76.076 91.8662 80.5751 90.8108C86.7961 89.3666 91.0729 85.5341 93.4613 79.7019C96.0719 73.4809 96.8497 66.9822 96.072 59.5392Z"
              fill={theme === "dark" ? "#fafafa" : "#0a0a0a"}
            />
          </svg>
        </span>
      </div>
    </section>
  );
};
