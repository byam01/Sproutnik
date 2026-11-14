"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  OnboardingState,
  FarmingGoal,
  LUDHIANA_DEMO_LOCATION,
  FieldStatus,
  PUNJAB_CROP_CATALOG,
} from "@/types/onboarding";
import { SoilTextureType, IrrigationSourceType, Location } from "@/types";
import {
  CompassIcon,
  SproutIcon,
  CheckCircleIcon,
  InfoIcon,
  LayersIcon,
  ChevronRightIcon,
  ArrowRightIcon,
} from "../icons";

interface ChatMessage {
  id: string;
  sender: "assistant" | "farmer";
  text: string;
  contextNote?: string;
  options?: {
    label: string;
    action: () => void;
    isPrimary?: boolean;
    isSkip?: boolean;
  }[];
  timestamp: string;
}

interface OnboardingConversationalProps {
  state: OnboardingState;
  onChange: React.Dispatch<React.SetStateAction<OnboardingState>>;
  onSwitchToFieldGuide: () => void;
  onComplete: () => void;
  onExit: () => void;
}

export function OnboardingConversational({
  state,
  onChange,
  onSwitchToFieldGuide,
  onComplete,
  onExit,
}: OnboardingConversationalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [convoStep, setConvoStep] = useState(0); // 0: Location, 1: Land, 2: Soil, 3: Irrigation, 4: Crops, 5: Goals, 6: Complete
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial welcome message from Sproutnik Assistant
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-msg",
          sender: "assistant",
          text: "Hello / Sat Sri Akal! I am the Sproutnik assistant. I will guide you through setting up your farm details to connect 10+ years of NASA satellite climate data with your crop rotation plan. Let's start with your farm location.",
          contextNote:
            "Ludhiana is our initial demonstration district representing Punjab's intensive Rice–Wheat belt (30.90° N, 75.85° E). You can explore this prototype dataset or choose another district.",
          options: [
            {
              label: "✓ Use Ludhiana Prototype Dataset (Demo Reference)",
              isPrimary: true,
              action: () =>
                handleLocationChoice(
                  LUDHIANA_DEMO_LOCATION,
                  "known",
                  true,
                  "Using Ludhiana Prototype Dataset (Demo Reference)"
                ),
            },
            {
              label: "My farm is in Bathinda District (South-West Belt)",
              action: () =>
                handleLocationChoice(
                  {
                    name: "Bathinda District",
                    district: "Bathinda",
                    state: "Punjab",
                    country: "India",
                    latitude: 30.21,
                    longitude: 74.95,
                    elevationMeters: 211,
                  },
                  "known",
                  false,
                  "My farm is located in Bathinda District, Punjab"
                ),
            },
            {
              label: "Skip location for now (Use regional baseline)",
              isSkip: true,
              action: () =>
                handleLocationChoice(
                  null,
                  "skipped",
                  false,
                  "Skip location for now"
                ),
            },
          ],
          timestamp: "Just now",
        },
      ]);
    }
  }, []);

  const addFarmerMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `farmer-${Date.now()}`,
        sender: "farmer",
        text,
        timestamp: "Just now",
      },
    ]);
  };

  // STEP 1: Location confirmed -> ask Land Area
  const handleLocationChoice = (
    loc: Location | null,
    status: FieldStatus,
    isDemo: boolean,
    displayText: string
  ) => {
    addFarmerMessage(displayText);
    onChange((prev) => ({
      ...prev,
      location: loc,
      locationStatus: status,
      isDemonstrationLocation: isDemo,
    }));
    setConvoStep(1);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `step-land-${Date.now()}`,
          sender: "assistant",
          text: loc
            ? `Location recorded: ${loc.district}${isDemo ? " (Demo Reference)" : ""}. Approximately how many acres of land do you cultivate for crop planning?`
            : "Understood, location skipped for now. We will use a separate regional estimate for climate calculations. Approximately how many acres of land do you cultivate?",
          contextNote:
            "Holding size helps Sproutnik estimate total groundwater pumping demand and evaluate potential diversification blocks.",
          options: [
            {
              label: "2.5 Acres (Smallholding)",
              action: () => handleLandSelect(2.5),
            },
            {
              label: "5 Acres (Punjab Operational Average)",
              isPrimary: true,
              action: () => handleLandSelect(5),
            },
            {
              label: "10 Acres (Medium Holding)",
              action: () => handleLandSelect(10),
            },
            {
              label: "25+ Acres (Commercial Holding)",
              action: () => handleLandSelect(25),
            },
            {
              label: "Skip land area for now",
              isSkip: true,
              action: () => handleLandSkip(),
            },
          ],
          timestamp: "Just now",
        },
      ]);
    }, 350);
  };

  // STEP 2: Land Area -> ask Soil Type
  const handleLandSelect = (acres: number) => {
    addFarmerMessage(`${acres} Acres`);
    onChange((prev) => ({ ...prev, landArea: acres, landAreaStatus: "known" }));
    askSoilStep();
  };

  const handleLandSkip = () => {
    addFarmerMessage("Skip land area for now");
    onChange((prev) => ({ ...prev, landArea: null, landAreaStatus: "skipped" }));
    askSoilStep();
  };

  const askSoilStep = () => {
    setConvoStep(2);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `step-soil-${Date.now()}`,
          sender: "assistant",
          text: "What type of soil best describes your fields? You don't need a lab test; just describe how it behaves when moist in your hands.",
          contextNote:
            "Heavy clay soils puddle well for paddy but crust easily; balanced loam drains smoothly and suits wheat and pulses.",
          options: [
            {
              label: "Balanced Loam (Holds shape, crumbles easily)",
              isPrimary: true,
              action: () => handleSoilChoice("loam", "known", "Balanced Loam"),
            },
            {
              label: "Clay Loam (Heavy, sticky ribbon >5cm)",
              action: () => handleSoilChoice("clay_loam", "known", "Heavy Clay Loam"),
            },
            {
              label: "Sandy Loam (Feels gritty, fast drainage)",
              action: () => handleSoilChoice("sandy_loam", "known", "Light Sandy Loam"),
            },
            {
              label: "I'm not sure (Untested soil)",
              action: () =>
                handleSoilChoice(null, "unknown", "I'm not sure about my soil type"),
            },
            {
              label: "Skip soil question for now",
              isSkip: true,
              action: () => handleSoilChoice(null, "skipped", "Skip soil question for now"),
            },
          ],
          timestamp: "Just now",
        },
      ]);
    }, 350);
  };

  // STEP 3: Soil -> ask Irrigation
  const handleSoilChoice = (
    soil: SoilTextureType | null,
    status: FieldStatus,
    label: string
  ) => {
    addFarmerMessage(label);
    onChange((prev) => ({
      ...prev,
      soilTexture: soil,
      soilStatus: status,
    }));
    setConvoStep(3);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `step-irr-${Date.now()}`,
          sender: "assistant",
          text: "How do you water your fields? Tell us where your irrigation water comes from.",
          contextNote:
            "Deep tubewells (>150 ft) consume heavy power and accelerate aquifer decline; canal water follows fixed rotational schedules.",
          options: [
            {
              label: "Deep tubewell (>150 ft submersible)",
              isPrimary: true,
              action: () =>
                handleIrrigationChoice("tubewell_deep", "known", "Deep tubewell (>150 ft)"),
            },
            {
              label: "Shallow tubewell (<150 ft centrifugal)",
              action: () =>
                handleIrrigationChoice("tubewell_shallow", "known", "Shallow tubewell"),
            },
            {
              label: "Canal water network",
              action: () =>
                handleIrrigationChoice("canal", "known", "Canal water network"),
            },
            {
              label: "More than one water source (Canal + Tubewell)",
              action: () =>
                handleIrrigationChoice(
                  "conjunctive",
                  "known",
                  "More than one water source (Conjunctive)"
                ),
            },
            {
              label: "I'm not sure",
              action: () =>
                handleIrrigationChoice(
                  null,
                  "unknown",
                  "I'm not sure about irrigation details"
                ),
            },
          ],
          timestamp: "Just now",
        },
      ]);
    }, 350);
  };

  // STEP 4: Irrigation -> ask Current Crops
  const handleIrrigationChoice = (
    irr: IrrigationSourceType | null,
    status: FieldStatus,
    label: string
  ) => {
    addFarmerMessage(label);
    onChange((prev) => ({
      ...prev,
      irrigationSource: irr,
      irrigationStatus: status,
    }));
    setConvoStep(4);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `step-crops-${Date.now()}`,
          sender: "assistant",
          text: "Which crops are currently grown on your farm? In Punjab, most farmers follow the Rice–Wheat cycle. Are you also cultivating pulses or maize?",
          contextNote:
            "Knowing your existing rotation helps evaluate turnaround windows and residue management.",
          options: [
            {
              label: "Rice (Paddy) + Wheat",
              isPrimary: true,
              action: () =>
                handleCropSelect(["Rice (Paddy)", "Wheat"], "Rice–Wheat Monoculture"),
            },
            {
              label: "Rice + Wheat + Summer Moong (Triple Crop)",
              action: () =>
                handleCropSelect(
                  ["Rice (Paddy)", "Wheat", "Summer Moong (Green Gram)"],
                  "Rice + Wheat + Summer Moong"
                ),
            },
            {
              label: "Maize (Corn) + Wheat",
              action: () => handleCropSelect(["Maize (Corn)", "Wheat"], "Maize + Wheat Rotation"),
            },
            {
              label: "Basmati DSR + Mustard / Raya",
              action: () =>
                handleCropSelect(
                  ["Basmati Rice (DSR / Traditional)", "Mustard / Raya"],
                  "Basmati DSR + Mustard"
                ),
            },
            {
              label: "Skip crop selection for now",
              isSkip: true,
              action: () => handleCropSelect([], "Skip crop selection for now"),
            },
          ],
          timestamp: "Just now",
        },
      ]);
    }, 350);
  };

  // STEP 5: Crops -> ask Priorities/Goals
  const handleCropSelect = (crops: string[], label: string) => {
    addFarmerMessage(label);
    onChange((prev) => ({
      ...prev,
      currentCrops: crops,
      cropsStatus: crops.length > 0 ? "known" : "skipped",
    }));
    setConvoStep(5);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `step-goals-${Date.now()}`,
          sender: "assistant",
          text: "What would you like to improve in your upcoming crop rotation?",
          contextNote:
            "Sproutnik's climate model balances water savings against income stability and turnaround timing.",
          options: [
            {
              label: "💧 Save water (cut pumping hours & power bills)",
              isPrimary: true,
              action: () =>
                handleGoalSelect(
                  ["water_saving", "soil_health"],
                  "Save water and improve soil health"
                ),
            },
            {
              label: "🌱 Improve soil health & fix natural nitrogen",
              action: () =>
                handleGoalSelect(
                  ["soil_health", "water_saving"],
                  "Improve soil health and nitrogen balance"
                ),
            },
            {
              label: "🛡️ Build climate resilience against March heatwaves",
              action: () =>
                handleGoalSelect(
                  ["climate_resilience", "water_saving"],
                  "Protect wheat against early heatwaves"
                ),
            },
            {
              label: "⏱️ Reduce farm workload & widen turnaround window",
              action: () =>
                handleGoalSelect(
                  ["less_labor", "soil_health"],
                  "Wider turnaround windows for clean residue management"
                ),
            },
            {
              label: "🔄 Explore better crop rotations (diversification)",
              action: () =>
                handleGoalSelect(
                  ["crop_rotation_diversity", "water_saving"],
                  "Explore alternative profitable rotations"
                ),
            },
          ],
          timestamp: "Just now",
        },
      ]);
    }, 350);
  };

  // STEP 6: Priorities -> Review and Finish
  const handleGoalSelect = (goals: FarmingGoal[], label: string) => {
    addFarmerMessage(label);
    onChange((prev) => ({ ...prev, farmingGoals: goals, goalsStatus: "known" }));
    setConvoStep(6);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `step-finish-${Date.now()}`,
          sender: "assistant",
          text: "Your farm details have been successfully recorded and calibrated against 10 years of NASA POWER climate observations. Ready to create your farm workspace?",
          contextNote:
            "Your inputs are safely stored. You can update any answer or switch to the field guide at any time.",
          options: [
            {
              label: "Create my farm workspace →",
              isPrimary: true,
              action: onComplete,
            },
          ],
          timestamp: "Just now",
        },
      ]);
    }, 350);
  };

  const handleCustomSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText("");
    addFarmerMessage(text);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-reply-${Date.now()}`,
          sender: "assistant",
          text: `Got it: "${text}". I have recorded this in your profile. You can continue with the options below or proceed to create your workspace.`,
          options: [
            {
              label: "Continue with recorded answers →",
              isPrimary: true,
              action: onComplete,
            },
          ],
          timestamp: "Just now",
        },
      ]);
    }, 300);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-forest-900 text-white flex items-center justify-center">
            <CompassIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-stone-900 leading-tight">
                Sproutnik Assistant
              </h2>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                Calibrated to NASA POWER Climate Baseline
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Interactive conversation for farm onboarding
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={onSwitchToFieldGuide}
            className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Switch to visual step-by-step field guide"
          >
            <LayersIcon size={14} />
            <span>Switch to field guide</span>
          </button>

          <button
            type="button"
            onClick={onExit}
            className="text-xs text-stone-500 hover:text-stone-800 px-2 py-1"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Main Grid: Chat Stream (Left 7 cols) & Workspace Context / Active Profile (Right 5 cols) matching AIAssistant.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Chat Stream */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs flex flex-col min-h-[520px] max-h-[680px]">
          {/* Scrollable Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            {messages.map((msg) => {
              const isAssistant = msg.sender === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    isAssistant ? "justify-start" : "justify-end"
                  }`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-full bg-forest-800 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-xs">
                      SP
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 space-y-2.5 text-xs sm:text-sm leading-relaxed ${
                      isAssistant
                        ? "bg-[#faf9f5] text-stone-900 border border-stone-200/90 rounded-tl-sm"
                        : "bg-forest-800 text-white rounded-tr-sm font-medium"
                    }`}
                  >
                    <p>{msg.text}</p>

                    {msg.contextNote && (
                      <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-600 flex items-start gap-2 shadow-2xs">
                        <InfoIcon size={14} className="text-forest-700 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-relaxed">{msg.contextNote}</span>
                      </div>
                    )}

                    {/* Interactive Suggestion / Reply Chips */}
                    {msg.options && msg.options.length > 0 && (
                      <div className="pt-2 flex flex-col gap-1.5">
                        {msg.options.map((opt, optIdx) => (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={opt.action}
                            className={`py-2 px-3.5 rounded-xl text-left text-xs font-semibold transition-all border ${
                              opt.isPrimary
                                ? "bg-forest-800 hover:bg-forest-900 text-white border-forest-800 shadow-2xs"
                                : opt.isSkip
                                ? "bg-white hover:bg-stone-50 text-stone-500 border-stone-200"
                                : "bg-white hover:bg-stone-50 text-stone-800 border-stone-200"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-full bg-stone-300 text-stone-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      You
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Prompt Bar matching AIAssistant.png */}
          <form
            onSubmit={handleCustomSend}
            className="pt-4 border-t border-stone-200 mt-4 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask the Sproutnik assistant or type your response..."
              className="flex-1 py-2.5 px-4 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-700 focus:bg-white text-stone-900 placeholder:text-stone-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2.5 bg-forest-800 hover:bg-forest-900 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
            >
              Send
            </button>
          </form>
        </div>

        {/* WORKSPACE CONTEXT / Active Profile (Right 5 cols matching AIAssistant.png) */}
        <div className="lg:col-span-5 bg-[#faf9f5] border border-stone-200 rounded-2xl p-5 space-y-4 sticky top-20">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block">
                Workspace Context
              </span>
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mt-0.5">
                <CheckCircleIcon size={14} className="text-forest-700" />
                Active Profile
              </span>
            </div>
            <span className="text-[10px] font-mono bg-forest-50 text-forest-800 px-2 py-0.5 rounded font-bold border border-forest-200">
              Synchronized
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Location */}
            <div className="p-3 bg-white rounded-xl border border-stone-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-stone-400 block">Farm Location:</span>
                <span className="font-bold text-stone-900">
                  {state.location ? state.location.district : "Not specified"}
                </span>
                {state.isDemonstrationLocation && (
                  <span className="text-[9px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-mono block mt-0.5">
                    Demo Reference Dataset
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${
                  state.locationStatus === "known"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : state.locationStatus === "unknown"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : state.locationStatus === "skipped"
                    ? "bg-stone-100 text-stone-600 border-stone-200"
                    : "bg-stone-50 text-stone-400 border-stone-200"
                }`}
              >
                {state.locationStatus}
              </span>
            </div>

            {/* Land Area */}
            <div className="p-3 bg-white rounded-xl border border-stone-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-stone-400 block">Land Area:</span>
                <span className="font-bold text-stone-900 font-mono">
                  {state.landArea !== null
                    ? `${state.landArea} ${state.landUnit}`
                    : state.landAreaStatus === "skipped"
                    ? "Skipped by farmer"
                    : "Not specified"}
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${
                  state.landAreaStatus === "known"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : state.landAreaStatus === "unknown"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : state.landAreaStatus === "skipped"
                    ? "bg-stone-100 text-stone-600 border-stone-200"
                    : "bg-stone-50 text-stone-400 border-stone-200"
                }`}
              >
                {state.landAreaStatus}
              </span>
            </div>

            {/* Soil Type */}
            <div className="p-3 bg-white rounded-xl border border-stone-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-stone-400 block">Soil Type:</span>
                <span className="font-bold text-stone-900 capitalize">
                  {state.soilTexture
                    ? state.soilTexture.replace("_", " ")
                    : state.soilStatus === "unknown"
                    ? "I'm not sure (Untested)"
                    : state.soilStatus === "skipped"
                    ? "Skipped by farmer"
                    : "Not specified"}
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${
                  state.soilStatus === "known"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : state.soilStatus === "unknown"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : state.soilStatus === "skipped"
                    ? "bg-stone-100 text-stone-600 border-stone-200"
                    : "bg-stone-50 text-stone-400 border-stone-200"
                }`}
              >
                {state.soilStatus}
              </span>
            </div>

            {/* Irrigation */}
            <div className="p-3 bg-white rounded-xl border border-stone-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-stone-400 block">Irrigation Source:</span>
                <span className="font-bold text-stone-900 capitalize">
                  {state.irrigationSource
                    ? state.irrigationSource.replace("_", " ")
                    : state.irrigationStatus === "unknown"
                    ? "I'm not sure"
                    : state.irrigationStatus === "skipped"
                    ? "Skipped by farmer"
                    : "Not specified"}
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${
                  state.irrigationStatus === "known"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : state.irrigationStatus === "unknown"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : state.irrigationStatus === "skipped"
                    ? "bg-stone-100 text-stone-600 border-stone-200"
                    : "bg-stone-50 text-stone-400 border-stone-200"
                }`}
              >
                {state.irrigationStatus}
              </span>
            </div>

            {/* Current Crops */}
            <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
              <span className="text-[10px] text-stone-400 block">Current Crops:</span>
              <span className="font-semibold text-stone-900 block">
                {state.currentCrops.length > 0
                  ? state.currentCrops.join(", ")
                  : "None recorded"}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-stone-500 leading-relaxed border-t border-stone-200 pt-3">
            Changes made in this conversation are preserved automatically if you switch to the field guide or return to the climate dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
