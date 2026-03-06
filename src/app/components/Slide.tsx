"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { BrandAnalysis, SlideData } from "../types";

interface SlideProps {
  slide: SlideData;
  brand: BrandAnalysis;
  index: number;
  total: number;
}

// --- Animation variants ---
const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: EASE },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.6, delay: i * 0.1, ease: EASE },
  }),
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: EASE },
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

// --- Brand-adaptive system ---
interface BrandSystem {
  isDarkBrand: boolean;
  secondaryAccent: string;
  accentRgb: { r: number; g: number; b: number };
  glassBg: string;
  glassBorder: string;
  cardHoverShadow: string;
  headingTransform: "uppercase" | "none";
  headingTracking: string;
  headingWeight: number;
  labelTransform: "uppercase" | "none";
  labelTracking: string;
}

function createBrandSystem(brand: BrandAnalysis): BrandSystem {
  const isDarkBrand = getLuminance(brand.backgroundColor) < 0.5;
  const accentRgb = hexToRgb(brand.accentColor);
  const accentHsl = hexToHsl(brand.accentColor);
  const secondaryAccent = accentHsl.s < 0.1
    ? hslToHex(accentHsl.h + 180, 0.3, accentHsl.l)
    : hslToHex(accentHsl.h + 40, accentHsl.s * 0.9, Math.min(accentHsl.l + 0.05, 0.7));

  // Tone-based typography — use extracted values or derive from tone
  const tone = brand.tone.toLowerCase();
  const isBold = ["bold", "edgy", "modern", "dynamic", "sporty", "strong", "powerful"].some(w => tone.includes(w));
  const isElegant = ["elegant", "luxury", "premium", "sophisticated", "refined"].some(w => tone.includes(w));

  return {
    isDarkBrand,
    secondaryAccent,
    accentRgb,
    glassBg: isDarkBrand ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
    glassBorder: isDarkBrand ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    cardHoverShadow: `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.25)`,
    headingTransform: isBold ? "uppercase" : "none",
    headingTracking: brand.headingTracking || (isBold ? "-0.02em" : isElegant ? "0.03em" : "-0.01em"),
    headingWeight: brand.headingWeight || (isBold ? 900 : isElegant ? 400 : 700),
    labelTransform: "uppercase",
    labelTracking: isElegant ? "0.2em" : "0.12em",
  };
}

// --- Background ---
function getBackgroundStyle(variant: SlideData["backgroundVariant"], brand: BrandAnalysis, imageUrl?: string): React.CSSProperties {
  if (imageUrl) {
    return {
      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.65) 100%), url(${imageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      color: "#ffffff",
    };
  }
  switch (variant) {
    case "primary": return { backgroundColor: brand.primaryColor };
    case "gradient":
      return { background: `linear-gradient(135deg, ${brand.primaryColor} 0%, ${mixColors(brand.primaryColor, brand.accentColor, 0.15)} 50%, ${brand.secondaryColor} 100%)` };
    case "light": return { backgroundColor: "#f5f3ee", color: "#0a0a0a" };
    case "accent": return { backgroundColor: brand.accentColor, color: "#ffffff" };
    default: return { backgroundColor: brand.backgroundColor };
  }
}

// --- Accent text with gradient ---
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

