"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { BrandAnalysis, SlideData } from "../types";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconMap = Record<string, React.ComponentType<any>>;

interface SlideProps {
  slide: SlideData;
  brand: BrandAnalysis;
  index: number;
  total: number;
}

// --- Animation ---
const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: EASE },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.6, delay: i * 0.1, ease: EASE },
  }),
};

const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: EASE },
  }),
};

// --- Color utilities ---
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 10, g: 10, b: 10 };
}

function hexToHsl(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToHex(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.max(0, Math.min(1, color))).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function mixColors(c1: string, c2: string, ratio: number) {
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  return `rgb(${Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio)}, ${Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio)}, ${Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio)})`;
}

function getLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
}

// --- Icon System ---
function toPascalCase(str: string): string {
  return str.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}

function getIcon(name?: string, props?: LucideProps): React.ReactNode {
  if (!name) return null;
  const pascal = toPascalCase(name);
  const Icon = (LucideIcons as unknown as IconMap)[pascal];
  if (!Icon) return null;
  return <Icon {...(props || {})} />;
}

// Fallback: derive icon from text content
// Keyword → Lucide icon name mapping (no duplicate keys)
const KEYWORD_ICON_PAIRS: [string, string][] = [
  // Money
  ["money", "DollarSign"], ["revenue", "DollarSign"], ["price", "DollarSign"], ["cost", "DollarSign"], ["budget", "DollarSign"], ["invest", "DollarSign"], ["fund", "DollarSign"], ["$", "DollarSign"],
  // Growth
  ["growth", "TrendingUp"], ["increase", "TrendingUp"], ["roi", "TrendingUp"], ["return", "TrendingUp"], ["profit", "TrendingUp"], ["trending", "TrendingUp"],
  // Users
  ["user", "Users"], ["audience", "Users"], ["viewer", "Users"], ["customer", "Users"], ["people", "Users"], ["subscriber", "Users"], ["member", "Users"], ["community", "Users"],
  // Analytics
  ["chart", "BarChart3"], ["data", "BarChart3"], ["analytics", "BarChart3"], ["metric", "BarChart3"], ["report", "BarChart3"],
  // Target
  ["target", "Target"], ["goal", "Target"], ["objective", "Target"], ["focus", "Target"],
  // Time
  ["time", "Clock"], ["schedule", "Clock"], ["hour", "Clock"], ["deadline", "Clock"], ["duration", "Clock"],
  ["calendar", "Calendar"], ["date", "Calendar"], ["event", "Calendar"], ["plan", "Calendar"],
  // Global
  ["global", "Globe"], ["world", "Globe"], ["international", "Globe"], ["worldwide", "Globe"],
  // Location
  ["location", "MapPin"], ["venue", "MapPin"], ["place", "MapPin"], ["address", "MapPin"], ["site", "MapPin"],
  // Communication
  ["email", "Mail"], ["message", "Mail"], ["contact", "Mail"], ["inbox", "Mail"],
  ["phone", "Phone"], ["call", "Phone"],
  // Media
  ["video", "Play"], ["stream", "Play"], ["broadcast", "Play"], ["live", "Play"],
  ["camera", "Camera"], ["photo", "Camera"], ["image", "Camera"],
  ["film", "Film"], ["movie", "Film"], ["cinema", "Film"], ["production", "Film"],
  ["tv", "Tv"], ["television", "Tv"], ["screen", "Tv"], ["display", "Tv"], ["monitor", "Tv"],
  // Social
  ["social", "Share2"], ["share", "Share2"], ["viral", "Share2"], ["network", "Share2"],
  ["heart", "Heart"], ["like", "Heart"], ["love", "Heart"], ["engage", "Heart"],
  // Awards
  ["star", "Star"], ["rating", "Star"], ["review", "Star"], ["quality", "Star"],
  ["award", "Award"], ["winner", "Award"], ["achievement", "Award"], ["recognition", "Award"],
  ["trophy", "Trophy"], ["champion", "Trophy"], ["#1", "Trophy"],
  // Security
  ["shield", "ShieldCheck"], ["security", "ShieldCheck"], ["trust", "ShieldCheck"], ["safe", "ShieldCheck"], ["protect", "ShieldCheck"],
  ["check", "CheckCircle"], ["complete", "CheckCircle"], ["done", "CheckCircle"], ["success", "CheckCircle"], ["verify", "CheckCircle"],
  // Energy
  ["zap", "Zap"], ["energy", "Zap"], ["power", "Zap"], ["fast", "Zap"], ["speed", "Zap"], ["lightning", "Zap"], ["electric", "Zap"],
  // Intelligence
  ["brain", "Brain"], ["ai", "Brain"], ["smart", "Brain"], ["intelligent", "Brain"],
  ["lightbulb", "Lightbulb"], ["idea", "Lightbulb"], ["innovation", "Lightbulb"], ["creative", "Lightbulb"],
  ["rocket", "Rocket"], ["launch", "Rocket"], ["startup", "Rocket"], ["boost", "Rocket"],
  // Business
  ["building", "Building"], ["office", "Building"], ["company", "Building"], ["corporate", "Building"], ["business", "Building"],
  ["lock", "Lock"], ["private", "Lock"], ["secure", "Lock"], ["encrypt", "Lock"],
  ["key", "Key"], ["access", "Key"], ["unlock", "Key"],
  // Tech
  ["search", "Search"], ["find", "Search"], ["discover", "Search"], ["explore", "Search"],
  ["settings", "Settings"], ["config", "Settings"], ["customize", "Settings"],
  ["tool", "Wrench"], ["build", "Wrench"],
  ["code", "Code"], ["program", "Code"], ["software", "Code"], ["develop", "Code"],
  ["cloud", "Cloud"], ["hosting", "Cloud"], ["server", "Cloud"], ["saas", "Cloud"],
  ["link", "Link"], ["connect", "Link"], ["integrate", "Link"], ["api", "Link"],
  ["wifi", "Wifi"], ["internet", "Wifi"], ["online", "Wifi"],
  ["cpu", "Cpu"], ["tech", "Cpu"], ["hardware", "Cpu"],
  ["smartphone", "Smartphone"], ["app", "Smartphone"], ["mobile", "Smartphone"],
  // Audio
  ["headphones", "Headphones"], ["audio", "Headphones"], ["music", "Headphones"], ["sound", "Headphones"], ["podcast", "Headphones"],
  ["mic", "Mic"], ["voice", "Mic"], ["speak", "Mic"], ["record", "Mic"],
  // Design
  ["palette", "Palette"], ["design", "Palette"], ["color", "Palette"], ["brand", "Palette"],
  ["pen", "PenTool"], ["write", "PenTool"], ["edit", "PenTool"], ["content", "PenTool"],
  ["layers", "Layers"], ["stack", "Layers"], ["platform", "Layers"],
  ["sparkle", "Sparkles"], ["magic", "Sparkles"], ["feature", "Sparkles"], ["premium", "Sparkles"],
  // Commerce
  ["gift", "Gift"], ["bonus", "Gift"], ["reward", "Gift"], ["perk", "Gift"],
  ["tag", "Tag"], ["label", "Tag"], ["category", "Tag"], ["offer", "Tag"],
  ["cart", "ShoppingCart"], ["shop", "ShoppingCart"], ["buy", "ShoppingCart"], ["purchase", "ShoppingCart"],
  ["package", "Package"], ["deliver", "Package"], ["ship", "Package"], ["product", "Package"],
  ["credit", "CreditCard"], ["payment", "CreditCard"], ["pay", "CreditCard"],
  ["percent", "Percent"], ["discount", "Percent"], ["%", "Percent"],
  // Charts
  ["pie", "PieChart"], ["breakdown", "PieChart"], ["distribution", "PieChart"], ["segment", "PieChart"],
  // Navigation
  ["flag", "Flag"], ["milestone", "Flag"],
  ["compass", "Compass"], ["direction", "Compass"], ["navigate", "Compass"], ["guide", "Compass"],
  ["map", "Map"], ["route", "Map"], ["journey", "Map"], ["path", "Map"],
  ["plane", "Plane"], ["travel", "Plane"], ["fly", "Plane"],
  // Property
  ["home", "Home"], ["house", "Home"], ["property", "Home"],
  // Food
  ["utensils", "Utensils"], ["food", "Utensils"], ["restaurant", "Utensils"], ["dining", "Utensils"],
  ["coffee", "Coffee"], ["cafe", "Coffee"], ["drink", "Coffee"],
  ["wine", "Wine"], ["bar", "Wine"], ["celebration", "Wine"],
  // Sports
  ["dumbbell", "Dumbbell"], ["fitness", "Dumbbell"], ["gym", "Dumbbell"], ["exercise", "Dumbbell"], ["workout", "Dumbbell"],
  ["boxing", "Swords"], ["fight", "Swords"], ["combat", "Swords"], ["mma", "Swords"],
  ["medal", "Medal"], ["sport", "Medal"], ["athlete", "Medal"], ["compete", "Medal"],
  ["activity", "Activity"], ["health", "Activity"], ["pulse", "Activity"],
  // Education
  ["book", "BookOpen"], ["education", "BookOpen"], ["learn", "BookOpen"], ["study", "BookOpen"],
  ["graduation", "GraduationCap"], ["degree", "GraduationCap"], ["university", "GraduationCap"],
  // Marketing
  ["megaphone", "Megaphone"], ["announce", "Megaphone"], ["promote", "Megaphone"], ["marketing", "Megaphone"], ["advertis", "Megaphone"],
  ["eye", "Eye"], ["impression", "Eye"], ["visibility", "Eye"],
  // Premium
  ["crown", "Crown"], ["king", "Crown"], ["queen", "Crown"], ["royal", "Crown"], ["title", "Crown"],
  ["diamond", "Diamond"], ["luxury", "Diamond"], ["exclusive", "Diamond"], ["vip", "Diamond"],
  ["flame", "Flame"], ["hot", "Flame"], ["fire", "Flame"],
  // Nature
  ["sun", "Sun"], ["bright", "Sun"],
  ["moon", "Moon"], ["night", "Moon"],
  ["mountain", "Mountain"], ["peak", "Mountain"], ["summit", "Mountain"],
  ["wave", "Waves"], ["ocean", "Waves"], ["water", "Waves"],
  ["tree", "TreePine"], ["nature", "TreePine"], ["eco", "TreePine"], ["sustain", "TreePine"],
  ["leaf", "Leaf"], ["organic", "Leaf"], ["natural", "Leaf"], ["environment", "Leaf"],
  // Partnership
  ["handshake", "Handshake"], ["partner", "Handshake"], ["agreement", "Handshake"], ["sponsor", "Handshake"], ["collaborat", "Handshake"],
  // Misc contextual
  ["ring", "CircleDot"], ["canvas", "Frame"], ["coverage", "LayoutGrid"],
  ["commercial", "Tv"], ["hospitality", "Wine"], ["activation", "Zap"],
  ["behind", "Film"], ["highlight", "Film"], ["recap", "Film"],
  ["signage", "Signpost"], ["press", "Newspaper"],
];

