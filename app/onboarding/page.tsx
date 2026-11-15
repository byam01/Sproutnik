import type { Metadata } from "next";
import { OnboardingHarness } from "@/components/onboarding/OnboardingHarness";

export const metadata: Metadata = {
  title: "Onboarding Exploration | Rotation Compass",
  description: "Interactive prototype exploration of 3 farmer-friendly onboarding variants for Sproutnik.",
};

export default function OnboardingPage() {
  return <OnboardingHarness />;
}