// SVG icons
const featureIcons = [
  (c: string) => <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  (c: string) => <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M18 20V10M12 20V4M6 20v-6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  (c: string) => <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="12" r="10" stroke={c} strokeWidth="2"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke={c} strokeWidth="2"/></svg>,
  (c: string) => <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="12" r="10" stroke={c} strokeWidth="2"/><circle cx="12" cy="12" r="6" stroke={c} strokeWidth="2"/><circle cx="12" cy="12" r="2" fill={c}/></svg>,
  (c: string) => <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" stroke={c} strokeWidth="2" strokeLinejoin="round"/></svg>,
  (c: string) => <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={c} strokeWidth="2" strokeLinejoin="round"/></svg>,
];

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
        y: -4, boxShadow: `0 8px 32px ${system.cardHoverShadow}`, transition: { duration: 0.25 },
      } : undefined}
      className={`rounded-lg overflow-hidden ${className || ""}`}
      style={{
        backgroundColor: accentTint
          ? `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.08)`
          : system.glassBg,
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${accentTint
          ? `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.18)`
          : system.glassBorder}`,
        ...style,
      }}
    >{children}</motion.div>
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

// --- Decorative background ---
function DecorativeShapes({ brand, variant, index, slideType, system }: {
  brand: BrandAnalysis; variant?: string; index: number; slideType: string; system: BrandSystem;
}) {
  const isLight = variant === "light";
  const isAccent = variant === "accent";
  const { accentRgb } = system;
  const seed = index % 6;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute"
        style={{
          width: seed % 2 === 0 ? "30%" : "25%", height: seed % 3 === 0 ? "40%" : "30%",
          background: isAccent ? "rgba(255,255,255,0.06)" : isLight
            ? `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.04)`
            : `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.06)`,
          right: seed % 2 === 0 ? 0 : "auto", left: seed % 2 === 1 ? 0 : "auto",
          top: seed <= 2 ? 0 : "auto", bottom: seed > 2 ? 0 : "auto",
          borderRadius: seed % 2 === 0 ? "0 0 0 40px" : "0 0 40px 0",
        }}
      />
      <motion.div
        initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 origin-left"
        style={{
          width: "25%", height: "3px",
          background: isAccent ? "rgba(255,255,255,0.3)" : `linear-gradient(90deg, ${brand.accentColor}, ${system.secondaryAccent})`,
        }}
      />
      {!isAccent && (
        <div className="absolute inset-0" style={{
          opacity: 0.02,
          backgroundImage: `radial-gradient(${isLight ? "#000" : "#fff"} 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }} />
      )}
      {(slideType === "hero" || slideType === "section-break" || slideType === "big-statement" || slideType === "cta") && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute"
          style={{
            width: "400px", height: "400px",
            border: `1.5px solid ${isAccent ? "rgba(255,255,255,0.12)" : `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.1)`}`,
            borderRadius: "50%",
            right: seed % 2 === 0 ? "-5%" : "auto", left: seed % 2 === 1 ? "-5%" : "auto",
            top: seed <= 2 ? "10%" : "auto", bottom: seed > 2 ? "10%" : "auto",
          }}
        />
      )}
    </div>
  );
}

// --- Main Slide ---
export function Slide({ slide, brand, index, total }: SlideProps) {
  const system = createBrandSystem(brand);
  const useImageBg = slide.imageUrl && (slide.type === "hero" || slide.type === "section-break");
  const bgStyle = getBackgroundStyle(slide.backgroundVariant, brand, useImageBg ? slide.imageUrl : undefined);
  const isImageBg = !!useImageBg;
  const isLight = slide.backgroundVariant === "light" && !isImageBg;
  const isAccent = slide.backgroundVariant === "accent" && !isImageBg;
  const isDark = (!isLight && !isAccent) || isImageBg;
  const textClass = isDark ? "text-white" : isAccent ? "text-white" : "text-zinc-900";
  const mutedClass = isDark ? "text-white/60" : isAccent ? "text-white/70" : "text-zinc-500";
  const fontFamily = brand.customFontName ? `"${brand.customFontName}", ${brand.fontStyle}` : undefined;

  return (
    <section className="slide-section relative overflow-hidden" style={{ ...bgStyle, fontFamily }}>
      {!isImageBg && <DecorativeShapes brand={brand} variant={slide.backgroundVariant} index={index} slideType={slide.type} system={system} />}
      <div className="relative z-10 h-full min-h-screen flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20">
        {brand.logoUrl && (
          <motion.div initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5 }} className="absolute top-8 left-8">
            <img src={brand.logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain"
              style={{ filter: isDark || isAccent ? "brightness(0) invert(1)" : "none" }} />
          </motion.div>
        )}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }} className={`absolute top-8 right-8 text-xs ${mutedClass} font-mono`}>
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
    <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center gap-12">
      <div className="flex-1">
        {slide.subtitle && (
          <motion.p variants={slideInLeft} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
            className="text-sm font-semibold mb-6"
            style={{ color: brand.accentColor, textTransform: system.labelTransform, letterSpacing: system.labelTracking }}>
            {slide.subtitle}
          </motion.p>
        )}
        <motion.h1 variants={slideInLeft} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={1}
          className={`text-5xl md:text-7xl lg:text-8xl leading-[0.95] ${textClass}`}
          style={{ textTransform: system.headingTransform, letterSpacing: system.headingTracking, fontWeight: system.headingWeight }}>
          <AccentText text={slide.title || ""} accentWords={slide.accentWords} accentColor={brand.accentColor}
            secondaryAccent={system.secondaryAccent} isAccentBg={slide.backgroundVariant === "accent"} useGradient={true} />
        </motion.h1>
        {slide.body && (
          <motion.p variants={slideInLeft} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={2}
            className={`text-lg md:text-xl mt-8 max-w-xl leading-relaxed ${mutedClass}`}>{slide.body}</motion.p>
        )}
        <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }} className="mt-8 origin-left">
          <div className="w-20 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${brand.accentColor}, ${system.secondaryAccent})` }} />
        </motion.div>
      </div>
      {showSideImage ? (
        <motion.div initial={{ opacity: 0, scale: 0.9, x: 40 }} whileInView={{ opacity: 1, scale: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }} className="flex-shrink-0 w-full lg:w-[40%]">
          <img src={slide.imageUrl} alt="" className="w-full h-auto max-h-[55vh] rounded-lg object-cover shadow-2xl" />
        </motion.div>
      ) : !isImageBg ? (
        <motion.div initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }} className="hidden lg:block flex-shrink-0 w-[30%] h-[50vh] rounded-l-[40px]"
          style={{ backgroundColor: `rgba(${system.accentRgb.r},${system.accentRgb.g},${system.accentRgb.b},0.1)` }}>
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-2" style={{ borderColor: `rgba(${system.accentRgb.r},${system.accentRgb.g},${system.accentRgb.b},0.2)` }} />
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