function getIconFromText(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [keyword, iconName] of KEYWORD_ICON_PAIRS) {
    if (lower.includes(keyword)) return iconName;
  }
  return null;
}

function resolveIcon(iconName?: string, fallbackText?: string, props?: LucideProps): React.ReactNode {
  // Try explicit icon name first
  if (iconName) {
    const icon = getIcon(iconName, props);
    if (icon) return icon;
  }
  // Fallback to keyword matching from text
  if (fallbackText) {
    const matched = getIconFromText(fallbackText);
    if (matched) {
      const Icon = (LucideIcons as unknown as IconMap)[matched];
      if (Icon) return <Icon {...(props || {})} />;
    }
  }
  // Ultimate fallback
  return <LucideIcons.Sparkles {...(props || {})} />;
}

// --- Brand System ---
interface BrandSystem {
  isDarkBrand: boolean;
  secondaryAccent: string;
  accentRgb: { r: number; g: number; b: number };
  glassBg: string;
  glassBorder: string;
  cardBg: string;
  cardHoverShadow: string;
  headingTransform: "uppercase" | "none";
  headingTracking: string;
  headingWeight: number;
  labelTransform: "uppercase" | "none";
  labelTracking: string;
  borderRadius: string;
  spacing: "tight" | "airy" | "generous";
}

