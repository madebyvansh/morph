import { UserRound, GalleryThumbnails, Cog, Sparkle } from "lucide-react";

import { WhatCard } from "./what-card";

const points = [
  {
    heading: "I Like GIFs",
    content:
      "Sometimes a still image just doesn't hit the same. If there's a GIF that fits the vibe, I want to use it.",
    icon: GalleryThumbnails,
  },
  {
    heading: "More Personality",
    content:
      "Your profile is one of the first things people see. A little movement can make it feel a lot more personal.",
    icon: UserRound,
  },
  {
    heading: "X Keeps It Still",
    content:
      "X lets you customize almost everything around your profile, except the part that could actually move.",
    icon: Sparkle,
  },
  {
    heading: "So I Built Morph",
    content:
      "A small Chrome extension that lets you use animated profile pictures and banners on X.",
    icon: Cog,
  },
];

export const WhatSection = () => {
  return (
    <section id="what" className="flex mt-36 flex-col lg:flex-row w-full gap-4">
      <div className="flex lg:w-1/2 flex-col gap-10">
        <span className="flex items-center gap-2 text-xs uppercase text-foreground/50">
          <span className="size-1 bg-foreground/40" />
          The Idea
        </span>

        <h2 className="text-2xl font-semibold">
          Why does my profile <br className="lg:hidden" /> picture{" "}
          <br className="hidden lg:block" />
          have to <br className="lg:hidden" /> be a still image?
        </h2>
      </div>

      <div className="lg:w-1/2 mt-15">
        {points.map((point, index) => (
          <WhatCard
            key={point.heading}
            index={index + 1}
            heading={point.heading}
            content={point.content}
            icon={<point.icon size={12} />}
          />
        ))}
      </div>
    </section>
  );
};