// --- CONTENT ---
function ContentSlide({ slide, textClass, mutedClass, brand, system }: SlideTypeProps) {
  return (
    <div className={`max-w-5xl w-full ${slide.imageUrl ? "flex flex-col lg:flex-row items-center gap-12" : ""}`}>
      <div className="flex-1">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
          className={`text-3xl md:text-5xl tracking-tight mb-8 ${textClass}`}
          style={{ fontWeight: system.headingWeight, textTransform: system.headingTransform, letterSpacing: system.headingTracking }}>
          <AccentText text={slide.title || ""} accentWords={slide.accentWords} accentColor={brand.accentColor}
            isAccentBg={slide.backgroundVariant === "accent"} />
        </motion.h2>
        {slide.body && (
          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={1}
            className={`text-base md:text-lg leading-relaxed max-w-2xl mb-8 ${mutedClass}`}>{slide.body}</motion.p>
        )}
        {slide.bullets && slide.bullets.length > 0 && (
          <div className="space-y-3 max-w-2xl">
            {slide.bullets.map((bullet, i) => (
              <GlassCard key={i} system={system} brand={brand}
                variants={slideInLeft} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={i + 2}
                className="flex items-start gap-4 p-4">
                <div className="w-1 h-full min-h-[20px] rounded-full shrink-0 self-stretch" style={{ backgroundColor: brand.accentColor }} />
                <p className={`text-base md:text-lg ${textClass} opacity-90`}>{bullet}</p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
      {slide.imageUrl && (
        <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={1}
          className="flex-shrink-0 w-full lg:w-[40%]">
          <img src={slide.imageUrl} alt="" className="w-full h-auto max-h-[50vh] rounded-lg object-cover shadow-2xl" />
        </motion.div>
      )}
    </div>
  );
}

// --- STATS ---
function StatsSlide({ slide, textClass, mutedClass, brand, system }: SlideTypeProps) {
  const { accentRgb } = system;
  return (
    <div className="max-w-6xl w-full">
      {slide.title && (
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
          className={`text-3xl md:text-5xl tracking-tight mb-16 ${textClass}`}
          style={{ fontWeight: system.headingWeight, textTransform: system.headingTransform, letterSpacing: system.headingTracking }}>
          {slide.title}
        </motion.h2>
      )}
      <div className={`grid gap-6 ${
        (slide.stats?.length || 0) <= 2 ? "grid-cols-1 md:grid-cols-2"
        : (slide.stats?.length || 0) <= 3 ? "grid-cols-1 md:grid-cols-3"
        : "grid-cols-2 md:grid-cols-4"
      }`}>
        {slide.stats?.map((stat, i) => (
          <GlassCard key={i} system={system} brand={brand} hoverGlow accentTint={i === 0}
            variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={i + 1}
            className="p-6 relative">
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-lg"
              style={{ background: `linear-gradient(90deg, ${brand.accentColor}, ${system.secondaryAccent})`, opacity: 0.7 + i * 0.1 }} />
            <span className="absolute top-3 right-4 font-bold tabular-nums select-none"
              style={{ fontSize: "4rem", lineHeight: 1, color: `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.06)` }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <AnimatedCounter value={stat.value} color={brand.accentColor}
              className="text-4xl md:text-6xl font-bold tracking-tight tabular-nums relative z-10" />
            <p className={`text-sm font-semibold mt-3 relative z-10 ${textClass}`}
              style={{ textTransform: system.labelTransform, letterSpacing: system.labelTracking }}>{stat.label}</p>
            {stat.description && <p className={`text-xs mt-1 relative z-10 ${mutedClass}`}>{stat.description}</p>}
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
  const cols = count <= 3 ? "grid-cols-1 md:grid-cols-3" : count === 4 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  return (
    <div className="max-w-6xl w-full">
      {slide.title && (
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
          className={`text-3xl md:text-5xl tracking-tight mb-12 ${textClass}`}
          style={{ fontWeight: system.headingWeight, textTransform: system.headingTransform, letterSpacing: system.headingTracking }}>
          {slide.title}
        </motion.h2>
      )}
      <div className={`grid gap-5 ${cols}`}>
        {slide.features?.map((feature, i) => {
          const hasColor = feature.color && feature.color !== "";
          const iconFn = featureIcons[i % featureIcons.length];
          return hasColor ? (
            <motion.div key={i} variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={i + 1}
              whileHover={{ y: -4, boxShadow: `0 8px 32px ${feature.color}40`, transition: { duration: 0.25 } }}
              className="p-6 rounded-lg relative overflow-hidden" style={{ backgroundColor: feature.color }}>
              <span className="absolute top-2 right-4 font-bold select-none" style={{ fontSize: "5rem", lineHeight: 1, color: "rgba(255,255,255,0.08)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
                transition={{ delay: (i + 1) * 0.12 + 0.1, type: "spring", stiffness: 300 }}
                className="w-10 h-10 rounded-lg mb-4 flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                {iconFn("#ffffff")}
              </motion.div>
              <h3 className="text-lg font-semibold mb-2 text-white relative z-10">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-white/80 relative z-10">{feature.description}</p>
            </motion.div>
          ) : (
            <GlassCard key={i} system={system} brand={brand} hoverGlow
              variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={i + 1}
              className="p-6 relative">
              <div className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ background: `linear-gradient(180deg, ${brand.accentColor}, ${system.secondaryAccent})`, opacity: 0.6 + i * 0.1 }} />
              <span className="absolute top-2 right-4 font-bold select-none"
                style={{ fontSize: "5rem", lineHeight: 1, color: `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.05)` }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
                transition={{ delay: (i + 1) * 0.12 + 0.1, type: "spring", stiffness: 300 }}
                className="w-10 h-10 rounded-lg mb-4 flex items-center justify-center"
                style={{ backgroundColor: `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.12)` }}>
                {iconFn(brand.accentColor)}
              </motion.div>
              <h3 className={`text-lg font-semibold mb-2 ${textClass} relative z-10`}>{feature.title}</h3>
              <p className={`text-sm leading-relaxed ${mutedClass} relative z-10`}>{feature.description}</p>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

// --- COMPARISON ---
function ComparisonSlide({ slide, textClass, brand, system }: Omit<SlideTypeProps, "mutedClass">) {
  return (
    <div className="max-w-5xl w-full">
      {slide.title && (
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
          className={`text-3xl md:text-5xl tracking-tight mb-12 ${textClass}`}
          style={{ fontWeight: system.headingWeight, textTransform: system.headingTransform, letterSpacing: system.headingTracking }}>
          {slide.title}
        </motion.h2>
      )}
      <div className={`grid gap-6 ${(slide.columns?.length || 0) <= 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"}`}>
        {slide.columns?.map((col, colIdx) => {
          const isLast = colIdx === (slide.columns?.length || 0) - 1;
          return (
            <GlassCard key={colIdx} system={system} brand={brand} hoverGlow accentTint={isLast}
              variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={colIdx + 1}
              className="p-6 relative">
              {isLast && (
                <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }} className="absolute top-0 left-0 right-0 h-[3px] origin-left rounded-t-lg"
                  style={{ background: `linear-gradient(90deg, ${brand.accentColor}, ${system.secondaryAccent})` }} />
              )}
              <h3 className={`text-xl font-bold mb-6 ${isLast ? "" : textClass}`}
                style={isLast ? { color: brand.accentColor } : undefined}>{col.title}</h3>
              <ul className="space-y-3">
                {col.items.map((item, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: (colIdx + 1) * 0.12 + i * 0.05 }}
                    className={`flex items-start gap-3 text-sm ${textClass} opacity-80`}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: brand.accentColor }} />
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
    <div className="max-w-4xl mx-auto flex items-start gap-8">
      <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-1.5 rounded-full origin-top shrink-0 hidden md:block"
        style={{ background: `linear-gradient(180deg, ${brand.accentColor}, ${system.secondaryAccent})`, height: "200px" }} />
      <div>
        <motion.blockquote variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
          className="text-2xl md:text-4xl lg:text-5xl font-medium leading-snug text-white tracking-tight"
          style={{ fontWeight: system.headingWeight === 900 ? 700 : system.headingWeight }}>
          &ldquo;{slide.quote?.text}&rdquo;
        </motion.blockquote>
        {slide.quote?.attribution && (
          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={1}
            className="text-base mt-8 font-semibold"
            style={{ color: brand.accentColor, textTransform: system.labelTransform, letterSpacing: system.labelTracking }}>
            — {slide.quote.attribution}
          </motion.p>
        )}
      </div>
    </div>
  );
}

// --- TIMELINE ---
function TimelineSlide({ slide, textClass, mutedClass, brand, system }: SlideTypeProps) {
  const { accentRgb } = system;
  return (
    <div className="max-w-5xl w-full">
      {slide.title && (
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
          className={`text-3xl md:text-5xl tracking-tight mb-16 ${textClass}`}
          style={{ fontWeight: system.headingWeight, textTransform: system.headingTransform, letterSpacing: system.headingTracking }}>
          {slide.title}
        </motion.h2>
      )}
      <div className="relative">
        <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-6 left-0 right-0 h-[2px] origin-left hidden md:block"
          style={{ background: `linear-gradient(90deg, ${brand.accentColor}30, ${system.secondaryAccent}30)` }} />
        <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-[7px] top-2 bottom-2 w-[2px] origin-top md:hidden"
          style={{ backgroundColor: `${brand.accentColor}30` }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-6">
          {slide.timelineItems?.map((item, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible"
              viewport={{ once: true, amount: 0.3 }} custom={i + 1}
              className="relative flex md:flex-col items-start gap-4 md:gap-0">
              <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
                transition={{ delay: (i + 1) * 0.15, type: "spring", stiffness: 300 }}
                className="w-3 h-3 rounded-full shrink-0 z-10 relative md:mb-6"
                style={{ backgroundColor: brand.accentColor, boxShadow: `0 0 12px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.4)` }} />
              <div>
                <span className="text-xs font-bold mb-1 block"
                  style={{ color: brand.accentColor, textTransform: system.labelTransform, letterSpacing: system.labelTracking }}>
                  Step {String(i + 1).padStart(2, "0")}
                </span>
                <p className={`text-lg font-bold ${textClass}`}>{item.label}</p>
                <p className={`text-sm mt-1 ${mutedClass}`}>{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- SECTION BREAK ---
function SectionBreakSlide({ slide, textClass, mutedClass, brand, system }: SlideTypeProps) {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="mb-10 origin-center mx-auto">
        <div className="w-20 h-1 rounded-full mx-auto" style={{ background: `linear-gradient(90deg, ${brand.accentColor}, ${system.secondaryAccent})` }} />
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 50, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className={`text-4xl md:text-6xl lg:text-8xl tracking-tight ${textClass}`}
        style={{ fontWeight: system.headingWeight, textTransform: system.headingTransform, letterSpacing: system.headingTracking }}>
        <AccentText text={slide.title || ""} accentWords={slide.accentWords} accentColor={brand.accentColor}
          secondaryAccent={system.secondaryAccent} isAccentBg={slide.backgroundVariant === "accent"} useGradient={true} />
      </motion.h2>
      {slide.subtitle && (
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={2}
          className={`text-lg md:text-xl mt-6 ${mutedClass}`}>{slide.subtitle}</motion.p>
      )}
    </div>
  );
}

// --- CTA ---
function CtaSlide({ slide, textClass, mutedClass, brand, system }: SlideTypeProps) {
  const { accentRgb } = system;
  return (
    <div className="max-w-3xl mx-auto text-center">
      <motion.h2 initial={{ opacity: 0, y: 50, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
        className="mt-12">
        <motion.div
          whileHover={{ scale: 1.05, boxShadow: `0 12px 40px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.4)` }}
          whileTap={{ scale: 0.98 }}
          className="inline-block px-10 py-4 rounded-md text-white font-semibold text-lg cursor-pointer"
          style={{ background: `linear-gradient(135deg, ${brand.accentColor}, ${system.secondaryAccent})`, boxShadow: `0 8px 30px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.3)` }}>
          Get in Touch
        </motion.div>
      </motion.div>
    </div>
  );
}

// --- IMAGE ---
function ImageSlide({ slide, textClass, mutedClass, brand, system }: SlideTypeProps) {
  return (
    <div className="max-w-5xl w-full flex flex-col lg:flex-row items-center gap-12">
      {slide.imageUrl && (
        <motion.div initial={{ opacity: 0, scale: 0.9, x: -30 }} whileInView={{ opacity: 1, scale: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 w-full lg:w-auto">
          <div className="relative rounded-lg overflow-hidden shadow-2xl">
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
  const isLight = slide.backgroundVariant === "light";
  return (
    <div className="max-w-5xl w-full">
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
                  <th key={i} className={`text-left text-xs font-semibold px-5 py-4 border-b ${system.isDarkBrand ? "border-white/10" : "border-zinc-200"}`}
                    style={{ color: brand.accentColor, textTransform: system.labelTransform, letterSpacing: system.labelTracking }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slide.tableData.rows.map((row, rowIdx) => (
                <motion.tr key={rowIdx} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: (rowIdx + 2) * 0.08 }}
                  className={`border-b ${system.isDarkBrand ? "border-white/5" : "border-zinc-100"}`}
                  style={{ backgroundColor: rowIdx % 2 === 0 ? (isLight ? "rgba(0,0,0,0.015)" : "rgba(255,255,255,0.015)") : "transparent" }}>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className={`px-5 py-4 ${cellIdx === 0 ? `text-sm font-medium ${textClass}` : `text-lg font-bold ${textClass}`}`}>
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
    <div className="max-w-5xl mx-auto text-center">
      {slide.subtitle && (
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={0}
          className="text-sm font-semibold mb-8"
          style={{ color: brand.accentColor, textTransform: system.labelTransform, letterSpacing: system.labelTracking }}>
          {slide.subtitle}
        </motion.p>
      )}
      <motion.h2 initial={{ opacity: 0, y: 50, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className={`text-4xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1] ${textClass}`}
        style={{ fontWeight: system.headingWeight, textTransform: system.headingTransform, letterSpacing: system.headingTracking }}>
        <AccentText text={slide.title || ""} accentWords={slide.accentWords} accentColor={brand.accentColor}
          secondaryAccent={system.secondaryAccent} isAccentBg={slide.backgroundVariant === "accent"} useGradient={true} />
      </motion.h2>
      {slide.body && (
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={2}
          className={`text-lg md:text-xl mt-8 max-w-2xl mx-auto leading-relaxed ${mutedClass}`}>{slide.body}</motion.p>
      )}
    </div>
  );
}