function createBrandSystem(brand: BrandAnalysis): BrandSystem {
  const isDarkBrand = getLuminance(brand.backgroundColor) < 0.5;
  const accentRgb = hexToRgb(brand.accentColor);
  const accentHsl = hexToHsl(brand.accentColor);
  const secondaryAccent = accentHsl.s < 0.1
    ? hslToHex(accentHsl.h + 180, 0.3, accentHsl.l)
    : hslToHex(accentHsl.h + 40, accentHsl.s * 0.9, Math.min(accentHsl.l + 0.05, 0.7));

  const tone = brand.tone.toLowerCase();
  const isBold = ["bold", "edgy", "modern", "dynamic", "sporty", "strong", "powerful"].some(w => tone.includes(w));
  const isElegant = ["elegant", "luxury", "premium", "sophisticated", "refined"].some(w => tone.includes(w));

  return {
    isDarkBrand,
    secondaryAccent,
    accentRgb,
    glassBg: isDarkBrand ? `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.04)` : "rgba(0,0,0,0.02)",
    glassBorder: isDarkBrand ? `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.12)` : "rgba(0,0,0,0.08)",
    cardBg: isDarkBrand
      ? `rgba(255,255,255,0.04)`
      : "rgba(0,0,0,0.03)",
    cardHoverShadow: `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.3)`,
    headingTransform: isBold ? "uppercase" : "none",
    headingTracking: brand.headingTracking || (isBold ? "-0.02em" : isElegant ? "0.03em" : "-0.01em"),
    headingWeight: brand.headingWeight || (isBold ? 900 : isElegant ? 400 : 700),
    labelTransform: "uppercase",
    labelTracking: isElegant ? "0.2em" : "0.12em",
    borderRadius: brand.borderRadius || "12px",
    spacing: brand.spacing || "airy",
  };
}

// --- Background ---
function getBackgroundStyle(variant: SlideData["backgroundVariant"], brand: BrandAnalysis, system: BrandSystem, imageUrl?: string): React.CSSProperties {
  const { accentRgb } = system;
  if (imageUrl) {
    return {
      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%), url(${imageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      color: "#ffffff",
    };
  }
  switch (variant) {
    case "primary": return { backgroundColor: brand.primaryColor };
    case "gradient":
      return { background: `linear-gradient(135deg, ${brand.primaryColor} 0%, ${mixColors(brand.primaryColor, brand.accentColor, 0.2)} 50%, ${brand.secondaryColor} 100%)` };
    case "light": return { backgroundColor: "#f8f7f4", color: "#0a0a0a" };
    case "accent": return {
      background: `linear-gradient(135deg, ${brand.accentColor}, ${system.secondaryAccent})`,
      color: "#ffffff",
    };
    default: return { backgroundColor: brand.backgroundColor };
  }
}

// --- Accent text ---
function AccentText({ text, accentWords, accentColor, secondaryAccent, isAccentBg, useGradient, className }: {
  text: string; accentWords?: string[]; accentColor: string; secondaryAccent?: string;
  isAccentBg?: boolean; useGradient?: boolean; className?: string;
}) {
  if (!accentWords || accentWords.length === 0) return <span className={className}>{text}</span>;
  const pattern = new RegExp(`(${accentWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        accentWords.some(w => w.toLowerCase() === part.toLowerCase()) ? (
          useGradient && secondaryAccent ? (
            <span key={i} style={{
              background: `linear-gradient(135deg, ${isAccentBg ? "#ffffff" : accentColor}, ${isAccentBg ? "#e0e0e0" : secondaryAccent})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>{part}</span>
          ) : (
            <span key={i} style={{ color: isAccentBg ? "#ffffff" : accentColor }}>{part}</span>
          )
        ) : <span key={i}>{part}</span>
      )}
    </span>
  );
}

// --- Animated Counter ---
function AnimatedCounter({ value, color, className }: { value: string; color: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!isInView) return;
    const numMatch = value.match(/^([^0-9]*)([\d,.]+)(.*)/);
    if (!numMatch) { setDisplay(value); return; }
    const [, prefix, numStr, suffix] = numMatch;
    const target = parseFloat(numStr.replace(/,/g, ""));
    if (isNaN(target)) { setDisplay(value); return; }
    const duration = 1200;
    const start = performance.now();
    const hasDecimal = numStr.includes(".");
    const decimalPlaces = hasDecimal ? numStr.split(".")[1]?.length || 0 : 0;
    function animate(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      if (hasDecimal) setDisplay(prefix + current.toFixed(decimalPlaces) + suffix);
      else {
        const formatted = numStr.includes(",") ? Math.round(current).toLocaleString() : String(Math.round(current));
        setDisplay(prefix + formatted + suffix);
      }
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [isInView, value]);

  return <p ref={ref} className={className || "text-5xl md:text-7xl font-bold tracking-tight tabular-nums"} style={{ color }}>{display}</p>;
}

