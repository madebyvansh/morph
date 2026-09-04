import { DemoSection } from "./demo";
import { FaqSection } from "./faq";
import { Footer } from "./footer";
import { HeroSection } from "./hero";
import { MobileLandingNavbar } from "./mobile-navbar";
import { WhatSection } from "./what";

export const MainLandingPage = () => {
  return (
    <main className="h-full w-full max-w-3xl min-h-screen mr-auto border-x border-x-foreground/10 px-6 pt-12">
      <div className="lg:hidden mb-12">
        <MobileLandingNavbar />
      </div>
      <HeroSection />
      <WhatSection />
      <DemoSection />
      <FaqSection />
      <Footer />
    </main>
  );
};
