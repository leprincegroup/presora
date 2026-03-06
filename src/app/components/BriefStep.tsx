"use client";

import { useState } from "react";
import { BriefData } from "../types";
import {
  ArrowRight,
  FileUp,
  Loader2,
  X,
  FileText,
  ImagePlus,
} from "lucide-react";

interface BriefStepProps {
  initialData: BriefData;
  onComplete: (data: BriefData) => void;
}

export function BriefStep({ initialData, onComplete }: BriefStepProps) {
  const [data, setData] = useState<BriefData>(initialData);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [images, setImages] = useState<string[]>(initialData.images || []);

  const canContinue = data.topic.trim().length > 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().split(".").pop();
    if (!["pdf", "pptx"].includes(ext || "")) {
      setExtractError("Please upload a PDF or PPTX file.");
      return;
    }

    setIsExtracting(true);
    setExtractError("");
    setUploadedFile(file.name);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/extract-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64, fileName: file.name }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to extract content");
      }

      const { content } = await res.json();

      if (!data.topic.trim()) {
        const firstLine = content.split("\n").find((l: string) => l.trim() && !l.startsWith("---"));
        if (firstLine) {
          setData((prev) => ({
            ...prev,
            topic: firstLine.trim().substring(0, 100),
            description: content,
          }));
        } else {
          setData((prev) => ({ ...prev, description: content }));
        }
      } else {
        setData((prev) => ({ ...prev, description: content }));
      }
    } catch (err) {
      setExtractError(
        err instanceof Error ? err.message : "Failed to extract content"
      );
      setUploadedFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setData((prev) => ({ ...prev, description: "" }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          What&apos;s your presentation about?
        </h1>
        <p className="text-sm text-muted mt-1">
          Describe your topic or upload an existing deck to redesign.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted uppercase tracking-wider">
            Topic / Title
          </label>
          <input
            type="text"
            value={data.topic}
            onChange={(e) => setData({ ...data, topic: e.target.value })}
            placeholder="e.g. Ring x Netflix Boxing Sponsorship"
            className="w-full px-4 py-3 bg-card border border-border rounded-md text-foreground placeholder:text-muted/50 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted uppercase tracking-wider">
              Content Brief
            </label>
            {!uploadedFile && !isExtracting && (
              <label className="flex items-center gap-1.5 text-xs text-foreground hover:text-muted cursor-pointer transition-colors">
                <FileUp className="w-3.5 h-3.5" />
                Upload PPTX or PDF
                <input
                  type="file"
                  accept=".pdf,.pptx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {isExtracting ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8 bg-card border border-border rounded-md">
              <Loader2 className="w-5 h-5 text-foreground animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  Extracting content from {uploadedFile}
                </p>
                <p className="text-xs text-muted mt-1">
                  This may take a moment...
                </p>
              </div>
            </div>
          ) : (
            <>
              {uploadedFile && (
                <div className="flex items-center gap-2 px-3 py-2 bg-accent-light border border-border rounded-md mb-2">
                  <FileText className="w-4 h-4 text-foreground shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">
                    {uploadedFile}
                  </span>
                  <button
                    onClick={handleRemoveFile}
                    className="text-muted hover:text-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <textarea
                value={data.description}
                onChange={(e) =>
                  setData({ ...data, description: e.target.value })
                }
                placeholder="Describe what the presentation should cover. Include key points, data, messaging, or any specific content you want on the slides..."
                rows={6}
                className="w-full px-4 py-3 bg-card border border-border rounded-md text-foreground placeholder:text-muted/50 transition-colors resize-none text-sm"
              />
            </>
          )}

          {extractError && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md">
              {extractError}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted uppercase tracking-wider">
              Target Audience
            </label>
            <input
              type="text"
              value={data.audience}
              onChange={(e) => setData({ ...data, audience: e.target.value })}
              placeholder="e.g. Potential sponsors, investors"
              className="w-full px-4 py-3 bg-card border border-border rounded-md text-foreground placeholder:text-muted/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted uppercase tracking-wider">
              Length
            </label>
            <select
              value={data.length}
              onChange={(e) =>
                setData({ ...data, length: e.target.value as "short" | "medium" | "extensive" })
              }
              className="w-full px-4 py-3 bg-card border border-border rounded-md text-foreground transition-colors appearance-none"
            >
              <option value="short">Short (6-8 slides)</option>
              <option value="medium">Medium (10-12 slides)</option>
              <option value="extensive">Extensive (14-18 slides)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted uppercase tracking-wider">
            Images (optional)
          </label>
          <label className="flex items-center gap-1.5 text-xs text-foreground hover:text-muted cursor-pointer transition-colors">
            <ImagePlus className="w-3.5 h-3.5" />
            Add Images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative w-16 h-16 rounded-md overflow-hidden border border-border group"
              >
                <img
                  src={img}
                  alt={`Upload ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
        {images.length === 0 && (
          <p className="text-xs text-muted">
            Upload photos to include in your slides
          </p>
        )}
      </div>

      <button
        onClick={() => canContinue && onComplete({ ...data, images })}
        disabled={!canContinue || isExtracting}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-foreground hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed text-background font-medium rounded-md transition-colors"
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