// --- Glass Card ---
function GlassCard({ children, system, brand, className, hoverGlow, accentTint, style,
  variants, initial, whileInView, viewport, custom,
}: {
  children: React.ReactNode; system: BrandSystem; brand: BrandAnalysis;
  className?: string; hoverGlow?: boolean; accentTint?: boolean; style?: React.CSSProperties;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variants?: any; initial?: any; whileInView?: any; viewport?: any; custom?: any;
}) {
  const { accentRgb } = system;
  return (
    <motion.div
      variants={variants} initial={initial} whileInView={whileInView} viewport={viewport} custom={custom}
      whileHover={hoverGlow !== false ? {
        y: -6, boxShadow: `0 12px 40px ${system.cardHoverShadow}`, transition: { duration: 0.3 },
      } : undefined}
      className={`overflow-hidden ${className || ""}`}
      style={{
        borderRadius: system.borderRadius,
        backgroundColor: accentTint
          ? `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.1)`
          : system.cardBg,
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${accentTint
          ? `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.2)`
          : system.glassBorder}`,
        ...style,
      }}
    >{children}</motion.div>
  );
}

// --- Icon Badge ---
function IconBadge({ icon, fallbackText, accentColor, accentRgb, size = "md" }: {
  icon?: string; fallbackText?: string; accentColor: string;
  accentRgb: { r: number; g: number; b: number };
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "w-14 h-14" : size === "sm" ? "w-8 h-8" : "w-11 h-11";
  const iconSize = size === "lg" ? 24 : size === "sm" ? 14 : 18;
  return (
    <motion.div
      initial={{ scale: 0, rotate: -10 }}
      whileInView={{ scale: 1, rotate: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`${sizeClass} rounded-xl flex items-center justify-center shrink-0`}
      style={{
        background: `linear-gradient(135deg, rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.15), rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.05))`,
        border: `1px solid rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.2)`,
      }}
    >
      {resolveIcon(icon, fallbackText, { size: iconSize, color: accentColor, strokeWidth: 1.8 })}
    </motion.div>
  );
}

// --- Decorative Elements ---
function SlideDecorations({ brand, system, variant, index, slideType }: {
  brand: BrandAnalysis; system: BrandSystem; variant?: string; index: number; slideType: string;
}) {
  const { accentRgb } = system;
  const isLight = variant === "light";
  const isAccent = variant === "accent";
  const baseColor = isAccent ? "255,255,255" : `${accentRgb.r},${accentRgb.g},${accentRgb.b}`;
  const seed = index % 4;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top accent line */}
      <motion.div
        initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
        className="absolute top-0 left-0 origin-left"
        style={{
          width: "30%", height: "2px",
          background: isAccent
            ? "rgba(255,255,255,0.3)"
            : `linear-gradient(90deg, ${brand.accentColor}, transparent)`,
        }}
      />

      {/* Ambient glow */}
      {(slideType === "hero" || slideType === "section-break" || slideType === "cta" || slideType === "big-statement") && (
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 2 }}
          className="absolute"
          style={{
            width: "50%", height: "50%",
            background: `radial-gradient(circle, rgba(${baseColor},0.08) 0%, transparent 70%)`,
            right: seed % 2 === 0 ? "-10%" : "auto",
            left: seed % 2 === 1 ? "-10%" : "auto",
            top: seed < 2 ? "-10%" : "auto",
            bottom: seed >= 2 ? "-10%" : "auto",
          }}
        />
      )}

      {/* Subtle dot grid */}
      {!isAccent && (
        <div className="absolute inset-0" style={{
          opacity: 0.015,
          backgroundImage: `radial-gradient(${isLight ? "#000" : "#fff"} 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }} />
      )}

      {/* Corner accent shape */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute"
        style={{
          width: "200px", height: "200px",
          borderRadius: "50%",
          border: `1px solid rgba(${baseColor},0.06)`,
          right: seed % 2 === 0 ? "-50px" : "auto",
          left: seed % 2 === 1 ? "-50px" : "auto",
          bottom: "-50px",
        }}
      />
    </div>
  );
}

