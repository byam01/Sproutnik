/**
 * Sproutnik Onboarding Multi-Language Content Dictionary
 * Supporting English (en), Punjabi (pa), and Hindi (hi)
 */

export type SupportedLocale = "en" | "pa" | "hi";

export interface LocaleStrings {
  brand: {
    name: string;
    tagline: string;
    poweredBy: string;
  };
  navigation: {
    back: string;
    continue: string;
    skip: string;
    notSure: string;
    edit: string;
    step: string;
    of: string;
    switchToConversation: string;
    switchToGuide: string;
    returnToWelcome: string;
  };
  welcome: {
    titlePrefix: string;
    titleAccent: string;
    subtitle: string;
    option1Title: string;
    option1Desc: string;
    option1Badge: string;
    option1Action: string;
    option2Title: string;
    option2Desc: string;
    option2Badge: string;
    option2Action: string;
    reassuranceNote: string;
  };
  step1Location: {
    titlePrefix: string;
    titleAccent: string;
    description: string;
    searchLabel: string;
    searchPlaceholder: string;
    useCurrentLocation: string;
    requestingLocation: string;
    locationDenied: string;
    recentLocationsLabel: string;
    selectedLocationLabel: string;
    adjustPinNote: string;
    confirmLocation: string;
    demoBadge: string;
    environmentalSyncTitle: string;
    environmentalSyncDesc: string;
    gridResolutionNote: string;
    mapControls: {
      zoomIn: string;
      zoomOut: string;
      satellite: string;
      hybrid: string;
      standard: string;
    };
  };
  step2LandArea: {
    title: string;
    description: string;
    inputLabel: string;
    unitAcres: string;
    unitHectares: string;
    unitBighas: string;
    unitKanals: string;
    bighaNote: string;
    conversionPreview: string;
    skipLabel: string;
  };
  step3Soil: {
    title: string;
    description: string;
    notSureOption: string;
    notSureDesc: string;
    ribbonGuideTitle: string;
    ribbonGuideDesc: string;
  };
  step4Irrigation: {
    title: string;
    description: string;
    notSureOption: string;
    notSureDesc: string;
    aquiferNoteTitle: string;
    aquiferNoteDesc: string;
  };
  step5Crops: {
    title: string;
    description: string;
    searchPlaceholder: string;
    selectedCount: string;
    skipLabel: string;
  };
  step6Goals: {
    title: string;
    description: string;
    selectedCount: string;
  };
  step7Review: {
    title: string;
    description: string;
    farmerAnswersTitle: string;
    regionalEstimatesTitle: string;
    primaryCta: string;
  };
  conversational: {
    title: string;
    subtitle: string;
    inputPlaceholder: string;
    sendButton: string;
    activeProfileTitle: string;
    assistantName: string;
    statusActive: string;
  };
}

