"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Presentation, SlideData } from "../types";
import { Slide } from "./Slide";
import { ExportButton } from "./ExportButton";
import {
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Pencil,
  X,
  Send,
  Loader2,
  RefreshCw,
  MessageSquare,
} from "lucide-react";

interface PresentationViewerProps {
  presentation: Presentation;
  onBack: () => void;
  onUpdatePresentation: (presentation: Presentation) => void;
}

export function PresentationViewer({
  presentation,
  onBack,
  onUpdatePresentation,
}: PresentationViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [showRegenPanel, setShowRegenPanel] = useState(false);
  const [regenFeedback, setRegenFeedback] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const feedbackInputRef = useRef<HTMLTextAreaElement>(null);
  const total = presentation.slides.length;

  // Inject custom @font-face if custom font is provided
  useEffect(() => {
    const { customFontName, customFontUrl } = presentation.brand;
    if (!customFontName || !customFontUrl) return;

    const styleId = "custom-brand-font";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `@font-face { font-family: "${customFontName}"; src: url("${customFontUrl}"); font-display: swap; }`;
    document.head.appendChild(style);
    return () => {
      document.getElementById(styleId)?.remove();
    };
  }, [presentation.brand]);

  const scrollToSlide = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, total - 1));
      const container = containerRef.current;
      if (container) {
        const slideEl = container.children[clamped] as HTMLElement;
        slideEl?.scrollIntoView({ behavior: "smooth" });
      }
    },
    [total]
  );

  // Keyboard navigation (disabled when editing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingSlide !== null || showRegenPanel) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        scrollToSlide(currentSlide + 1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToSlide(currentSlide - 1);
      } else if (e.key === "Escape") {
        setEditMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, scrollToSlide, editingSlide, showRegenPanel]);

  // Track current slide via Intersection Observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Array.from(container.children).indexOf(
              entry.target as HTMLElement
            );
            if (index >= 0) setCurrentSlide(index);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );

    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);

  // Auto-hide controls (paused in edit mode)
  useEffect(() => {
    if (editMode) {
      setShowControls(true);
      return;
    }
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(
        () => setShowControls(false),
        3000
      );
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [editMode]);

  // Focus feedback input when editing a slide
  useEffect(() => {
    if (editingSlide !== null) {
      setTimeout(() => feedbackInputRef.current?.focus(), 100);
    }
  }, [editingSlide]);

  const handleEditSlide = async () => {
    if (!feedback.trim() || editingSlide === null) return;
    setIsEditing(true);
    setEditError("");

    try {
      const res = await fetch("/api/edit-slide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slide: presentation.slides[editingSlide],
          slideIndex: editingSlide,
          totalSlides: total,
          feedback: feedback.trim(),
          presentationTitle: presentation.title,
          brand: {
            primaryColor: presentation.brand.primaryColor,
            secondaryColor: presentation.brand.secondaryColor,
            accentColor: presentation.brand.accentColor,
            backgroundColor: presentation.brand.backgroundColor,
            textColor: presentation.brand.textColor,
            fontStyle: presentation.brand.fontStyle,
            tone: presentation.brand.tone,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to edit slide");
      }

      const updatedSlide: SlideData = await res.json();

      // Preserve imageUrl from original slide if it had one
      if (presentation.slides[editingSlide].imageUrl && !updatedSlide.imageUrl) {
        updatedSlide.imageUrl = presentation.slides[editingSlide].imageUrl;
      }

      const newSlides = [...presentation.slides];
      newSlides[editingSlide] = updatedSlide;
      onUpdatePresentation({ ...presentation, slides: newSlides });

      setEditingSlide(null);
      setFeedback("");
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsEditing(false);
    }
  };

  const handleRegenerateDeck = async () => {
    if (!regenFeedback.trim()) return;
    setIsRegenerating(true);

    try {
      const res = await fetch("/api/generate-presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: {
            topic: presentation.title,
            description: `PREVIOUS PRESENTATION (regenerate with improvements):\n\n${presentation.slides
              .map(
                (s, i) =>
                  `Slide ${i + 1} (${s.type}): ${s.title || ""} ${s.body || ""} ${s.bullets?.join(", ") || ""}`
              )
              .join("\n")}\n\nUSER FEEDBACK: ${regenFeedback.trim()}`,
            audience: "",
            length:
              total <= 8
                ? "short"
                : total <= 12
                ? "medium"
                : ("extensive" as const),
          },
          brand: presentation.brand,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to regenerate");
      }

      const data = await res.json();
      onUpdatePresentation({
        ...presentation,
        title: data.title,
        slides: data.slides,
      });

      setShowRegenPanel(false);
      setRegenFeedback("");
      setCurrentSlide(0);
      scrollToSlide(0);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Regeneration failed");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Slides container */}
      <div ref={containerRef} className="slides-container">
        {presentation.slides.map((slide, i) => (
          <div key={i} className="relative">
            <Slide
              slide={slide}
              brand={presentation.brand}
              index={i}
              total={total}
            />
            {/* Edit overlay per slide */}
            {editMode && (
              <button
                onClick={() => {
                  setEditingSlide(i);
                  setFeedback("");
                  setEditError("");
                }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 bg-white text-zinc-900 text-sm font-medium rounded-md shadow-lg hover:bg-zinc-100 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Give feedback on this slide
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Controls overlay */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/50 to-transparent">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            New Presentation
          </button>
          <h3 className="text-sm font-medium text-white/70 tracking-tight">
            {presentation.title}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditMode(!editMode);
                setEditingSlide(null);
                setShowRegenPanel(false);
              }}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-md backdrop-blur-sm transition-colors ${
                editMode
                  ? "bg-white text-zinc-900"
                  : "bg-white/10 text-white/70 hover:text-white"
              }`}
            >
              {editMode ? (
                <>
                  <X className="w-4 h-4" />
                  Exit Edit
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4" />
                  Edit
                </>
              )}
            </button>
            <ExportButton presentation={presentation} />
          </div>
        </div>
      </div>

      {/* Edit mode: Regenerate deck button */}
      {editMode && (
        <div
          className={`fixed bottom-6 right-6 z-50 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <button
            onClick={() => setShowRegenPanel(!showRegenPanel)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-zinc-900 text-sm font-medium rounded-md shadow-lg hover:bg-zinc-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate Deck
          </button>
        </div>
      )}

      {/* Per-slide feedback panel */}
      {editingSlide !== null && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pb-12 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-lg bg-white rounded-lg shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
              <span className="text-sm font-medium text-zinc-900">
                Slide {editingSlide + 1}: {presentation.slides[editingSlide]?.title || "Untitled"}
              </span>
              <button
                onClick={() => {
                  setEditingSlide(null);
                  setFeedback("");
                  setEditError("");
                }}
                className="p-1 rounded hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <textarea
                ref={feedbackInputRef}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleEditSlide();
                  }
                }}
                placeholder="Describe what you want to change... (e.g. 'Make the title shorter', 'Add more bullet points', 'Change to a stats slide')"
                rows={3}
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              {editError && (
                <p className="text-xs text-red-600">{editError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditingSlide(null);
                    setFeedback("");
                  }}
                  className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSlide}
                  disabled={!feedback.trim() || isEditing}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {isEditing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Apply
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate deck panel */}
      {showRegenPanel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
              <span className="text-sm font-medium text-zinc-900">
                Regenerate Entire Deck
              </span>
              <button
                onClick={() => setShowRegenPanel(false)}
                className="p-1 rounded hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-zinc-500">
                Describe what&apos;s wrong with the current deck and how you&apos;d like it improved. The entire presentation will be regenerated.
              </p>
              <textarea
                value={regenFeedback}
                onChange={(e) => setRegenFeedback(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleRegenerateDeck();
                  }
                }}
                placeholder="e.g. 'The tone is too formal, make it more casual', 'Add more data-driven slides', 'The flow doesn't make sense, restructure it'"
                rows={4}
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRegenPanel(false)}
                  className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegenerateDeck}
                  disabled={!regenFeedback.trim() || isRegenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      Regenerate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation dots (right side) */}
      <div
        className={`fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {presentation.slides.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToSlide(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentSlide
                ? "bg-white scale-125"
                : "bg-white/30 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Arrow navigation (bottom) */}
      {!editMode && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <button
            onClick={() => scrollToSlide(currentSlide - 1)}
            disabled={currentSlide === 0}
            className="p-2 rounded-md bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 disabled:opacity-30 transition-all"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <span className="text-xs text-white/50 font-mono px-2">
            {currentSlide + 1} / {total}
          </span>
          <button
            onClick={() => scrollToSlide(currentSlide + 1)}
            disabled={currentSlide === total - 1}
            className="p-2 rounded-md bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 disabled:opacity-30 transition-all"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
