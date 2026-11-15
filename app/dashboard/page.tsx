import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Farm Advisory Dashboard | Sproutnik",
  description:
    "Interactive agronomic decision support, crop rotation feasibility, climate analytics, and economic viability powered by NASA POWER and PAU evidence.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
