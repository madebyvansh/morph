import type { ReactNode } from "react";

type Props = {
  index: number;
  heading: string;
  content: string;
  icon: ReactNode;
};

export const WhatCard = ({ index, heading, content, icon }: Props) => {
  return (
    <div className="w-full border-b border-foreground/10 mb-4 pb-4">
      <div className="flex items-start gap-6">
        <div className="shrink-0 border border-dashed bg-foreground/20 p-1 mt-0.5 text-foreground/50">
          {icon}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg tracking-wider font-semibold">{heading}</h3>

            <span className="text-foreground/40">
              {String(index).padStart(2, "0")}
            </span>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-foreground/60">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
};
