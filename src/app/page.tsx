"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BrandAnalysis,
  BriefData,
  DEFAULT_BRAND,
  Presentation,
} from "./types";
import { BriefStep } from "./components/BriefStep";
import { BrandStep } from "./components/BrandStep";
import { GenerateStep } from "./components/GenerateStep";
import { PresentationViewer } from "./components/PresentationViewer";

type AppStep = "brief" | "brand" | "generate" | "view";

export default function Home() {
  const [step, setStep] = useState<AppStep>("brief");
  const [brief, setBrief] = useState<BriefData>({
    topic: "",
    description: "",
    audience: "",
    length: "medium",
  });
  const [brand, setBrand] = useState<BrandAnalysis>(DEFAULT_BRAND);
  const [presentation, setPresentation] = useState<Presentation | null>(null);

  const handleBriefComplete = (data: BriefData) => {
    setBrief(data);
    setStep("brand");
  };

  const handleBrandComplete = (brandData: BrandAnalysis) => {
    setBrand(brandData);
    setStep("generate");
  };

  const handleSkipBrand = () => {
    setStep("generate");
  };

  const handlePresentationGenerated = (pres: Presentation) => {
    setPresentation(pres);
    setStep("view");
  };

  const handleBack = () => {
    if (step === "brand") setStep("brief");
    else if (step === "generate") setStep("brand");
  };

  const handleStartOver = () => {
    setStep("brief");
    setBrief({ topic: "", description: "", audience: "", length: "medium", images: [] });
    setBrand(DEFAULT_BRAND);
    setPresentation(null);
  };

  if (step === "view" && presentation) {
    return (
      <PresentationViewer
        presentation={presentation}
        onBack={handleStartOver}
        onUpdatePresentation={setPresentation}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <img
            src="/presora-logo.svg"
            alt="Presora"
            className="h-5"
          />
          <StepIndicator currentStep={step} />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {step === "brief" && (
              <motion.div
                key="brief"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <BriefStep initialData={brief} onComplete={handleBriefComplete} />
              </motion.div>
            )}
            {step === "brand" && (
              <motion.div
                key="brand"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <BrandStep
                  onComplete={handleBrandComplete}
                  onSkip={handleSkipBrand}
                  onBack={handleBack}
                />
              </motion.div>
            )}
            {step === "generate" && (
              <motion.div
                key="generate"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <GenerateStep
                  brief={brief}
                  brand={brand}
                  onComplete={handlePresentationGenerated}
                  onBack={handleBack}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: AppStep }) {
  const steps = [
    { key: "brief", label: "Brief" },
    { key: "brand", label: "Brand" },
    { key: "generate", label: "Generate" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i <= currentIndex ? "bg-foreground" : "bg-border"
              }`}
            />
            <span
              className={`text-xs transition-colors ${
                i <= currentIndex ? "text-foreground" : "text-muted"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-px transition-colors ${
                i < currentIndex ? "bg-foreground" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
