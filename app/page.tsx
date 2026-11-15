"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CompassIcon,
  SproutIcon,
  DropletIcon,
  ShieldCheckIcon,
  BarChartIcon,
  LayersIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  ActivityIcon,
  InfoIcon,
  SunIcon,
  CloudRainIcon,
  ThermometerIcon,
  MenuIcon,
  XIcon,
} from "@/components/icons";
import { loadStoredProfile } from "@/services/profileStorage";
import { FarmerProfile, isKnownField } from "@/types";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [storedProfile, setStoredProfile] = useState<FarmerProfile | null>(null);
  const [profileDistrict, setProfileDistrict] = useState<string | null>(null);

  useEffect(() => {
    const envelope = loadStoredProfile();
    if (envelope && envelope.profile) {
      setStoredProfile(envelope.profile);
      if (
        isKnownField(envelope.profile.location) &&
        envelope.profile.location.value.district
      ) {
        setProfileDistrict(envelope.profile.location.value.district);
      }
    }
  }, []);

  const steps = [
    {
      num: 1,
      title: "Enter Farm Specifications",
      tagline: "Your local soil, water, and land holding",
      desc: "Configure your district, verified soil texture (loam, sandy loam, clay loam), irrigation infrastructure (canal, deep or shallow tubewell, rainfed), and operational area in hectares or acres.",
      icon: SproutIcon,
    },
    {
      num: 2,
      title: "Atmospheric & Climate Analysis",
      tagline: "10-year NASA POWER satellite observations",
      desc: "Sproutnik retrieves 10-year daily historical solar radiation, air temperature, and precipitation data for your exact coordinates to model seasonal monsoon concentration and thermal risk windows.",
      icon: CloudRainIcon,
    },
    {
      num: 3,
      title: "Evaluate Rotation Alternatives",
      tagline: "Agronomic feasibility across cropping cycles",
      desc: "Our engine checks physical feasibility (percolation, iron chlorosis, turnaround days between Kharif harvest and Rabi sowing) for candidate rotations such as Maize–Wheat, Direct-Seeded Rice (DSR), and Summer Moong.",
      icon: LayersIcon,
    },
    {
      num: 4,
      title: "Economic & Water Trade-Offs",
      tagline: "CACP cost of cultivation & aquifer savings",
      desc: "Compare net returns (₹/ha), cultivation costs, Benefit-Cost Ratios (BCR), and water energy savings calculated against the conventional puddle-transplanted Rice–Wheat monoculture.",
      icon: BarChartIcon,
    },
    {
      num: 5,
      title: "Generate Actionable Advisory Report",
      tagline: "Printable PDF & offline HTML advisory document",
      desc: "Export an official, evidence-backed Farmer Advisory Report complete with feasibility determinations, itemized input costs, 3-scenario price sensitivity, and practical on-farm planting checklists.",
      icon: ShieldCheckIcon,
    },
  ];

  const features = [
    {
      title: "Climate Risk & Thermal Modeling",
      badge: "NASA POWER Satellite",
      desc: "Daily 2-meter air temperature and precipitation reanalysis covering 2015–2024 to identify heat stress windows and monsoon variability.",
      icon: ThermometerIcon,
      accent: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      title: "Stage A Agronomic Feasibility",
      badge: "PAU Field Research",
      desc: "Strict physical gating prevents high-risk recommendations—like DSR on coarse sandy soil susceptible to iron chlorosis or water-intensive crops under rainfed regimes.",
      icon: ShieldCheckIcon,
      accent: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Aquifer & Groundwater Protection",
      badge: "CGWB Depletion Baselines",
      desc: "Quantifies 30% to 50% irrigation water savings (380–650 mm/ha saved) and ₹1,500/ha pumping energy reductions to halt rapid water table decline.",
      icon: DropletIcon,
      accent: "text-sky-700 bg-sky-50 border-sky-200",
    },
    {
      title: "CACP/PAU Economic Intelligence",
      badge: "2023–24 Cost of Cultivation",
      desc: "Transparent financial metrics including itemized seed, fertilizer, labor, and machinery costs, plus biological nitrogen credits and byproduct straw values.",
      icon: BarChartIcon,
      accent: "text-forest-700 bg-forest-50 border-forest-200",
    },
    {
      title: "Interactive What-If Simulation",
      badge: "Real-Time Decision Support",
      desc: "Test changes to soil texture or irrigation infrastructure instantly without modifying your saved profile, observing dynamic feasibility and energy cost shifts.",
      icon: LayersIcon,
      accent: "text-purple-700 bg-purple-50 border-purple-200",
    },
    {
      title: "Printable Farmer Advisory Reports",
      badge: "Downloadable PDF & HTML",
      desc: "Produce comprehensive, transparent advisory documents with provenance footnotes and on-farm checklists for extension officers and farmers.",
      icon: ActivityIcon,
      accent: "text-stone-700 bg-stone-100 border-stone-200",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf8] text-[#1c2621] flex flex-col font-sans selection:bg-forest-100 selection:text-forest-900">
      {/* 1. STICKY TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-forest-800 text-white flex items-center justify-center shadow-xs group-hover:bg-forest-900 transition-colors">
              <CompassIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">
                  Sproutnik
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono font-semibold uppercase tracking-wider bg-forest-50 text-forest-800 px-2 py-0.5 rounded border border-forest-200">
                  Rotation Compass
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Open Agro-Climatic Decision Support
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#challenge" className="hover:text-forest-800 transition-colors">
              The Challenge
            </a>
            <a href="#how-it-works" className="hover:text-forest-800 transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-forest-800 transition-colors">
              Capabilities
            </a>
            <a href="#evidence" className="hover:text-forest-800 transition-colors">
              Data &amp; Integrity
            </a>
            <a href="#advisory-report" className="hover:text-forest-800 transition-colors">
              Advisory Report
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/dashboard?demo=true"
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors"
            >
              Explore Demo Dashboard
            </Link>
            <Link
              href="/onboarding"
              className="px-4 py-2 text-xs font-semibold text-white bg-forest-700 hover:bg-forest-800 active:bg-forest-900 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <SproutIcon size={14} />
              <span>Get Started</span>
            </Link>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex items-center gap-2 sm:hidden">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
              <a
                href="#challenge"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-forest-800"
              >
                The Challenge
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-forest-800"
              >
                How It Works
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-forest-800"
              >
                Capabilities
              </a>
              <a
                href="#evidence"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-forest-800"
              >
                Data &amp; Integrity
              </a>
              <a
                href="#advisory-report"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-forest-800"
              >
                Advisory Report
              </a>
            </nav>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/onboarding"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-xs font-semibold text-white bg-forest-700 rounded-xl"
              >
                Configure Farm Setup
              </Link>
              <Link
                href="/dashboard?demo=true"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl"
              >
                Explore Demo Dashboard
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. RETURNING FARMER QUICK ACCESS BANNER (Client-side Hydrated) */}
      {storedProfile && (
        <aside
          aria-label="Active farm profile notification"
          className="bg-emerald-50 border-b border-emerald-200/90 py-2.5 px-4 sm:px-6"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-950 font-medium">
              <span className="p-1 rounded-md bg-emerald-200 text-emerald-900 shrink-0">
                <CheckCircleIcon size={14} />
              </span>
              <span>
                <strong>Active Farm Profile Detected:</strong> You have an existing farm profile for{" "}
                <span className="font-bold underline decoration-emerald-500">
                  {profileDistrict ? `${profileDistrict}, Punjab` : "Configured Location"}
                </span>
                . Your customized agronomic feasibility and economic comparisons are ready.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/dashboard"
                className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1"
              >
                <span>Resume Dashboard</span>
                <ArrowRightIcon size={12} />
              </Link>
              <Link
                href="/onboarding"
                className="px-2.5 py-1 text-emerald-800 hover:text-emerald-950 font-medium hover:underline text-xs"
              >
                Edit Setup
              </Link>
            </div>
          </div>
        </aside>
      )}

      <main className="flex-1">
        {/* 3. HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200/80 bg-gradient-to-b from-white via-[#f6f9f6] to-[#f0f6f2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 border border-forest-200/90 text-forest-900 text-xs font-semibold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse" />
                <span>NASA Space Apps 2026 · Open Science Decision Support</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Climate-Smart Crop Rotation &amp;{" "}
                <span className="text-forest-700 underline decoration-forest-300 decoration-wavy">
                  Agricultural Advisory
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Transition beyond water-depleting Rice–Wheat monocultures in the Indo-Gangetic Plains.
                Sproutnik links 10-year NASA POWER satellite observations with Punjab Agricultural University (PAU) agronomic evidence to evaluate physical crop feasibility, groundwater preservation, and CACP-benchmarked profitability.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/onboarding"
                  className="px-6 py-3.5 bg-forest-700 hover:bg-forest-800 active:bg-forest-900 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group"
                >
                  <SproutIcon size={18} />
                  <span>Get Started — Setup Your Farm</span>
                  <ArrowRightIcon
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>

                <Link
                  href="/dashboard?demo=true"
                  className="px-6 py-3.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold text-sm rounded-xl border border-slate-300 shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <CompassIcon size={18} className="text-forest-700" />
                  <span>Explore Demo Dashboard</span>
                </Link>
              </div>

              {/* Trust Indicators / Stat Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/70 text-xs">
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80">
                  <div className="font-extrabold text-slate-900 text-lg sm:text-xl font-mono">
                    10 Years
                  </div>
                  <div className="text-slate-500 font-medium">NASA POWER Daily Climate Data</div>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80">
                  <div className="font-extrabold text-emerald-700 text-lg sm:text-xl font-mono">
                    30–50%
                  </div>
                  <div className="text-slate-500 font-medium">Irrigation Water Savings</div>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80">
                  <div className="font-extrabold text-slate-900 text-lg sm:text-xl font-mono">
                    6 Crops
                  </div>
                  <div className="text-slate-500 font-medium">CACP Cost Benchmarks</div>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80">
                  <div className="font-extrabold text-forest-800 text-lg sm:text-xl font-mono">
                    100%
                  </div>
                  <div className="text-slate-500 font-medium">Traceable Evidence &amp; Audits</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. THE CHALLENGE & THE SPROUTNIK SOLUTION */}
        <section id="challenge" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-3 py-1 rounded-full border border-forest-200">
                Agronomic Context
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                The Rice–Wheat Monoculture Trap
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Central Punjab and the Indo-Gangetic Plains face unprecedented ecological challenges. Puddle-transplanted rice demands vast groundwater volumes, while short turnaround windows lead to severe crop residue burning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {/* Problem Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
                    <AlertTriangleIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      The Conventional Baseline Crisis
                    </h3>
                    <p className="text-xs text-rose-800 font-medium">
                      Puddle-Transplanted Rice → Wheat System
                    </p>
                  </div>
                </div>

                <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                    <span>
                      <strong>Severe Aquifer Depletion:</strong> Rice requires ~1,100 mm of irrigation, extracting groundwater at rates of 1.0–1.5 meters per year.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                    <span>
                      <strong>Soil Degradation &amp; Compaction:</strong> Repeated puddling creates dense subsurface hardpans, impeding root penetration for subsequent winter crops.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                    <span>
                      <strong>Turnaround Window Pressure:</strong> Barely 15–20 days remain between late rice harvest and optimal wheat sowing, driving catastrophic residue burning.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                    <span>
                      <strong>Pumping Energy Costs:</strong> Deep submersible tubewells face rising power costs and frequent borehole re-drilling expenditures.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Sproutnik Solution Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                    <CheckCircleIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Sproutnik Agronomic Diversification
                    </h3>
                    <p className="text-xs text-emerald-800 font-medium">
                      Science-Backed Rotation Compass
                    </p>
                  </div>
                </div>

                <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                    <span>
                      <strong>40–50% Irrigation Reduction:</strong> Replacing paddy with Maize or Direct-Seeded Rice (DSR) saves up to 600 mm of water per hectare.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                    <span>
                      <strong>Biological Nitrogen Credits:</strong> Introducing Summer Moong (Zaid green gram) fixes atmospheric nitrogen, providing ₹1,400/ha soil nutrient value.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                    <span>
                      <strong>Physical Feasibility Gating:</strong> Automatically evaluates soil texture and turnaround intervals so farmers avoid costly agronomic failures.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                    <span>
                      <strong>Transparent Financial Analysis:</strong> Compares net returns with CACP 2023–24 cultivation benchmarks and 3-scenario price sensitivities.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5. HOW IT WORKS (5-STEP AGRO-DECISION JOURNEY) */}
        <section id="how-it-works" className="py-16 sm:py-20 bg-[#f8faf8] border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-3 py-1 rounded-full border border-forest-200">
                Decision Pipeline
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                How Sproutnik Works
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                From self-reported farm attributes to an actionable, printable farmer advisory report in five rigorous steps.
              </p>
            </div>

            {/* Interactive Step Explorer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Step Navigation Tabs */}
              <div className="lg:col-span-5 space-y-2">
                {steps.map((s) => {
                  const Icon = s.icon;
                  const isActive = activeStep === s.num;
                  return (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => setActiveStep(s.num)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${isActive
                        ? "bg-white border-forest-600 shadow-sm ring-1 ring-forest-600"
                        : "bg-white/60 hover:bg-white border-slate-200 text-slate-600"
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${isActive
                          ? "bg-forest-800 text-white"
                          : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {s.num}
                      </div>
                      <div className="space-y-0.5">
                        <div
                          className={`text-sm font-bold ${isActive ? "text-slate-900" : "text-slate-700"
                            }`}
                        >
                          {s.title}
                        </div>
                        <div className="text-xs text-slate-500">{s.tagline}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Step Detail Card */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                {(() => {
                  const current = steps.find((s) => s.num === activeStep) || steps[0];
                  const Icon = current.icon;
                  return (
                    <>
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-forest-100 text-forest-800">
                            <Icon size={24} />
                          </div>
                          <div>
                            <span className="text-[11px] font-mono font-bold text-forest-800 uppercase tracking-wider">
                              Step 0{current.num} of 05
                            </span>
                            <h3 className="text-xl font-bold text-slate-900">
                              {current.title}
                            </h3>
                          </div>
                        </div>
                        <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                          Automated Pipeline
                        </span>
                      </div>

                      <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                        {current.desc}
                      </p>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-2">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <ShieldCheckIcon size={14} className="text-forest-700" />
                          Scientific Traceability:
                        </div>
                        <p>
                          Evaluated deterministically in client and API layers without opaque black-box machine learning. Outputs cite specific Punjab Agricultural University recommendations and NASA coordinates.
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveStep((prev) => (prev > 1 ? prev - 1 : 5))
                          }
                          className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                          ← Previous Step
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveStep((prev) => (prev < 5 ? prev + 1 : 1))
                          }
                          className="px-4 py-2 text-xs font-semibold text-white bg-forest-700 hover:bg-forest-800 rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <span>Next Step</span>
                          <ArrowRightIcon size={13} />
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>

        {/* 6. FEATURES & AGRONOMIC CAPABILITIES */}
        <section id="features" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-3 py-1 rounded-full border border-forest-200">
                Core Capabilities
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Engineered for Real Agricultural Decisions
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Sproutnik provides a complete suite of decision-support tools tailored for farmers, extension agronomists, and policy researchers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="p-6 rounded-2xl bg-[#fafcfa] border border-slate-200/90 hover:border-forest-400 transition-all shadow-2xs hover:shadow-xs space-y-4 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl border ${feat.accent}`}>
                        <Icon size={20} />
                      </div>
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {feat.badge}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-forest-900 transition-colors">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7. DATA PROVENANCE, SCIENTIFIC INTEGRITY & TRUST */}
        <section id="evidence" className="py-16 sm:py-20 bg-[#f8faf8] border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-3 py-1 rounded-full border border-forest-200">
                Scientific Credibility
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Transparent Data Provenance &amp; Disclosures
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Trust in agricultural software depends on scientific honesty. Sproutnik strictly categorizes every data point so farmers know what is measured, benchmarked, or modeled.
              </p>
            </div>

            {/* Provenance Classification Table */}
            <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Data Stream</th>
                    <th className="py-3.5 px-4">Classification</th>
                    <th className="py-3.5 px-4">Authoritative Source</th>
                    <th className="py-3.5 px-4">Agricultural Role &amp; Limitation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      Daily Solar &amp; Air Temperature
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Measured Reanalysis
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      NASA POWER (MERRA-2)
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      10-year historical daily 2m temperature and irradiance. Not live real-time weather sensors.
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      Crop Cultivation Costs &amp; Yields
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                        Reference Benchmark
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      CACP 2023–24 &amp; PAU Guidelines
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      Government cost of cultivation surveys and university field trials; calibrated for Central Punjab.
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      Crop Water Demand (ETc)
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        Modeled Estimate
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      FAO-56 Dual Crop Coefficient
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      Estimated evapotranspiration requirements; not directly measured borehole extraction.
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      Aquifer Depletion &amp; Energy Savings
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                        Regional Proxy Indicator
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      CGWB Punjab Groundwater Report
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      Derived from tubewell electrical/diesel pumping hours and regional water table drawdown averages.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Core Integrity Rule Callout */}
            <div className="p-4 rounded-xl bg-forest-50 border border-forest-200/90 text-xs text-forest-900 flex items-start gap-3">
              <ShieldCheckIcon size={20} className="text-forest-700 shrink-0 mt-0.5" />
              <div>
                <strong>Our Non-Negotiable Agronomic Rule:</strong> An economically attractive rotation will{" "}
                <em>never</em> be recommended if it fails physical feasibility on your soil or water source. Financial returns are contingent upon agronomic survival.
              </div>
            </div>
          </div>
        </section>

        {/* 8. ADVISORY REPORT TEASER */}
        <section id="advisory-report" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-3 py-1 rounded-full border border-forest-200">
                Extension Ready
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Official Farmer Advisory Reports
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Generate clean, publication-ready A4 reports complete with farm context disclosures, physical feasibility checks, CACP financial breakdown, and on-farm checklists.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <span className="font-extrabold text-forest-900 text-lg block">
                    Sproutnik Farmer Agro-Climatic Advisory Report
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Document Format: Standard Printable A4 / Offline HTML
                  </span>
                </div>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors self-start sm:self-auto flex items-center gap-1.5"
                >
                  <span>Generate in Dashboard →</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">1. Farm Profile Disclosure</div>
                  <p className="text-slate-500">
                    Transparently separates farmer-provided details from regional demonstration assumptions.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">2. Physical Feasibility</div>
                  <p className="text-slate-500">
                    Soil percolation, turnaround interval, and iron chlorosis suitability determinations.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">3. Economic Projections</div>
                  <p className="text-slate-500">
                    Itemized cultivation costs, net return deltas, and 3-scenario market price sensitivities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. FINAL CALL TO ACTION */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-[#1b3d2b] to-[#12281d] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-900/60 text-emerald-200 border border-emerald-700/60">
                Start Planning Today
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                Ready to optimize your crop rotation?
              </h2>
              <p className="text-emerald-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Configure your farm profile in under 2 minutes or launch the demonstration dashboard to explore agronomic alternatives for the Indo-Gangetic Plains.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/onboarding"
                className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                <SproutIcon size={18} className="text-forest-700" />
                <span>Start Farmer Onboarding</span>
              </Link>

              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-7 py-3.5 bg-forest-800/80 hover:bg-forest-800 text-white font-semibold text-sm rounded-xl border border-forest-600 transition-colors flex items-center justify-center gap-2"
              >
                <CompassIcon size={18} />
                <span>Launch Advisory Dashboard</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 10. COMPREHENSIVE FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand & Mission */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2 text-white font-extrabold text-base">
                <div className="p-1 rounded-lg bg-forest-600 text-white">
                  <CompassIcon size={18} />
                </div>
                <span>Sproutnik · Rotation Compass</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                Open agricultural decision support developed for the NASA Space Apps Challenge 2026. Empowering farmers in the Indo-Gangetic Plains with verifiable climate satellite observations and regional agronomic research.
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                Location Baseline: Ludhiana District, Punjab (30.90° N, 75.85° E)
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-2">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] block">
                Platform Navigation
              </span>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    Advisory Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/onboarding" className="hover:text-white transition-colors">
                    Farmer Onboarding &amp; Setup
                  </Link>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    Decision Pipeline
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Agronomic Features
                  </a>
                </li>
                <li>
                  <a href="#evidence" className="hover:text-white transition-colors">
                    Data Sources &amp; Transparency
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Scientific Attribution */}
            <div className="space-y-2">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] block">
                Evidence &amp; Methodology
              </span>
              <ul className="space-y-1.5 text-slate-400">
                <li>NASA POWER (MERRA-2 Satellite Reanalysis)</li>
                <li>Punjab Agricultural University (PAU)</li>
                <li>Commission for Agricultural Costs &amp; Prices (CACP)</li>
                <li>Central Ground Water Board (CGWB)</li>
                <li>ICAR-IIFSR Diversification Protocols</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <div>
              © 2026 Sproutnik Contributors · NASA Space Apps Challenge 2026. Open Access Agronomic Tool.
            </div>
            <div>
              Decision support advisory only. Always consult local extension agronomists before seeding.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