// --- Main Slide ---
export function Slide({ slide, brand, index, total }: SlideProps) {
  const system = createBrandSystem(brand);
  const useImageBg = slide.imageUrl && (slide.type === "hero" || slide.type === "section-break");
  const bgStyle = getBackgroundStyle(slide.backgroundVariant, brand, system, useImageBg ? slide.imageUrl : undefined);
  const isImageBg = !!useImageBg;
  const isLight = slide.backgroundVariant === "light" && !isImageBg;
  const isAccent = slide.backgroundVariant === "accent" && !isImageBg;
  const isDark = (!isLight && !isAccent) || isImageBg;
  const textClass = isDark ? "text-white" : isAccent ? "text-white" : "text-zinc-900";
  const mutedClass = isDark ? "text-white/50" : isAccent ? "text-white/70" : "text-zinc-500";
  const fontFamily = brand.customFontName ? `"${brand.customFontName}", ${brand.fontStyle}` : undefined;

  return (
    <section className="slide-section relative overflow-hidden" style={{ ...bgStyle, fontFamily }}>
      {!isImageBg && <SlideDecorations brand={brand} system={system} variant={slide.backgroundVariant} index={index} slideType={slide.type} />}
      <div className="relative z-10 h-full min-h-screen flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20">
        {/* Logo */}
        {brand.logoUrl && (
          <motion.div initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5 }} className="absolute top-8 left-8 md:left-16 lg:left-24">
            <img src={brand.logoUrl} alt="Logo" className="h-7 max-w-[100px] object-contain"
              style={{ filter: isDark || isAccent ? "brightness(0) invert(1)" : "none" }} />
          </motion.div>
        )}

        {/* Slide counter */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`absolute top-8 right-8 md:right-16 lg:right-24 text-[10px] font-mono tracking-wider ${mutedClass}`}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </motion.div>

        {slide.type === "hero" && <HeroSlide slide={slide} textClass={textClass} mutedClass={mutedClass} brand={brand} system={system} isImageBg={isImageBg} />}
        {slide.type === "content" && <ContentSlide slide={slide} textClass={textClass} mutedClass={mutedClass} brand={brand} system={system} />}
        {slide.type === "stats" && <StatsSlide slide={slide} textClass={textClass} mutedClass={mutedClass} brand={brand} system={system} />}
        {slide.type === "features" && <FeaturesSlide slide={slide} textClass={textClass} mutedClass={mutedClass} brand={brand} system={system} />}
        {slide.type === "comparison" && <ComparisonSlide slide={slide} textClass={textClass} brand={brand} system={system} />}
        {slide.type === "quote" && <QuoteSlide slide={slide} brand={brand} system={system} />}
        {slide.type === "timeline" && <TimelineSlide slide={slide} textClass={textClass} mutedClass={mutedClass} brand={brand} system={system} />}
        {slide.type === "section-break" && <SectionBreakSlide slide={slide} textClass={textClass} mutedClass={mutedClass} brand={brand} system={system} />}
        {slide.type === "cta" && <CtaSlide slide={slide} textClass={textClass} mutedClass={mutedClass} brand={brand} system={system} />}
        {slide.type === "image" && <ImageSlide slide={slide} textClass={textClass} mutedClass={mutedClass} brand={brand} system={system} />}
        {slide.type === "table" && <TableSlide slide={slide} textClass={textClass} brand={brand} system={system} />}
        {slide.type === "big-statement" && <BigStatementSlide slide={slide} textClass={textClass} mutedClass={mutedClass} brand={brand} system={system} />}
      </div>
    </section>
  );
}

interface SlideTypeProps {
  slide: SlideData; textClass: string; mutedClass: string;
  brand: BrandAnalysis; system: BrandSystem; isImageBg?: boolean;
}

// --- HERO ---
function HeroSlide({ slide, textClass, mutedClass, brand, system, isImageBg }: SlideTypeProps) {
  const showSideImage = slide.imageUrl && !isImageBg;
  return (
    <div className="max-w-7xl w-full mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
      <div className="flex-1 max-w-3xl">
        {slide.subtitle && (
          <motion.div variants={slideInLeft} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
            className="flex items-center gap-3 mb-8">
            <div className="w-8 h-[2px]" style={{ background: `linear-gradient(90deg, ${brand.accentColor}, transparent)` }} />
            <span className="text-xs font-semibold tracking-wider"
              style={{ color: brand.accentColor, textTransform: system.labelTransform, letterSpacing: system.labelTracking }}>
              {slide.subtitle}
            </span>
          </motion.div>
        )}
        <motion.h1 variants={slideInLeft} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={1}
          className={`text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.95] ${textClass}`}
          style={{ textTransform: system.headingTransform, letterSpacing: system.headingTracking, fontWeight: system.headingWeight }}>
          <AccentText text={slide.title || ""} accentWords={slide.accentWords} accentColor={brand.accentColor}
            secondaryAccent={system.secondaryAccent} isAccentBg={slide.backgroundVariant === "accent"} useGradient={true} />
        </motion.h1>
        {slide.body && (
          <motion.p variants={slideInLeft} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={2}
            className={`text-lg md:text-xl mt-8 max-w-xl leading-relaxed ${mutedClass}`}>{slide.body}</motion.p>
        )}
        <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5, ease: EASE }} className="mt-10 origin-left">
          <div className="w-16 h-[3px] rounded-full" style={{ background: `linear-gradient(90deg, ${brand.accentColor}, ${system.secondaryAccent})` }} />
        </motion.div>
      </div>
      {showSideImage && (
        <motion.div initial={{ opacity: 0, scale: 0.9, x: 40 }} whileInView={{ opacity: 1, scale: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }} className="flex-shrink-0 w-full lg:w-[42%]">
          <img src={slide.imageUrl} alt="" className="w-full h-auto max-h-[55vh] object-cover shadow-2xl"
            style={{ borderRadius: system.borderRadius }} />
        </motion.div>
      )}
    </div>
  );
}

