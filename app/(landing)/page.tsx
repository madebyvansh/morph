import { MainLandingPage } from "@/components/landing/main";
import { LandingNavbar } from "@/components/landing/navbar";

const LandingPage = () => {
  return (
    <div className="w-full min-h-screen flex">
      <LandingNavbar />
      <MainLandingPage />
    </div>
  );
};

export default LandingPage;
