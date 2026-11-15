"use client";

import React, { useState } from "react";
import {
  CompassIcon,
  BarChartIcon,
  SproutIcon,
  DatabaseIcon,
  MenuIcon,
  XIcon,
  MapPinIcon,
  ActivityIcon,
} from "./icons";

interface SidebarProps {
  isMock: boolean;
  onToggleMock: () => void;
  activeSection?: string;
  onSelectSection?: (sectionId: string) => void;
}

export function Sidebar({
  isMock,
  onToggleMock,
  activeSection = "crop-rotations",
  onSelectSection,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      id: "crop-rotations",
      label: "Crop Rotations & Advisory",
      description: "Feasibility, water savings & trade-offs",
      icon: SproutIcon,
    },
    {
      id: "climate-insights",
      label: "Climate Risk & Trends",
      description: "Rainfall, thermal stress & monsoon",
      icon: BarChartIcon,
    },
    {
      id: "data-sources",
      label: "Evidence & Methodology",
      description: "PAU trials & NASA POWER audit",
      icon: DatabaseIcon,
    },
  ];

  const handleNavClick = (id: string) => {
    if (onSelectSection) {
      onSelectSection(id);
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-40">
        <a href="/" className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-forest-600 text-white">
            <CompassIcon size={20} />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base leading-none">
              Sproutnik
            </span>
            <span className="block text-[10px] text-slate-500 font-medium">
              Rotation Compass · NASA 2026
            </span>
          </div>
        </a>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Content (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="p-5 space-y-6">
          {/* Logo / Wordmark */}
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="p-2 rounded-xl bg-forest-700 text-white shadow-sm group-hover:bg-forest-800 transition-colors">
                <CompassIcon size={22} />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-lg tracking-tight block">
                  Sproutnik
                </span>
                <span className="text-[11px] text-forest-700 font-semibold tracking-wide uppercase">
                  Rotation Compass
                </span>
              </div>
            </a>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <XIcon size={18} />
            </button>
          </div>

          {/* Region Identification Card */}
          <div className="p-3.5 bg-forest-50/70 border border-forest-100 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-forest-800">
              <MapPinIcon size={13} className="text-forest-600" />
              Demonstration Region
            </div>
            <div className="text-xs font-medium text-slate-900">
              Ludhiana District, Punjab, India
            </div>
            <div className="font-mono text-[11px] text-slate-500">
              30.90° N, 75.85° E
            </div>
            <div className="text-[10px] text-forest-700 pt-1 border-t border-forest-100/80">
              Cropping System: Rice–Wheat Baseline
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
              Dashboard Navigation
            </span>

            {/* Home / Landing Page Link */}
            <a
              href="/"
              className="w-full text-left px-3 py-2 rounded-xl transition-all flex items-center gap-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 mb-1"
            >
              <div className="p-1.5 rounded-lg text-slate-500">
                <CompassIcon size={16} />
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold">Home &amp; Overview</div>
                <div className="text-[10px] text-slate-400">Return to landing page</div>
              </div>
            </a>

            <a
              href="/onboarding"
              className="w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 group bg-forest-50/70 hover:bg-forest-100 text-forest-900 border border-forest-200/80 mb-2"
            >
              <div className="p-1.5 rounded-lg bg-forest-600 text-white">
                <SproutIcon size={16} />
              </div>
              <div className="leading-tight">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  Farm Profile &amp; Setup
                  <span className="text-[9px] bg-forest-200 text-forest-900 px-1.5 py-0.2 rounded font-mono font-semibold">
                    PROFILE
                  </span>
                </div>
                <div className="text-[10px] text-forest-700">
                  Configure district, soil &amp; irrigation
                </div>
              </div>
            </a>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 group ${isActive
                    ? "bg-forest-50 text-forest-900 font-semibold border border-forest-200/80"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${isActive
                      ? "bg-forest-600 text-white"
                      : "text-slate-500 group-hover:text-forest-700"
                      }`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="leading-tight">
                    <div className="text-xs">{item.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Data source toggle */}
        <div className="p-5 border-t border-slate-100 space-y-4 bg-slate-50/50">
          {/* Mode Switch Card */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Data Feed</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${isMock
                  ? "bg-amber-100 text-amber-800"
                  : "bg-forest-100 text-forest-800"
                  }`}
              >
                {isMock ? "Demo Mock" : "NASA Live"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {isMock
                ? "Using calibrated 10-year Ludhiana mock baseline for rapid testing."
                : "Connected to live NASA POWER API endpoint."}
            </p>
            <button
              type="button"
              onClick={onToggleMock}
              className="w-full py-1.5 px-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
            >
              Switch to {isMock ? "Live NASA POWER" : "Calibrated Mock"}
            </button>
          </div>

          <div className="text-[11px] text-slate-400 text-center leading-relaxed">
            NASA Space Apps Challenge 2026
            <span className="block text-[10px] text-slate-400">
              Open Agro-Climatic Intelligence
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