export const ONBOARDING_CONTENT: Record<SupportedLocale, LocaleStrings> = {
  en: {
    brand: {
      name: "Sproutnik",
      tagline: "Climate-Aware Crop Rotation Planning",
      poweredBy: "NASA POWER Environmental Data",
    },
    navigation: {
      back: "Back",
      continue: "Continue",
      skip: "Skip this question",
      notSure: "I'm not sure",
      edit: "Edit",
      step: "Step",
      of: "of",
      switchToConversation: "Start a conversation",
      switchToGuide: "Use the step-by-step guide",
      returnToWelcome: "Change mode",
    },
    welcome: {
      titlePrefix: "Welcome to",
      titleAccent: "Sproutnik.",
      subtitle:
        "Plan sustainable, high-yield crop rotations tailored to your local soil, water resources, and 10+ years of NASA satellite climate observations.",
      option1Title: "Use the step-by-step guide",
      option1Desc:
        "Answer a few simple questions about your farm, one step at a time.",
      option1Badge: "Visual & Structured",
      option1Action: "Start step-by-step guide →",
      option2Title: "Start a conversation",
      option2Desc:
        "Tell us about your farm naturally, and we'll guide you through the details.",
      option2Badge: "Guided Dialogue",
      option2Action: "Start guided conversation →",
      reassuranceNote:
        "You can skip questions you are unsure about and update your answers at any time. Your farm details are saved safely for this planning session.",
    },
    step1Location: {
      titlePrefix: "Define your",
      titleAccent: "Workspace.",
      description:
        "Select your farm's location so Sproutnik can explore local climate conditions and environmental data for your crop rotation plan.",
      searchLabel: "Search for your farm",
      searchPlaceholder: "Enter a village, district, address or coordinates",
      useCurrentLocation: "Use my current location",
      requestingLocation: "Locating your device...",
      locationDenied:
        "Location permission was not granted. Please select your district from the list below.",
      recentLocationsLabel: "Recent Locations",
      selectedLocationLabel: "Selected Farm Location",
      adjustPinNote: "Click or drag anywhere on the satellite map to adjust your farm pin.",
      confirmLocation: "Confirm Location",
      demoBadge: "Demo Reference",
      environmentalSyncTitle: "Climate data for your location",
      environmentalSyncDesc:
        "NASA POWER satellite observations are retrieved for a 0.5° × 0.5° grid (~50 km) covering your area. Historical rainfall, heatwaves, and seasonal patterns will be evaluated for the last 10–15 years.",
      gridResolutionNote:
        "Note: Satellite climate observations represent regional grid averages rather than sensor-level field readings.",
      mapControls: {
        zoomIn: "Zoom in",
        zoomOut: "Zoom out",
        satellite: "Satellite",
        hybrid: "Hybrid",
        standard: "Map",
      },
    },
    step2LandArea: {
      title: "How much land do you farm?",
      description: "Enter the approximate area of the land you want to plan crops for.",
      inputLabel: "Operational Land Area",
      unitAcres: "Acres (Killa)",
      unitHectares: "Hectares",
      unitBighas: "Kacha Bighas",
      unitKanals: "Kanals",
      bighaNote:
        "Punjab Land Records standard: 1 Acre = 8 Kanals. Traditional Punjab Kacha Bigha equals ~0.208 Acres (1 Acre ≈ 4.8 Bighas).",
      conversionPreview: "Equivalent Holding Size",
      skipLabel: "I'd rather skip land area for now",
    },
    step3Soil: {
      title: "What type of soil do you have?",
      description: "Choose the option that best describes the soil in your fields.",
      notSureOption: "I'm not sure",
      notSureDesc:
        "We'll use a regional central Punjab loam baseline for climate calculations without overwriting your profile.",
      ribbonGuideTitle: "Field Ribbon Test",
      ribbonGuideDesc:
        "Moisten a small ball of soil in your hand. Knead it into a ribbon between your thumb and forefinger: clay forms long ribbons (>5 cm), loam forms medium ribbons (2–5 cm) that crumble easily, and sand feels gritty and falls apart.",
    },
    step4Irrigation: {
      title: "How do you water your fields?",
      description: "Tell us where your irrigation water comes from.",
      notSureOption: "I'm not sure",
      notSureDesc:
        "We'll apply Punjab's regional average tubewell reliance for water stress modeling while preserving your answer as unspecified.",
      aquiferNoteTitle: "Groundwater Context",
      aquiferNoteDesc:
        "Over 85% of central Punjab relies on submersible tubewells below 150 ft. Knowing your water source helps Sproutnik balance high-water crops against power and diesel pumping costs.",
    },
    step5Crops: {
      title: "Which crops are you growing?",
      description: "Select the crops currently grown on your farm.",
      searchPlaceholder: "Search crops by local or common name...",
      selectedCount: "crops selected",
      skipLabel: "Skip crop selection for now",
    },
    step6Goals: {
      title: "What would you like to improve?",
      description: "Choose one or more priorities for your upcoming crop rotation.",
      selectedCount: "goals prioritized",
    },
    step7Review: {
      title: "Review your farm details",
      description:
        "Verify your inputs before generating your climate-aware crop rotation recommendations.",
      farmerAnswersTitle: "Information provided by you",
      regionalEstimatesTitle: "Regional estimates applied for climate modeling",
      primaryCta: "Create my farm workspace →",
    },
    conversational: {
      title: "Sproutnik Assistant",
      subtitle: "Interactive farm onboarding dialogue",
      inputPlaceholder: "Type your answer or ask an agricultural question...",
      sendButton: "Send",
      activeProfileTitle: "Active Profile",
      assistantName: "Sproutnik Assistant",
      statusActive: "Calibrated to NASA POWER Climate Baseline",
    },
  },
  pa: {
    brand: {
      name: "ਸਪ੍ਰਾਊਟਨਿਕ",
      tagline: "ਮੌਸਮ-ਅਨੁਕੂਲ ਫ਼ਸਲੀ ਚੱਕਰ ਯੋਜਨਾਬੰਦੀ",
      poweredBy: "ਨਾਸਾ ਪਾਵਰ ਵਾਤਾਵਰਣ ਡੇਟਾ",
    },
    navigation: {
      back: "ਪਿੱਛੇ",
      continue: "ਅੱਗੇ ਵਧੋ",
      skip: "ਇਹ ਸਵਾਲ ਛੱਡੋ",
      notSure: "ਮੈਨੂੰ ਪੱਕਾ ਪਤਾ ਨਹੀਂ",
      edit: "ਸੋਧੋ",
      step: "ਕਦਮ",
      of: "ਵਿੱਚੋਂ",
      switchToConversation: "ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰੋ",
      switchToGuide: "ਕਦਮ-ਦਰ-ਕਦਮ ਗਾਈਡ ਵਰਤੋ",
      returnToWelcome: "ਤਰੀਕਾ ਬਦਲੋ",
    },
    welcome: {
      titlePrefix: "ਜੀ ਆਇਆਂ ਨੂੰ",
      titleAccent: "ਸਪ੍ਰਾਊਟਨਿਕ ਵਿੱਚ।",
      subtitle:
        "ਆਪਣੀ ਜ਼ਮੀਨ, ਪਾਣੀ ਦੇ ਸਾਧਨਾਂ ਅਤੇ ਨਾਸਾ ਸੈਟੇਲਾਈਟ ਦੇ 10 ਸਾਲਾਂ ਦੇ ਮੌਸਮ ਡੇਟਾ ਅਨੁਸਾਰ ਟਿਕਾਊ ਅਤੇ ਲਾਭਕਾਰੀ ਫ਼ਸਲੀ ਚੱਕਰ ਤਿਆਰ ਕਰੋ।",
      option1Title: "ਕਦਮ-ਦਰ-ਕਦਮ ਗਾਈਡ ਵਰਤੋ",
      option1Desc: "ਆਪਣੇ ਖੇਤ ਬਾਰੇ ਕੁਝ ਸਧਾਰਨ ਸਵਾਲਾਂ ਦੇ ਇੱਕ-ਇੱਕ ਕਰਕੇ ਜਵਾਬ ਦਿਓ।",
      option1Badge: "ਵਿਜ਼ੂਅਲ ਅਤੇ ਵਿਵਸਥਿਤ",
      option1Action: "ਗਾਈਡ ਸ਼ੁਰੂ ਕਰੋ →",
      option2Title: "ਗੱਲਬਾਤ ਰਾਹੀਂ ਸ਼ੁਰੂ ਕਰੋ",
      option2Desc: "ਆਪਣੇ ਖੇਤ ਬਾਰੇ ਆਮ ਗੱਲਬਾਤ ਵਾਂਗ ਦੱਸੋ, ਅਸੀਂ ਤੁਹਾਡੀ ਅਗਵਾਈ ਕਰਾਂਗੇ।",
      option2Badge: "ਸਹਾਇਕ ਗੱਲਬਾਤ",
      option2Action: "ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰੋ →",
      reassuranceNote:
        "ਜੇਕਰ ਕਿਸੇ ਸਵਾਲ ਬਾਰੇ ਪੱਕਾ ਪਤਾ ਨਾ ਹੋਵੇ ਤਾਂ ਤੁਸੀਂ ਉਸਨੂੰ ਛੱਡ ਸਕਦੇ ਹੋ। ਤੁਸੀਂ ਬਾਅਦ ਵਿੱਚ ਵੀ ਜਵਾਬ ਬਦਲ ਸਕਦੇ ਹੋ।",
    },
    step1Location: {
      titlePrefix: "ਆਪਣਾ ਖੇਤਰ",
      titleAccent: "ਚੁਣੋ।",
      description:
        "ਆਪਣੇ ਖੇਤ ਦੀ ਸਥਿਤੀ ਚੁਣੋ ਤਾਂ ਜੋ ਸਪ੍ਰਾਊਟਨਿਕ ਤੁਹਾਡੇ ਫ਼ਸਲੀ ਚੱਕਰ ਲਈ ਨਾਸਾ ਦਾ ਮੌਸਮੀ ਡੇਟਾ ਤਿਆਰ ਕਰ ਸਕੇ।",
      searchLabel: "ਆਪਣੇ ਖੇਤ ਜਾਂ ਪਿੰਡ ਦੀ ਖੋਜ ਕਰੋ",
      searchPlaceholder: "ਪਿੰਡ, ਜ਼ਿਲ੍ਹਾ ਜਾਂ ਪਤਾ ਦਰਜ ਕਰੋ",
      useCurrentLocation: "ਮੇਰੀ ਮੌਜੂਦਾ ਲੋਕੇਸ਼ਨ ਵਰਤੋ",
      requestingLocation: "ਲੋਕੇਸ਼ਨ ਲੱਭੀ ਜਾ ਰਹੀ ਹੈ...",
      locationDenied: "ਲੋਕੇਸ਼ਨ ਆਗਿਆ ਨਹੀਂ ਮਿਲੀ। ਕਿਰਪਾ ਕਰਕੇ ਹੇਠਾਂ ਸੂਚੀ ਵਿੱਚੋਂ ਆਪਣਾ ਜ਼ਿਲ੍ਹਾ ਚੁਣੋ।",
      recentLocationsLabel: "ਮੁੱਖ ਜ਼ਿਲ੍ਹੇ",
      selectedLocationLabel: "ਚੁਣਿਆ ਗਿਆ ਖੇਤ ਖੇਤਰ",
      adjustPinNote: "ਪਿੰਨ ਨੂੰ ਸਹੀ ਜਗ੍ਹਾ ਲਗਾਉਣ ਲਈ ਨਕਸ਼ੇ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
      confirmLocation: "ਸਥਿਤੀ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ",
      demoBadge: "ਡੈਮੋ ਹਵਾਲਾ",
      environmentalSyncTitle: "ਤੁਹਾਡੇ ਖੇਤਰ ਦਾ ਮੌਸਮੀ ਡੇਟਾ",
      environmentalSyncDesc:
        "ਨਾਸਾ ਪਾਵਰ ਸੈਟੇਲਾਈਟ ਡੇਟਾ ਤੁਹਾਡੇ ਖੇਤਰ ਲਈ 0.5° × 0.5° ਗਰਿੱਡ ਅਨੁਸਾਰ ਲਿਆ ਜਾਂਦਾ ਹੈ। ਪਿਛਲੇ 10–15 ਸਾਲਾਂ ਦੇ ਮੀਂਹ ਅਤੇ ਗਰਮੀ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕੀਤਾ ਜਾਵੇਗਾ।",
      gridResolutionNote: "ਨੋਟ: ਇਹ ਡੇਟਾ ਪੂਰੇ ਇਲਾਕੇ ਦਾ ਔਸਤ ਸੈਟੇਲਾਈਟ ਮਾਪ ਹੈ।",
      mapControls: {
        zoomIn: "ਨੇੜੇ ਕਰੋ",
        zoomOut: "ਦੂਰ ਕਰੋ",
        satellite: "ਸੈਟੇਲਾਈਟ",
        hybrid: "ਮਿਸ਼ਰਤ",
        standard: "ਨਕਸ਼ਾ",
      },
    },
    step2LandArea: {
      title: "ਤੁਹਾਡੇ ਕੋਲ ਕਿੰਨੀ ਜ਼ਮੀਨ ਹੈ?",
      description: "ਉਹ ਜ਼ਮੀਨ ਦਰਜ ਕਰੋ ਜਿਸ ਲਈ ਤੁਸੀਂ ਫ਼ਸਲ ਯੋਜਨਾ ਬਣਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ।",
      inputLabel: "ਕੁੱਲ ਰਕਬਾ",
      unitAcres: "ਏਕੜ (ਕਿੱਲਾ)",
      unitHectares: "ਹੈਕਟੇਅਰ",
      unitBighas: "ਕੱਚਾ ਬਿੱਘਾ",
      unitKanals: "ਕਨਾਲ",
      bighaNote: "ਪੰਜਾਬ ਰੈਵੇਨਿਊ ਮਾਪ: 1 ਏਕੜ = 8 ਕਨਾਲ। ਪੰਜਾਬ ਦਾ ਰਵਾਇਤੀ ਕੱਚਾ ਬਿੱਘਾ ਲਗਭਗ 0.208 ਏਕੜ (1 ਏਕੜ ≈ 4.8 ਬਿੱਘੇ) ਹੁੰਦਾ ਹੈ।",
      conversionPreview: "ਕੁੱਲ ਮਾਪ ਹਵਾਲਾ",
      skipLabel: "ਫਿਲਹਾਲ ਇਹ ਸਵਾਲ ਛੱਡੋ",
    },
    step3Soil: {
      title: "ਤੁਹਾਡੇ ਖੇਤ ਦੀ ਮਿੱਟੀ ਕਿਸ ਕਿਸਮ ਦੀ ਹੈ?",
      description: "ਉਹ ਵਿਕਲਪ ਚੁਣੋ ਜੋ ਤੁਹਾਡੀ ਜ਼ਮੀਨ ਦੀ ਮਿੱਟੀ ਨਾਲ ਸਭ ਤੋਂ ਵੱਧ ਮੇਲ ਖਾਂਦਾ ਹੈ।",
      notSureOption: "ਮੈਨੂੰ ਪੱਕਾ ਪਤਾ ਨਹੀਂ",
      notSureDesc: "ਅਸੀਂ ਖੇਤਰੀ ਔਸਤ ਦੋਮਟ ਮਿੱਟੀ ਦੇ ਆਧਾਰ 'ਤੇ ਗਣਨਾ ਕਰਾਂਗੇ।",
      ribbonGuideTitle: "ਮਿੱਟੀ ਪਰਖ ਤਰੀਕਾ",
      ribbonGuideDesc: "ਗਿੱਲੀ ਮਿੱਟੀ ਦੀ ਗੋਲੀ ਬਣਾ ਕੇ ਵੇਖੋ: ਜੇ ਲੰਬੀ ਵੱਟੀ ਬਣੇ ਤਾਂ ਚੀਕਣੀ ਮਿੱਟੀ; ਜੇ ਆਸਾਨੀ ਨਾਲ ਟੁੱਟੇ ਤਾਂ ਦੋਮਟ; ਜੇ ਰੇਤਲੀ ਹੋਵੇ ਤਾਂ ਭੁਰ ਜਾਂਦੀ ਹੈ।",
    },
    step4Irrigation: {
      title: "ਤੁਸੀਂ ਆਪਣੇ ਖੇਤਾਂ ਨੂੰ ਪਾਣੀ ਕਿਵੇਂ ਦਿੰਦੇ ਹੋ?",
      description: "ਦੱਸੋ ਕਿ ਸਿੰਚਾਈ ਦਾ ਮੁੱਖ ਸਾਧਨ ਕੀ ਹੈ।",
      notSureOption: "ਮੈਨੂੰ ਪੱਕਾ ਪਤਾ ਨਹੀਂ",
      notSureDesc: "ਅਸੀਂ ਪੰਜਾਬ ਦੀ ਖੇਤਰੀ ਔਸਤ ਟਿਊਬਵੈੱਲ ਵਰਤੋਂ ਮੰਨ ਕੇ ਹਿਸਾਬ ਲਗਾਵਾਂਗੇ।",
      aquiferNoteTitle: "ਧਰਤੀ ਹੇਠਲਾ ਪਾਣੀ",
      aquiferNoteDesc: "ਪੰਜਾਬ ਵਿੱਚ 85% ਤੋਂ ਵੱਧ ਸਿੰਚਾਈ ਡੂੰਘੇ ਸਬਮਰਸੀਬਲ ਟਿਊਬਵੈੱਲਾਂ ਰਾਹੀਂ ਹੁੰਦੀ ਹੈ। ਪਾਣੀ ਦੀ ਬੱਚਤ ਬਿਜਲੀ ਅਤੇ ਡੀਜ਼ਲ ਦਾ ਖਰਚਾ ਘਟਾਉਂਦੀ ਹੈ।",
    },
    step5Crops: {
      title: "ਤੁਸੀਂ ਕਿਹੜੀਆਂ ਫ਼ਸਲਾਂ ਬੀਜਦੇ ਹੋ?",
      description: "ਉਹ ਫ਼ਸਲਾਂ ਚੁਣੋ ਜੋ ਤੁਹਾਡੇ ਖੇਤ ਵਿੱਚ ਬੀਜੀਆਂ ਜਾਂਦੀਆਂ ਹਨ।",
      searchPlaceholder: "ਫ਼ਸਲ ਦਾ ਨਾਮ ਖੋਜੋ...",
      selectedCount: "ਫ਼ਸਲਾਂ ਚੁਣੀਆਂ",
      skipLabel: "ਫ਼ਸਲਾਂ ਦੀ ਚੋਣ ਫਿਲਹਾਲ ਛੱਡੋ",
    },
    step6Goals: {
      title: "ਤੁਸੀਂ ਕੀ ਸੁਧਾਰ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
      description: "ਆਪਣੇ ਆਉਣ ਵਾਲੇ ਫ਼ਸਲੀ ਚੱਕਰ ਲਈ ਮੁੱਖ ਤਰਜੀਹਾਂ ਚੁਣੋ।",
      selectedCount: "ਟੀਚੇ ਚੁਣੇ",
    },
    step7Review: {
      title: "ਆਪਣੇ ਖੇਤ ਦੇ ਵੇਰਵਿਆਂ ਦੀ ਜਾਂਚ ਕਰੋ",
      description: "ਫ਼ਸਲੀ ਚੱਕਰ ਯੋਜਨਾ ਤਿਆਰ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਆਪਣੇ ਦਿੱਤੇ ਜਵਾਬਾਂ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ।",
      farmerAnswersTitle: "ਤੁਹਾਡੇ ਵੱਲੋਂ ਦਿੱਤੀ ਜਾਣਕਾਰੀ",
      regionalEstimatesTitle: "ਮਾਡਲ ਵੱਲੋਂ ਲਗਾਏ ਗਏ ਖੇਤਰੀ ਅੰਦਾਜ਼ੇ",
      primaryCta: "ਮੇਰਾ ਫ਼ਾਰਮ ਵਰਕਸਪੇਸ ਬਣਾਓ →",
    },
    conversational: {
      title: "ਸਪ੍ਰਾਊਟਨਿਕ ਸਹਾਇਕ",
      subtitle: "ਖੇਤੀਬਾੜੀ ਗੱਲਬਾਤ ਰਾਹੀਂ ਜਾਣਕਾਰੀ",
      inputPlaceholder: "ਆਪਣਾ ਜਵਾਬ ਲਿਖੋ ਜਾਂ ਖੇਤੀ ਬਾਰੇ ਸਵਾਲ ਪੁੱਛੋ...",
      sendButton: "ਭੇਜੋ",
      activeProfileTitle: "ਖੇਤ ਪ੍ਰੋਫਾਈਲ",
      assistantName: "ਸਪ੍ਰਾਊਟਨਿਕ ਸਹਾਇਕ",
      statusActive: "ਨਾਸਾ ਮੌਸਮੀ ਡੇਟਾ ਨਾਲ ਜੋੜਿਆ ਗਿਆ",
    },
  },
  hi: {
    brand: {
      name: "स्प्रॉउटनिक",
      tagline: "जलवायु-अनुकूल फसल चक्र योजना",
      poweredBy: "नासा पावर पर्यावरण डेटा",
    },
    navigation: {
      back: "पीछे",
      continue: "आगे बढ़ें",
      skip: "यह प्रश्न छोड़ें",
      notSure: "मुझे पक्का पता नहीं",
      edit: "बदलें",
      step: "चरण",
      of: "का",
      switchToConversation: "बातचीत शुरू करें",
      switchToGuide: "चरण-दर-चरण गाइड का उपयोग करें",
      returnToWelcome: "तरीका बदलें",
    },
    welcome: {
      titlePrefix: "स्वागत है",
      titleAccent: "स्प्रॉउटनिक में।",
      subtitle:
        "अपनी मिट्टी, पानी की उपलब्धता और नासा उपग्रह के 10 वर्षों के मौसम डेटा के आधार पर टिकाऊ और लाभकारी फसल चक्र योजना तैयार करें।",
      option1Title: "चरण-दर-चरण गाइड का उपयोग करें",
      option1Desc: "अपने खेत के बारे में कुछ सरल प्रश्नों के एक-एक करके उत्तर दें।",
      option1Badge: "स्पष्ट और व्यवस्थित",
      option1Action: "गाइड शुरू करें →",
      option2Title: "बातचीत के माध्यम से शुरू करें",
      option2Desc: "अपने खेत के बारे में सहज रूप से बताएं, हम आपकी मदद करेंगे।",
      option2Badge: "सहायक संवाद",
      option2Action: "बातचीत शुरू करें →",
      reassuranceNote:
        "यदि किसी प्रश्न का उत्तर स्पष्ट न हो तो आप उसे छोड़ सकते हैं। आप बाद में भी उत्तर अपडेट कर सकते हैं।",
    },
    step1Location: {
      titlePrefix: "अपना कार्यक्षेत्र",
      titleAccent: "निर्धारित करें।",
      description:
        "अपने खेत का स्थान चुनें ताकि स्प्रॉउटनिक आपकी फसल चक्र योजना के लिए स्थानीय जलवायु परिस्थितियों का अध्ययन कर सके।",
      searchLabel: "अपने खेत या गाँव की खोज करें",
      searchPlaceholder: "गाँव, ज़िला या पता दर्ज करें",
      useCurrentLocation: "मेरी वर्तमान लोकेशन का उपयोग करें",
      requestingLocation: "स्थान खोजा जा रहा है...",
      locationDenied: "स्थान की अनुमति नहीं मिली। कृपया नीचे दी गई सूची से अपना ज़िला चुनें।",
      recentLocationsLabel: "प्रमुख ज़िले",
      selectedLocationLabel: "चुना गया खेत क्षेत्र",
      adjustPinNote: "पिन समायोजित करने के लिए उपग्रह मानचित्र पर कहीं भी क्लिक करें।",
      confirmLocation: "स्थान की पुष्टि करें",
      demoBadge: "डेमो संदर्भ",
      environmentalSyncTitle: "आपके क्षेत्र का जलवायु डेटा",
      environmentalSyncDesc:
        "नासा पावर उपग्रह डेटा आपके क्षेत्र के लिए 0.5° × 0.5° ग्रिड के आधार पर लिया जाता है। पिछले 10–15 वर्षों की वर्षा और तापमान का विश्लेषण किया जाएगा।",
      gridResolutionNote: "नोट: उपग्रह जलवायु अवलोकन क्षेत्रीय ग्रिड औसत का प्रतिनिधित्व करते हैं।",
      mapControls: {
        zoomIn: "ज़ूम इन",
        zoomOut: "ज़ूम आउट",
        satellite: "सैटेलाइट",
        hybrid: "हाइब्रिड",
        standard: "मानचित्र",
      },
    },
    step2LandArea: {
      title: "आपके पास कितनी कृषि भूमि है?",
      description: "उस भूमि का अनुमानित क्षेत्रफल दर्ज करें जिसके लिए आप फसल की योजना बनाना चाहते हैं।",
      inputLabel: "कुल कृषि क्षेत्र",
      unitAcres: "एकड़ (किल्ला)",
      unitHectares: "हेक्टेयर",
      unitBighas: "कच्चा बीघा",
      unitKanals: "कनाल",
      bighaNote: "पंजाब राजस्व मानक: 1 एकड़ = 8 कनाल। पंजाब का पारंपरिक कच्चा बीघा लगभग 0.208 एकड़ (1 एकड़ ≈ 4.8 बीघे) होता है।",
      conversionPreview: "समतुल्य क्षेत्रफल संदर्भ",
      skipLabel: "फ़िलहाल यह प्रश्न छोड़ें",
    },
    step3Soil: {
      title: "आपके खेत की मिट्टी किस प्रकार की है?",
      description: "वह विकल्प चुनें जो आपके खेत की मिट्टी का सबसे अच्छा वर्णन करता है।",
      notSureOption: "मुझे पक्का पता नहीं",
      notSureDesc: "हम जलवायु गणना के लिए क्षेत्रीय औसत दोमट मिट्टी का उपयोग करेंगे।",
      ribbonGuideTitle: "खेत में मिट्टी परीक्षण विधि",
      ribbonGuideDesc: "गीली मिट्टी को अंगूठे और उंगली के बीच दबाकर रिबन बनाएं: यदि लंबा रिबन बने तो चिकनी मिट्टी; यदि आसानी से टूटे तो दोमट; यदि खुरदुरी हो तो रेतीली।",
    },
    step4Irrigation: {
      title: "आप अपने खेतों की सिंचाई कैसे करते हैं?",
      description: "बताएं कि आपके खेत में सिंचाई का मुख्य स्रोत क्या है।",
      notSureOption: "मुझे पक्का पता नहीं",
      notSureDesc: "हम गणना के लिए पंजाब के क्षेत्रीय औसत ट्यूबवेल उपयोग का अनुमान लगाएंगे।",
      aquiferNoteTitle: "भूजल संदर्भ",
      aquiferNoteDesc: "पंजाब में 85% से अधिक सिंचाई 150 फीट से गहरे ट्यूबवेलों पर निर्भर है। पानी की बचत बिजली और डीज़ल के खर्च को कम करती है।",
    },
    step5Crops: {
      title: "आप कौन सी फसलें उगा रहे हैं?",
      description: "वे फसलें चुनें जो वर्तमान में आपके खेत में उगाई जाती हैं।",
      searchPlaceholder: "फसल का नाम खोजें...",
      selectedCount: "फसलें चुनी गईं",
      skipLabel: "फसल चयन फ़िलहाल छोड़ें",
    },
    step6Goals: {
      title: "आप क्या सुधार करना चाहते हैं?",
      description: "अपने आगामी फसल चक्र के लिए एक या अधिक प्राथमिकताएं चुनें।",
      selectedCount: "प्राथमिकताएं चुनी गईं",
    },
    step7Review: {
      title: "अपने खेत के विवरण की समीक्षा करें",
      description: "फसल चक्र योजना बनाने से पहले अपने विवरण की पुष्टि करें।",
      farmerAnswersTitle: "आपके द्वारा प्रदान की गई जानकारी",
      regionalEstimatesTitle: "मॉडल द्वारा लागू किए गए क्षेत्रीय अनुमान",
      primaryCta: "मेरा फ़ार्म वर्कस्पेस बनाएं →",
    },
    conversational: {
      title: "स्प्रॉउटनिक सहायक",
      subtitle: "संवाद आधारित कृषि मार्गदर्शन",
      inputPlaceholder: "अपना उत्तर लिखें या कोई प्रश्न पूछें...",
      sendButton: "भेजें",
      activeProfileTitle: "खेत प्रोफ़ाइल",
      assistantName: "स्प्रॉउटनिक सहायक",
      statusActive: "नासा पावर जलवायु डेटा से जुड़ा हुआ",
    },
  },
};