// --- CONTENT ---
function ContentSlide({ slide, textClass, mutedClass, brand, system }: SlideTypeProps) {
  return (
    <div className={`max-w-6xl w-full mx-auto ${slide.imageUrl ? "flex flex-col lg:flex-row items-center gap-12" : ""}`}>
      <div className="flex-1">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
          className={`text-3xl md:text-5xl lg:text-6xl tracking-tight mb-8 ${textClass}`}
          style={{ fontWeight: system.headingWeight, textTransform: system.headingTransform, letterSpacing: system.headingTracking }}>
          <AccentText text={slide.title || ""} accentWords={slide.accentWords} accentColor={brand.accentColor}
            isAccentBg={slide.backgroundVariant === "accent"} />
        </motion.h2>
        {slide.body && (
          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={1}
            className={`text-base md:text-lg leading-relaxed max-w-2xl mb-10 ${mutedClass}`}>{slide.body}</motion.p>
        )}
        {slide.bullets && slide.bullets.length > 0 && (
          <div className="space-y-3 max-w-2xl">
            {slide.bullets.map((bullet, i) => (
              <GlassCard key={i} system={system} brand={brand}
                variants={slideInLeft} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={i + 2}
                className="flex items-center gap-4 px-5 py-4">
                <IconBadge fallbackText={bullet} accentColor={brand.accentColor} accentRgb={system.accentRgb} size="sm" />
                <p className={`text-base ${textClass} opacity-90`}>{bullet}</p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
      {slide.imageUrl && (
        <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={1}
          className="flex-shrink-0 w-full lg:w-[40%]">
          <img src={slide.imageUrl} alt="" className="w-full h-auto max-h-[50vh] object-cover shadow-2xl"
            style={{ borderRadius: system.borderRadius }} />
        </motion.div>
      )}
    </div>
  );
}

// --- STATS ---
function StatsSlide({ slide, textClass, mutedClass, brand, system }: SlideTypeProps) {
  const { accentRgb } = system;
  const statCount = slide.stats?.length || 0;
  return (
    <div className="max-w-6xl w-full mx-auto">
      {slide.title && (
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
          className={`text-3xl md:text-5xl tracking-tight mb-16 ${textClass}`}
          style={{ fontWeight: system.headingWeight, textTransform: system.headingTransform, letterSpacing: system.headingTracking }}>
          {slide.title}
        </motion.h2>
      )}
      <div className={`grid gap-6 ${
        statCount <= 2 ? "grid-cols-1 md:grid-cols-2 max-w-3xl"
        : statCount <= 3 ? "grid-cols-1 md:grid-cols-3"
        : "grid-cols-2 md:grid-cols-4"
      }`}>
        {slide.stats?.map((stat, i) => (
          <GlassCard key={i} system={system} brand={brand} hoverGlow accentTint={i === 0}
            variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={i + 1}
            className="p-8 relative group">
            {/* Top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, ${brand.accentColor}, ${system.secondaryAccent})`, opacity: 0.5 + i * 0.15 }} />

            {/* Icon */}
            <div className="mb-5">
              <IconBadge icon={stat.icon} fallbackText={`${stat.label} ${stat.description || ""}`}
                accentColor={brand.accentColor} accentRgb={accentRgb} size="md" />
            </div>

            <AnimatedCounter value={stat.value} color={brand.accentColor}
              className="text-4xl md:text-5xl font-bold tracking-tight tabular-nums" />
            <p className={`text-sm font-semibold mt-3 ${textClass}`}
              style={{ textTransform: system.labelTransform, letterSpacing: system.labelTracking }}>{stat.label}</p>
            {stat.description && <p className={`text-xs mt-1 ${mutedClass}`}>{stat.description}</p>}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

// --- FEATURES ---
function FeaturesSlide({ slide, textClass, mutedClass, brand, system }: SlideTypeProps) {
  const { accentRgb } = system;
  const count = slide.features?.length || 0;
  const cols = count <= 3 ? "grid-cols-1 md:grid-cols-3" : count === 4 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  return (
    <div className="max-w-6xl w-full mx-auto">
      {slide.title && (
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
          className={`text-3xl md:text-5xl tracking-tight mb-14 ${textClass}`}
          style={{ fontWeight: system.headingWeight, textTransform: system.headingTransform, letterSpacing: system.headingTracking }}>
          {slide.title}
        </motion.h2>
      )}
      <div className={`grid gap-5 ${cols}`}>
        {slide.features?.map((feature, i) => {
          const hasColor = feature.color && feature.color !== "";
          return hasColor ? (
            <motion.div key={i} variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={i + 1}
              whileHover={{ y: -6, boxShadow: `0 12px 40px ${feature.color}40`, transition: { duration: 0.3 } }}
              className="p-7 relative overflow-hidden" style={{ backgroundColor: feature.color, borderRadius: system.borderRadius }}>
              <div className="mb-5">
                <IconBadge icon={feature.icon} fallbackText={`${feature.title} ${feature.description}`}
                  accentColor="#ffffff" accentRgb={{ r: 255, g: 255, b: 255 }} size="md" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-white/75">{feature.description}</p>
            </motion.div>
          ) : (
            <GlassCard key={i} system={system} brand={brand} hoverGlow
              variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={i + 1}
              className="p-7 relative">
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px]"
                style={{ background: `linear-gradient(180deg, ${brand.accentColor}, transparent)`, opacity: 0.5 }} />

              <div className="mb-5">
                <IconBadge icon={feature.icon} fallbackText={`${feature.title} ${feature.description}`}
                  accentColor={brand.accentColor} accentRgb={accentRgb} size="md" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${textClass}`}>{feature.title}</h3>
              <p className={`text-sm leading-relaxed ${mutedClass}`}>{feature.description}</p>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

// --- COMPARISON ---
function ComparisonSlide({ slide, textClass, brand, system }: Omit<SlideTypeProps, "mutedClass">) {
  const colCount = slide.columns?.length || 0;
  return (
    <div className="max-w-6xl w-full mx-auto">
      {slide.title && (
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
          className={`text-3xl md:text-5xl tracking-tight mb-14 ${textClass}`}
          style={{ fontWeight: system.headingWeight, textTransform: system.headingTransform, letterSpacing: system.headingTracking }}>
          {slide.title}
        </motion.h2>
      )}
      <div className={`grid gap-5 ${colCount <= 2 ? "grid-cols-1 md:grid-cols-2 max-w-4xl" : "grid-cols-1 md:grid-cols-3"}`}>
        {slide.columns?.map((col, colIdx) => {
          const isLast = colIdx === colCount - 1;
          return (
            <GlassCard key={colIdx} system={system} brand={brand} hoverGlow accentTint={isLast}
              variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={colIdx + 1}
              className="p-7 relative">
              {isLast && (
                <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }} className="absolute top-0 left-0 right-0 h-[2px] origin-left"
                  style={{ background: `linear-gradient(90deg, ${brand.accentColor}, ${system.secondaryAccent})` }} />
              )}
              {isLast && (
                <div className="absolute top-4 right-4">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `rgba(${system.accentRgb.r},${system.accentRgb.g},${system.accentRgb.b},0.15)`,
                      color: brand.accentColor,
                      letterSpacing: system.labelTracking,
                    }}>BEST</span>
                </div>
              )}
              <h3 className={`text-xl font-bold mb-6 ${isLast ? "" : textClass}`}
                style={isLast ? { color: brand.accentColor } : undefined}>{col.title}</h3>
              <ul className="space-y-3">
                {col.items.map((item, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: (colIdx + 1) * 0.1 + i * 0.05 }}
                    className={`flex items-start gap-3 text-sm ${textClass} opacity-85`}>
                    <LucideIcons.Check size={14} className="mt-1 shrink-0" style={{ color: brand.accentColor }} />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

// --- QUOTE ---
function QuoteSlide({ slide, brand, system }: Omit<SlideTypeProps, "textClass" | "mutedClass">) {
  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
      <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 200 }} className="mb-8">
        <LucideIcons.Quote size={48} style={{ color: brand.accentColor, opacity: 0.4 }} />
      </motion.div>
      <motion.blockquote variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
        className="text-2xl md:text-4xl lg:text-5xl font-medium leading-snug text-white tracking-tight"
        style={{ fontWeight: system.headingWeight === 900 ? 700 : system.headingWeight }}>
        &ldquo;{slide.quote?.text}&rdquo;
      </motion.blockquote>
      {slide.quote?.attribution && (
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={1}
          className="flex items-center gap-3 mt-10">
          <div className="w-8 h-[2px]" style={{ background: brand.accentColor }} />
          <p className="text-sm font-semibold"
            style={{ color: brand.accentColor, textTransform: system.labelTransform, letterSpacing: system.labelTracking }}>
            {slide.quote.attribution}
          </p>
        </motion.div>
      )}
    </div>
  );
}

// --- TIMELINE ---
function TimelineSlide({ slide, textClass, mutedClass, brand, system }: SlideTypeProps) {
  const { accentRgb } = system;
  return (
    <div className="max-w-6xl w-full mx-auto">
      {slide.title && (
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
          className={`text-3xl md:text-5xl tracking-tight mb-16 ${textClass}`}
          style={{ fontWeight: system.headingWeight, textTransform: system.headingTransform, letterSpacing: system.headingTracking }}>
          {slide.title}
        </motion.h2>
      )}
      <div className="space-y-4">
        {slide.timelineItems?.map((item, i) => (
          <GlassCard key={i} system={system} brand={brand} hoverGlow
            variants={slideInLeft} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={i + 1}
            className="flex items-center gap-6 px-6 py-5 relative">
            {/* Step number */}
            <motion.div
              initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
              transition={{ delay: (i + 1) * 0.1, type: "spring", stiffness: 300 }}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
              style={{
                background: `linear-gradient(135deg, ${brand.accentColor}, ${system.secondaryAccent})`,
                color: "#fff",
                boxShadow: `0 0 20px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.3)`,
              }}>
              {String(i + 1).padStart(2, "0")}
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className={`text-base font-bold ${textClass}`}>{item.label}</p>
              <p className={`text-sm mt-0.5 ${mutedClass}`}>{item.description}</p>
            </div>
            {/* Connector to next */}
            {i < (slide.timelineItems?.length || 0) - 1 && (
              <div className="absolute left-[43px] -bottom-3 w-[2px] h-4 z-20"
                style={{ backgroundColor: `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.2)` }} />
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

// --- SECTION BREAK ---
function SectionBreakSlide({ slide, textClass, mutedClass, brand, system }: SlideTypeProps) {
  return (
    <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center">
      <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE }} className="mb-10 origin-center">
        <div className="w-16 h-[3px] rounded-full" style={{ background: `linear-gradient(90deg, ${brand.accentColor}, ${system.secondaryAccent})` }} />
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 40, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
        className={`text-4xl md:text-6xl lg:text-8xl tracking-tight ${textClass}`}
        style={{ fontWeight: system.headingWeight, textTransform: system.headingTransform, letterSpacing: system.headingTracking }}>
        <AccentText text={slide.title || ""} accentWords={slide.accentWords} accentColor={brand.accentColor}
          secondaryAccent={system.secondaryAccent} isAccentBg={slide.backgroundVariant === "accent"} useGradient={true} />
      </motion.h2>
      {slide.subtitle && (
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={2}
          className={`text-lg md:text-xl mt-6 max-w-xl ${mutedClass}`}>{slide.subtitle}</motion.p>
      )}
    </div>
  );
}

// --- CTA ---
function CtaSlide({ slide, textClass, mutedClass, brand, system }: SlideTypeProps) {
  const { accentRgb } = system;
  return (
    <div className="max-w-3xl mx-auto text-center">
      <motion.h2 initial={{ opacity: 0, y: 40, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: EASE }}
        className={`text-4xl md:text-6xl lg:text-7xl tracking-tight ${textClass}`}
        style={{ fontWeight: system.headingWeight, textTransform: system.headingTransform, letterSpacing: system.headingTracking }}>
        <AccentText text={slide.title || ""} accentWords={slide.accentWords} accentColor={brand.accentColor}
          secondaryAccent={system.secondaryAccent} isAccentBg={slide.backgroundVariant === "accent"} useGradient={true} />
      </motion.h2>
      {slide.subtitle && (
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={1}
          className={`text-xl md:text-2xl mt-6 ${mutedClass}`}>{slide.subtitle}</motion.p>
      )}
      {slide.body && (
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={2}
          className={`text-base mt-8 ${mutedClass} font-mono`}>{slide.body}</motion.p>
      )}
      <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 200 }}
        className="mt-14">
        <motion.div
          whileHover={{ scale: 1.03, boxShadow: `0 16px 48px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.4)` }}
          whileTap={{ scale: 0.98 }}
          className="inline-block px-10 py-4 text-white font-semibold text-lg cursor-pointer"
          style={{
            borderRadius: system.borderRadius,
            background: `linear-gradient(135deg, ${brand.accentColor}, ${system.secondaryAccent})`,
            boxShadow: `0 8px 30px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.3)`,
          }}>
          Get in Touch
        </motion.div>
      </motion.div>
    </div>
  );
}

// --- IMAGE ---
function ImageSlide({ slide, textClass, mutedClass, brand, system }: SlideTypeProps) {
  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col lg:flex-row items-center gap-12">
      {slide.imageUrl && (
        <motion.div initial={{ opacity: 0, scale: 0.9, x: -30 }} whileInView={{ opacity: 1, scale: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: EASE }}
          className="flex-1 w-full lg:w-auto">
          <div className="relative overflow-hidden shadow-2xl" style={{ borderRadius: system.borderRadius }}>
            <img src={slide.imageUrl} alt={slide.title || ""} className="w-full h-auto object-cover" />
          </div>
        </motion.div>
      )}
      <div className={`flex-1 ${slide.imageUrl ? "" : "text-center mx-auto"}`}>
        {slide.title && (
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
            className={`text-3xl md:text-5xl font-bold tracking-tight mb-6 ${textClass}`}>
            <AccentText text={slide.title} accentWords={slide.accentWords} accentColor={brand.accentColor}
              secondaryAccent={system.secondaryAccent} isAccentBg={slide.backgroundVariant === "accent"} useGradient={true} />
          </motion.h2>
        )}
        {slide.body && (
          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={1}
            className={`text-base md:text-lg leading-relaxed ${mutedClass}`}>{slide.body}</motion.p>
        )}
      </div>
    </div>
  );
}

// --- TABLE ---
function TableSlide({ slide, textClass, brand, system }: Omit<SlideTypeProps, "mutedClass">) {
  const { accentRgb } = system;
  return (
    <div className="max-w-5xl w-full mx-auto">
      {slide.title && (
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
          className={`text-3xl md:text-5xl tracking-tight mb-10 ${textClass}`}
          style={{ fontWeight: system.headingWeight, textTransform: system.headingTransform, letterSpacing: system.headingTracking }}>
          <AccentText text={slide.title} accentWords={slide.accentWords} accentColor={brand.accentColor}
            isAccentBg={slide.backgroundVariant === "accent"} />
        </motion.h2>
      )}
      {slide.tableData && (
        <GlassCard system={system} brand={brand} hoverGlow={false}
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={1}
          className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.08)` }}>
                {slide.tableData.headers.map((header, i) => (
                  <th key={i} className={`text-left text-xs font-semibold px-6 py-4 border-b ${system.isDarkBrand ? "border-white/10" : "border-zinc-200"}`}
                    style={{ color: brand.accentColor, textTransform: system.labelTransform, letterSpacing: system.labelTracking }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slide.tableData.rows.map((row, rowIdx) => (
                <motion.tr key={rowIdx} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: (rowIdx + 2) * 0.06 }}
                  className={`border-b ${system.isDarkBrand ? "border-white/5" : "border-zinc-100"}`}>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className={`px-6 py-4 ${cellIdx === 0 ? `text-sm font-medium ${textClass}` : `text-base font-semibold ${textClass}`}`}>
                      {cell}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}

// --- BIG STATEMENT ---
function BigStatementSlide({ slide, textClass, mutedClass, brand, system }: SlideTypeProps) {
  return (
    <div className="max-w-5xl mx-auto text-center flex flex-col items-center justify-center">
      {slide.subtitle && (
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
          className="text-sm font-semibold mb-8"
          style={{ color: brand.accentColor, textTransform: system.labelTransform, letterSpacing: system.labelTracking }}>
          {slide.subtitle}
        </motion.p>
      )}
      <motion.h2 initial={{ opacity: 0, y: 50, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.9, ease: EASE }}
        className={`text-4xl md:text-6xl lg:text-8xl tracking-tight leading-[1.05] ${textClass}`}
        style={{ fontWeight: system.headingWeight, textTransform: system.headingTransform, letterSpacing: system.headingTracking }}>
        <AccentText text={slide.title || ""} accentWords={slide.accentWords} accentColor={brand.accentColor}
          secondaryAccent={system.secondaryAccent} isAccentBg={slide.backgroundVariant === "accent"} useGradient={true} />
      </motion.h2>
      {slide.body && (
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={2}
          className={`text-lg md:text-xl mt-8 max-w-2xl ${mutedClass}`}>{slide.body}</motion.p>
      )}
    </div>
  );
}
