"use client";

import { useEffect, useState, useRef } from "react";
import { BrandAnalysis, BriefData, Presentation, SlideData } from "../types";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface GenerateStepProps {
  brief: BriefData;
  brand: BrandAnalysis;
  onComplete: (presentation: Presentation) => void;
  onBack: () => void;
}

const PROGRESS_MESSAGES = [
  "Analyzing your brief...",
  "Crafting the narrative structure...",
  "Designing slide layouts...",
  "Writing compelling content...",
  "Applying brand styling...",
  "Polishing the final touches...",
  "Almost there...",
];

export function GenerateStep({
  brief,
  brand,
  onComplete,
  onBack,
}: GenerateStepProps) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(PROGRESS_MESSAGES[0]);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + Math.random() * 8, 90);
        const msgIndex = Math.min(
          Math.floor((next / 100) * PROGRESS_MESSAGES.length),
          PROGRESS_MESSAGES.length - 1
        );
        setMessage(PROGRESS_MESSAGES[msgIndex]);
        return next;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const generate = async () => {
    setIsGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/generate-presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, brand }),
      });

      if (!res.ok) {
        let errorMsg = "Failed to generate presentation";
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          errorMsg = `Server error (${res.status}). Please try again.`;
        }
        throw new Error(errorMsg);
      }

      const data: { title: string; slides: SlideData[] } = await res.json();

      // Distribute user-uploaded images across applicable slides
      const userImages = brief.images || [];
      if (userImages.length > 0) {
        const imageSlides = data.slides.filter((s) => s.type === "image");
        const otherImageable = data.slides.filter(
          (s) => s.type === "hero" || s.type === "content" || s.type === "section-break"
        );
        const allTargets = [...imageSlides, ...otherImageable];

        userImages.forEach((img, i) => {
          const target = allTargets[i % allTargets.length];
          if (target) target.imageUrl = img;
        });
      }

      setProgress(100);
      setMessage("Done!");

      const presentation: Presentation = {
        id: crypto.randomUUID(),
        title: data.title,
        createdAt: new Date().toISOString(),
        brief: brief.description || brief.topic,
        brand,
        slides: data.slides,
      };

      setTimeout(() => onComplete(presentation), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsGenerating(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Generation Failed</h2>
            <p className="text-sm text-muted mt-2 max-w-md">{error}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-3 bg-card border border-border hover:bg-card-hover text-foreground font-medium rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => {
              hasStarted.current = false;
              setError("");
              setProgress(0);
              generate();
            }}
            className="flex items-center gap-2 px-5 py-3 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-foreground animate-spin" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Generating your presentation</h2>
          <p className="text-sm text-muted mt-2">{message}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="max-w-sm mx-auto space-y-2">
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-foreground rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-muted">{Math.round(progress)}%</p>
      </div>

      <button
        onClick={onBack}
        className="text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto"
      >
        Cancel
      </button>
    </div>
  );
}
