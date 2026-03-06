"use client";

import { useState, useRef } from "react";
import { BrandAnalysis } from "../types";
import {
  ArrowRight,
  ArrowLeft,
  Globe,
  FileUp,
  Loader2,
  Palette,
  SkipForward,
  Upload,
  X,
  Image as ImageIcon,
  Type,
} from "lucide-react";

interface BrandStepProps {
  onComplete: (brand: BrandAnalysis) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function BrandStep({ onComplete, onSkip, onBack }: BrandStepProps) {
  const [mode, setMode] = useState<"url" | "file" | null>(null);
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileBase64, setFileBase64] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<BrandAnalysis | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setFileBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError("");

    try {
      const body: Record<string, string> = {};
      if (mode === "url") body.url = url;
      else if (mode === "file") {
        body.file = fileBase64;
        body.fileName = fileName;
      }

      const res = await fetch("/api/analyze-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to analyze brand");
      }

      const brand: BrandAnalysis = await res.json();
      setPreview(brand);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updatePreviewColor = (key: keyof BrandAnalysis, value: string) => {
    if (!preview) return;
    setPreview({ ...preview, [key]: value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !preview) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreview({ ...preview, logoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !preview) return;

    const fontName = file.name.replace(/\.(ttf|otf|woff2?|eot)$/i, "");
    const reader = new FileReader();
    reader.onload = () => {
      setPreview({
        ...preview,
        customFontName: fontName,
        customFontUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const canAnalyze =
    (mode === "url" && url.trim().length > 0) ||
    (mode === "file" && fileBase64.length > 0);

  if (preview) {
    const colorFields: { key: keyof BrandAnalysis; label: string }[] = [
      { key: "primaryColor", label: "Primary" },
      { key: "secondaryColor", label: "Secondary" },
      { key: "accentColor", label: "Accent" },
      { key: "backgroundColor", label: "Background" },
      { key: "textColor", label: "Text" },
      ...(preview.textMutedColor ? [{ key: "textMutedColor" as keyof BrandAnalysis, label: "Muted" }] : []),
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Brand Analysis
          </h1>
          <p className="text-sm text-muted mt-1">
            Customize colors, logo, and font for your brand.
          </p>
        </div>

        <div className="bg-card border border-border rounded-md p-6 space-y-5">
          {/* Editable Colors */}
          <div className="space-y-3">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">
              Colors
            </span>
            <div className="flex flex-wrap gap-3">
              {colorFields.map((c) => (
                <label
                  key={c.key}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group"
                >
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-md border border-border group-hover:border-foreground/30 transition-colors"
                      style={{
                        backgroundColor: preview[c.key] as string,
                      }}
                    />
                    <input
                      type="color"
                      value={(preview[c.key] as string) || "#000000"}
                      onChange={(e) =>
                        updatePreviewColor(c.key, e.target.value)
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="w-5 h-5 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <Palette className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted">{c.label}</span>
                  <span className="text-[10px] text-muted/60 font-mono">
                    {preview[c.key] as string}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Font Style + Custom Font */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">
              Font
            </span>
            <div className="flex items-center gap-3">
              <select
                value={preview.fontStyle}
                onChange={(e) =>
                  setPreview({
                    ...preview,
                    fontStyle: e.target.value as BrandAnalysis["fontStyle"],
                  })
                }
                className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground"
              >
                <option value="sans-serif">Sans-Serif</option>
                <option value="serif">Serif</option>
                <option value="mono">Monospace</option>
                <option value="display">Display</option>
              </select>

              <button
                onClick={() => fontInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 bg-background border border-border hover:border-foreground/30 rounded-md text-sm transition-colors"
              >
                <Type className="w-4 h-4 text-muted" />
                {preview.customFontName || "Upload Font"}
              </button>
              <input
                ref={fontInputRef}
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleFontUpload}
                className="hidden"
              />
              {preview.customFontName && (
                <button
                  onClick={() =>
                    setPreview({
                      ...preview,
                      customFontName: undefined,
                      customFontUrl: undefined,
                    })
                  }
                  className="p-1.5 rounded-md hover:bg-accent-light transition-colors"
                >
                  <X className="w-4 h-4 text-muted" />
                </button>
              )}
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">
              Logo
            </span>
            {preview.logoUrl ? (
              <div className="flex items-center gap-3">
                <div className="h-12 px-4 bg-background border border-border rounded-md flex items-center">
                  <img
                    src={preview.logoUrl}
                    alt="Logo"
                    className="h-8 max-w-[120px] object-contain"
                  />
                </div>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 bg-background border border-border hover:border-foreground/30 rounded-md text-sm transition-colors"
                >
                  <Upload className="w-4 h-4 text-muted" />
                  Replace
                </button>
                <button
                  onClick={() =>
                    setPreview({ ...preview, logoUrl: undefined })
                  }
                  className="p-1.5 rounded-md hover:bg-accent-light transition-colors"
                >
                  <X className="w-4 h-4 text-muted" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => logoInputRef.current?.click()}
                className="flex items-center gap-3 px-4 py-3 w-full bg-background border border-dashed border-border hover:border-foreground/30 rounded-md transition-colors"
              >
                <ImageIcon className="w-5 h-5 text-muted" />
                <span className="text-sm text-muted">
                  Upload logo (PNG, SVG, JPG)
                </span>
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.webp"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>

          {/* Tone */}
          <div className="pt-2">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">
              Tone
            </span>
            <p className="text-sm mt-1 capitalize">{preview.tone}</p>
          </div>

          {/* Typography Details (if extracted) */}
          {(preview.headingFont || preview.bodyFont || preview.headingWeight) && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">
                Typography
              </span>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {preview.headingFont && (
                  <div className="px-3 py-2 bg-background rounded-md border border-border">
                    <span className="text-[10px] text-muted block">Heading</span>
                    <span className="font-medium">{preview.headingFont}</span>
                    {preview.headingWeight && (
                      <span className="text-muted ml-1">w{preview.headingWeight}</span>
                    )}
                  </div>
                )}
                {preview.bodyFont && (
                  <div className="px-3 py-2 bg-background rounded-md border border-border">
                    <span className="text-[10px] text-muted block">Body</span>
                    <span className="font-medium">{preview.bodyFont}</span>
                  </div>
                )}
                {preview.headingTracking && (
                  <div className="px-3 py-2 bg-background rounded-md border border-border">
                    <span className="text-[10px] text-muted block">Tracking</span>
                    <span className="font-mono text-xs">{preview.headingTracking}</span>
                  </div>
                )}
                {preview.fontCharacter && (
                  <div className="px-3 py-2 bg-background rounded-md border border-border">
                    <span className="text-[10px] text-muted block">Character</span>
                    <span className="capitalize">{preview.fontCharacter}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Style Details (if extracted) */}
          {(preview.mood || preview.avoids || preview.spacing || preview.layout) && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">
                Style
              </span>
              <div className="space-y-2 text-sm">
                <div className="flex flex-wrap gap-2">
                  {preview.spacing && (
                    <span className="px-2.5 py-1 bg-background rounded-md border border-border text-xs capitalize">
                      {preview.spacing} spacing
                    </span>
                  )}
                  {preview.layout && (
                    <span className="px-2.5 py-1 bg-background rounded-md border border-border text-xs capitalize">
                      {preview.layout}
                    </span>
                  )}
                  {preview.borderRadius && (
                    <span className="px-2.5 py-1 bg-background rounded-md border border-border text-xs font-mono">
                      r: {preview.borderRadius}
                    </span>
                  )}
                </div>
                {preview.mood && preview.mood.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {preview.mood.map((m, i) => (
                      <span key={i} className="px-2.5 py-1 bg-foreground/5 rounded-full text-xs capitalize">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
                {preview.avoids && preview.avoids.length > 0 && (
                  <div>
                    <span className="text-[10px] text-muted block mb-1">Avoids</span>
                    <div className="flex flex-wrap gap-1.5">
                      {preview.avoids.map((a, i) => (
                        <span key={i} className="px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setPreview(null)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-card border border-border hover:bg-card-hover text-foreground font-medium rounded-md transition-colors"
          >
            Re-analyze
          </button>
          <button
            onClick={() => onComplete(preview)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-md transition-colors"
          >
            Use This Brand
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Add your brand
        </h1>
        <p className="text-sm text-muted mt-1">
          We&apos;ll extract colors, fonts, and tone to match your brand.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMode("url")}
          className={`flex flex-col items-center gap-3 p-6 rounded-md border transition-colors ${
            mode === "url"
              ? "border-foreground bg-accent-light"
              : "border-border bg-card hover:bg-card-hover"
          }`}
        >
          <Globe
            className={`w-6 h-6 ${
              mode === "url" ? "text-foreground" : "text-muted"
            }`}
          />
          <div className="text-center">
            <p className="text-sm font-medium">Website URL</p>
            <p className="text-xs text-muted mt-0.5">Paste a website link</p>
          </div>
        </button>

        <button
          onClick={() => setMode("file")}
          className={`flex flex-col items-center gap-3 p-6 rounded-md border transition-colors ${
            mode === "file"
              ? "border-foreground bg-accent-light"
              : "border-border bg-card hover:bg-card-hover"
          }`}
        >
          <FileUp
            className={`w-6 h-6 ${
              mode === "file" ? "text-foreground" : "text-muted"
            }`}
          />
          <div className="text-center">
            <p className="text-sm font-medium">Upload File</p>
            <p className="text-xs text-muted mt-0.5">PDF or image</p>
          </div>
        </button>
      </div>

      {mode === "url" && (
        <div className="space-y-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 bg-card border border-border rounded-md text-foreground placeholder:text-muted/50 transition-colors"
            autoFocus
          />
        </div>
      )}

      {mode === "file" && (
        <div className="space-y-2">
          <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-foreground/30 transition-colors">
            <FileUp className="w-8 h-8 text-muted" />
            {fileName ? (
              <span className="text-sm">{fileName}</span>
            ) : (
              <span className="text-sm text-muted">
                Click to upload PDF or image
              </span>
            )}
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 px-4 py-3.5 bg-card border border-border hover:bg-card-hover text-foreground font-medium rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || isAnalyzing}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-foreground hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed text-background font-medium rounded-md transition-colors"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze Brand
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <button
        onClick={onSkip}
        className="w-full flex items-center justify-center gap-2 text-sm text-muted hover:text-foreground transition-colors py-2"
      >
        <SkipForward className="w-3.5 h-3.5" />
        Skip — use default styling
      </button>
    </div>
  );
}
