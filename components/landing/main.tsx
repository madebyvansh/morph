import { HeroSection } from "./hero";
import { MobileLandingNavbar } from "./mobile-navbar";

export const MainLandingPage = () => {
  return (
    <main className="h-full w-full max-w-3xl min-h-screen mr-auto border-x border-x-foreground/10 px-6 py-8 lg:py-18">
      <div className="lg:hidden mb-12">
        <MobileLandingNavbar />
      </div>
      <HeroSection />
    </main>
  );
};
