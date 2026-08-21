import { MainLandingPage } from "@/components/landing/main";
import { DesktopLandingNavbar } from "@/components/landing/desktop-navbar";

const LandingPage = () => {
  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row">
      <DesktopLandingNavbar />
      <MainLandingPage />
    </div>
  );
};

export default LandingPage;
