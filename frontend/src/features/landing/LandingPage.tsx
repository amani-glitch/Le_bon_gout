import { Basil, Pepperoni, PizzaSlice } from "@/components/brand/FoodIcons";

import { SalesBotWidget } from "./SalesBotWidget";
import { CapabilitiesSection } from "./sections/CapabilitiesSection";
import { ContactSection } from "./sections/ContactSection";
import { DiscussSection } from "./sections/DiscussSection";
import { HeroSection } from "./sections/HeroSection";
import { HowSection } from "./sections/HowSection";
import { LandingFooter } from "./sections/LandingFooter";
import { LocationsSection } from "./sections/LocationsSection";
import { ShowcaseSection } from "./sections/ShowcaseSection";

/** Faint, oversized food silhouettes that warm up the page background. */
function FoodBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <PizzaSlice className="absolute -right-10 top-[22%] h-64 w-64 rotate-12 opacity-[0.05] blur-[1px]" />
      <Basil className="absolute -left-12 top-[52%] h-72 w-72 -rotate-12 opacity-[0.05] blur-[1px]" />
      <Pepperoni className="absolute right-[12%] bottom-[8%] h-56 w-56 opacity-[0.04] blur-[1px]" />
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="relative mx-auto max-w-6xl px-6">
      <FoodBackdrop />
      <HeroSection />
      <CapabilitiesSection />
      <ShowcaseSection />
      <HowSection />
      <DiscussSection />
      <LocationsSection />
      <ContactSection />
      <LandingFooter />
      <SalesBotWidget />
    </div>
  );
}
