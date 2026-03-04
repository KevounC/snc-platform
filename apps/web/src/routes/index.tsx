import { createFileRoute } from "@tanstack/react-router";
import type React from "react";

import { HeroSection } from "../components/landing/hero-section.js";
import { FeaturedCreators } from "../components/landing/featured-creators.js";
import { RecentContent } from "../components/landing/recent-content.js";
import { LandingPricing } from "../components/landing/landing-pricing.js";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage(): React.ReactElement {
  return (
    <>
      <HeroSection />
      <FeaturedCreators />
      <RecentContent />
      <LandingPricing />
    </>
  );
}
