export interface BrandAnalysis {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontStyle: "sans-serif" | "serif" | "mono" | "display";
  tone: string;
  logoDescription?: string;
  logoUrl?: string;
  customFontName?: string;
  customFontUrl?: string;
  // Extended design system (extracted via Vision)
  textMutedColor?: string;
  headingFont?: string;
  bodyFont?: string;
  headingWeight?: number;
  headingTracking?: string;
  fontCharacter?: string;
  borderRadius?: string;
  spacing?: "tight" | "airy" | "generous";
  layout?: "centered" | "left-aligned" | "asymmetric";
  mood?: string[];
  avoids?: string[];
}

export interface SlideData {
  type:
    | "hero"
    | "section-break"
    | "content"
    | "stats"
    | "features"
    | "comparison"
    | "quote"
    | "cta"
    | "timeline"
    | "image"
    | "table"
    | "big-statement";
  title?: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  stats?: { value: string; label: string; description?: string }[];
  features?: { title: string; description: string; color?: string }[];
  columns?: { title: string; items: string[] }[];
  quote?: { text: string; attribution: string };
  timelineItems?: { label: string; description: string }[];
  tableData?: { headers: string[]; rows: string[][] };
  accentWords?: string[];
  backgroundVariant?: "primary" | "dark" | "gradient" | "light" | "accent";
  imageUrl?: string;
}

export interface Presentation {
  id: string;
  title: string;
  createdAt: string;
  brief: string;
  brand: BrandAnalysis;
  slides: SlideData[];
}

export interface BriefData {
  topic: string;
  description: string;
  audience: string;
  length: "short" | "medium" | "extensive";
  images?: string[];
}

export const DEFAULT_BRAND: BrandAnalysis = {
  primaryColor: "#0a0a0a",
  secondaryColor: "#1a1a1a",
  accentColor: "#c8a97e",
  backgroundColor: "#0a0a0a",
  textColor: "#fbfbf9",
  fontStyle: "sans-serif",
  tone: "professional",
};
