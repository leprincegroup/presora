"use client";

import { useState } from "react";
import { Presentation } from "../types";
import { Download, Check, Loader2 } from "lucide-react";

interface ExportButtonProps {
  presentation: Presentation;
}

export function ExportButton({ presentation }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const html = generateHTML(presentation);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${presentation.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg"
    >
      {done ? (
        <>
          <Check className="w-4 h-4" />
          Exported
        </>
      ) : exporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Export HTML
        </>
      )}
    </button>
  );
}

function generateHTML(presentation: Presentation): string {
  const { brand, slides, title } = presentation;

  const slidesHtml = slides
    .map((slide, index) => {
      const bgStyle = getSlideBackground(slide.backgroundVariant, brand);
      const isLight = slide.backgroundVariant === "light";
      const textColor = isLight ? "#0a0a0a" : "#ffffff";
      const mutedColor = isLight ? "#71717a" : "rgba(255,255,255,0.6)";
      const borderColor = isLight
        ? "rgba(0,0,0,0.1)"
        : "rgba(255,255,255,0.1)";

      let content = "";

      switch (slide.type) {
        case "hero":
          content = `
            ${slide.subtitle ? `<p class="hero-subtitle" style="color:${mutedColor}">${esc(slide.subtitle)}</p>` : ""}
            <h1 class="hero-title" style="color:${textColor}">${esc(slide.title || "")}</h1>
            ${slide.body ? `<p class="hero-body" style="color:${mutedColor}">${esc(slide.body)}</p>` : ""}
            <div class="accent-bar" style="background:${brand.accentColor}"></div>`;
          break;

        case "content":
          content = `
            <h2 class="slide-title" style="color:${textColor}">${esc(slide.title || "")}</h2>
            ${slide.body ? `<p class="slide-body" style="color:${mutedColor}">${esc(slide.body)}</p>` : ""}
            ${
              slide.bullets
                ? `<ul class="bullets">${slide.bullets
                    .map(
                      (b) =>
                        `<li style="color:${textColor}"><span class="bullet-dot" style="background:${brand.accentColor}"></span>${esc(b)}</li>`
                    )
                    .join("")}</ul>`
                : ""
            }`;
          break;

        case "stats":
          content = `
            ${slide.title ? `<h2 class="slide-title" style="color:${textColor}">${esc(slide.title)}</h2>` : ""}
            <div class="stats-grid stats-${slide.stats?.length || 2}">
              ${(slide.stats || [])
                .map(
                  (s) => `
                <div class="stat">
                  <div class="stat-value" style="color:${brand.accentColor}">${esc(s.value)}</div>
                  <div class="stat-label" style="color:${textColor}">${esc(s.label)}</div>
                  ${s.description ? `<div class="stat-desc" style="color:${mutedColor}">${esc(s.description)}</div>` : ""}
                </div>`
                )
                .join("")}
            </div>`;
          break;

        case "features":
          content = `
            ${slide.title ? `<h2 class="slide-title" style="color:${textColor}">${esc(slide.title)}</h2>` : ""}
            <div class="features-grid features-${Math.min(slide.features?.length || 3, 3)}">
              ${(slide.features || [])
                .map(
                  (f) => `
                <div class="feature-card" style="border-color:${borderColor}">
                  <div class="feature-dot" style="background:${brand.accentColor}"></div>
                  <h3 style="color:${textColor}">${esc(f.title)}</h3>
                  <p style="color:${mutedColor}">${esc(f.description)}</p>
                </div>`
                )
                .join("")}
            </div>`;
          break;

        case "comparison":
          content = `
            ${slide.title ? `<h2 class="slide-title" style="color:${textColor}">${esc(slide.title)}</h2>` : ""}
            <div class="columns-grid columns-${slide.columns?.length || 2}">
              ${(slide.columns || [])
                .map(
                  (col, ci) => `
                <div class="column-card${ci === (slide.columns?.length || 0) - 1 ? " featured" : ""}" style="border-color:${ci === (slide.columns?.length || 0) - 1 ? brand.accentColor + "60" : borderColor}">
                  <h3 style="color:${ci === (slide.columns?.length || 0) - 1 ? brand.accentColor : textColor}">${esc(col.title)}</h3>
                  <ul>${col.items.map((item) => `<li style="color:${mutedColor}"><span class="bullet-dot" style="background:${brand.accentColor}"></span>${esc(item)}</li>`).join("")}</ul>
                </div>`
                )
                .join("")}
            </div>`;
          break;

        case "quote":
          content = `
            <div class="quote-mark" style="color:${brand.accentColor}40">&ldquo;</div>
            <blockquote style="color:${textColor}">${esc(slide.quote?.text || "")}</blockquote>
            ${slide.quote?.attribution ? `<p class="attribution" style="color:${mutedColor}">&mdash; ${esc(slide.quote.attribution)}</p>` : ""}`;
          break;

        case "timeline":
          content = `
            ${slide.title ? `<h2 class="slide-title" style="color:${textColor}">${esc(slide.title)}</h2>` : ""}
            <div class="timeline">
              <div class="timeline-line" style="background:${brand.accentColor}30"></div>
              ${(slide.timelineItems || [])
                .map(
                  (item) => `
                <div class="timeline-item">
                  <div class="timeline-dot" style="background:${brand.accentColor}"></div>
                  <div>
                    <div class="timeline-label" style="color:${textColor}">${esc(item.label)}</div>
                    <div class="timeline-desc" style="color:${mutedColor}">${esc(item.description)}</div>
                  </div>
                </div>`
                )
                .join("")}
            </div>`;
          break;

        case "section-break":
          content = `
            <div class="accent-bar center" style="background:${brand.accentColor}"></div>
            <h2 class="section-title" style="color:${textColor}">${esc(slide.title || "")}</h2>
            ${slide.subtitle ? `<p class="section-subtitle" style="color:${mutedColor}">${esc(slide.subtitle)}</p>` : ""}`;
          break;

        case "cta":
          content = `
            <h2 class="cta-title" style="color:${textColor}">${esc(slide.title || "")}</h2>
            ${slide.subtitle ? `<p class="cta-subtitle" style="color:${mutedColor}">${esc(slide.subtitle)}</p>` : ""}
            ${slide.body ? `<p class="cta-body" style="color:${mutedColor}">${esc(slide.body)}</p>` : ""}
            <div class="cta-button" style="background:${brand.accentColor};color:white">Get in Touch</div>`;
          break;

        case "image":
          content = `
            <div class="image-slide" style="display:flex;align-items:center;gap:3rem">
              ${slide.imageUrl ? `<div style="flex:1"><img src="${esc(slide.imageUrl)}" alt="" style="width:100%;height:auto;border-radius:0.5rem;object-fit:cover;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25)"/></div>` : ""}
              <div style="flex:1">
                ${slide.title ? `<h2 class="slide-title" style="color:${textColor}">${esc(slide.title)}</h2>` : ""}
                ${slide.body ? `<p class="slide-body" style="color:${mutedColor}">${esc(slide.body)}</p>` : ""}
              </div>
            </div>`;
          break;

        case "table":
          content = `
            ${slide.title ? `<h2 class="slide-title" style="color:${textColor}">${esc(slide.title)}</h2>` : ""}
            ${slide.tableData ? `
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr>${slide.tableData.headers.map(h => `<th style="text-align:left;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;padding:1rem 1.25rem;border-bottom:1px solid ${borderColor};color:${mutedColor}">${esc(h)}</th>`).join("")}</tr>
              </thead>
              <tbody>
                ${slide.tableData.rows.map((row, ri) => `<tr style="border-bottom:1px solid ${borderColor};${ri % 2 === 0 ? `background:rgba(255,255,255,0.02)` : ""}">${row.map((cell, ci) => `<td style="padding:1rem 1.25rem;${ci === 0 ? `font-size:0.875rem;font-weight:500;color:${textColor}` : `font-size:1.125rem;font-weight:700;color:${textColor}`}">${esc(cell)}</td>`).join("")}</tr>`).join("")}
              </tbody>
            </table>` : ""}`;
          break;

        case "big-statement":
          content = `
            ${slide.subtitle ? `<p class="hero-subtitle" style="color:${mutedColor};text-align:center">${esc(slide.subtitle)}</p>` : ""}
            <h2 class="section-title" style="color:${textColor};text-align:center">${esc(slide.title || "")}</h2>
            ${slide.body ? `<p style="color:${mutedColor};text-align:center;font-size:1.25rem;margin-top:2rem;max-width:640px;margin-left:auto;margin-right:auto">${esc(slide.body)}</p>` : ""}`;
          break;
      }

      return `<section class="slide animate-slide" style="${bgStyle}">
        <div class="slide-number" style="color:${mutedColor}">${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}</div>
        <div class="slide-content${slide.type === "quote" || slide.type === "section-break" || slide.type === "cta" ? " center" : ""}">
          ${content}
        </div>
      </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;scroll-snap-type:y mandatory}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;background:${brand.backgroundColor};overflow-x:hidden}
.slide{min-height:100vh;width:100%;scroll-snap-align:start;position:relative;overflow:hidden;display:flex;align-items:center}
.slide-content{position:relative;z-index:1;width:100%;max-width:1200px;padding:5rem 4rem}
.slide-content.center{text-align:center;margin:0 auto;max-width:900px}
.slide-number{position:absolute;top:2rem;right:2rem;font-size:0.75rem;font-family:monospace;z-index:2}
.hero-subtitle{font-size:0.875rem;font-weight:500;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:1.5rem}
.hero-title{font-size:clamp(2.5rem,8vw,5rem);font-weight:800;line-height:0.95;letter-spacing:-0.02em}
.hero-body{font-size:clamp(1rem,2vw,1.25rem);margin-top:2rem;max-width:640px;line-height:1.6}
.accent-bar{width:4rem;height:4px;border-radius:2px;margin-top:2rem}
.accent-bar.center{margin:0 auto 1.5rem}
.slide-title{font-size:clamp(1.75rem,5vw,3rem);font-weight:700;letter-spacing:-0.02em;margin-bottom:2rem}
.slide-body{font-size:1rem;line-height:1.7;max-width:640px;margin-bottom:2rem}
.bullets{list-style:none;max-width:640px}
.bullets li{display:flex;align-items:flex-start;gap:1rem;padding:0.5rem 0;font-size:1rem}
.bullet-dot{width:0.5rem;height:0.5rem;border-radius:50%;flex-shrink:0;margin-top:0.5rem;display:inline-block}
.stats-grid{display:grid;gap:2rem;margin-top:1rem}
.stats-2{grid-template-columns:repeat(2,1fr)}
.stats-3{grid-template-columns:repeat(3,1fr)}
.stats-4{grid-template-columns:repeat(4,1fr)}
.stat-value{font-size:clamp(2rem,5vw,3.5rem);font-weight:700;letter-spacing:-0.02em}
.stat-label{font-size:1rem;font-weight:500;margin-top:0.25rem}
.stat-desc{font-size:0.875rem;margin-top:0.25rem}
.features-grid{display:grid;gap:1.5rem;margin-top:1rem}
.features-2{grid-template-columns:repeat(2,1fr)}
.features-3{grid-template-columns:repeat(3,1fr)}
.feature-card{padding:1.5rem;border-radius:1rem;border:1px solid;background:rgba(255,255,255,0.05)}
.feature-dot{width:0.75rem;height:0.75rem;border-radius:50%;margin-bottom:1rem}
.feature-card h3{font-size:1.125rem;font-weight:600;margin-bottom:0.5rem}
.feature-card p{font-size:0.875rem;line-height:1.6}
.columns-grid{display:grid;gap:1.5rem;margin-top:1rem}
.columns-2{grid-template-columns:repeat(2,1fr)}
.columns-3{grid-template-columns:repeat(3,1fr)}
.column-card{padding:1.5rem;border-radius:1rem;border:1px solid;background:rgba(255,255,255,0.05)}
.column-card.featured{background:rgba(255,255,255,0.1)}
.column-card h3{font-size:1.25rem;font-weight:700;margin-bottom:1.5rem}
.column-card ul{list-style:none}
.column-card li{display:flex;align-items:flex-start;gap:0.75rem;padding:0.375rem 0;font-size:0.875rem}
.quote-mark{font-size:6rem;line-height:1;margin-bottom:1rem;font-family:Georgia,serif}
blockquote{font-size:clamp(1.5rem,4vw,2.5rem);font-weight:500;line-height:1.3;font-style:italic}
.attribution{margin-top:2rem;font-size:1rem}
.timeline{position:relative;padding-left:2rem}
.timeline-line{position:absolute;left:7px;top:0.5rem;bottom:0.5rem;width:2px}
.timeline-item{display:flex;align-items:flex-start;gap:1.5rem;padding-bottom:2.5rem;position:relative}
.timeline-dot{width:1rem;height:1rem;border-radius:50%;flex-shrink:0;margin-top:0.25rem;position:relative;z-index:1}
.timeline-label{font-size:1.125rem;font-weight:600}
.timeline-desc{font-size:0.875rem;margin-top:0.25rem}
.section-title{font-size:clamp(2.5rem,7vw,4.5rem);font-weight:700;letter-spacing:-0.02em}
.section-subtitle{font-size:1.25rem;margin-top:1.5rem}
.cta-title{font-size:clamp(2.5rem,7vw,4.5rem);font-weight:700;letter-spacing:-0.02em}
.cta-subtitle{font-size:1.25rem;margin-top:1.5rem}
.cta-body{font-size:1rem;margin-top:2rem;font-family:monospace}
.cta-button{display:inline-block;padding:1rem 2rem;border-radius:0.75rem;font-weight:600;font-size:1.125rem;margin-top:2.5rem}
@keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
.animate-slide .slide-content>*{opacity:0;animation:fadeInUp 0.6s ease forwards}
.animate-slide .slide-content>*:nth-child(1){animation-delay:0.1s}
.animate-slide .slide-content>*:nth-child(2){animation-delay:0.2s}
.animate-slide .slide-content>*:nth-child(3){animation-delay:0.3s}
.animate-slide .slide-content>*:nth-child(4){animation-delay:0.4s}
.animate-slide .slide-content>*:nth-child(5){animation-delay:0.5s}
@media(max-width:768px){
  .slide-content{padding:3rem 2rem}
  .stats-grid,.features-grid,.columns-grid{grid-template-columns:1fr}
  .stats-2,.stats-3,.stats-4,.features-2,.features-3,.columns-2,.columns-3{grid-template-columns:1fr}
}
</style>
</head>
<body>
${slidesHtml}
<script>
document.addEventListener('keydown',e=>{
  const slides=document.querySelectorAll('.slide');
  let current=0;
  slides.forEach((s,i)=>{const r=s.getBoundingClientRect();if(r.top<=window.innerHeight/2&&r.bottom>window.innerHeight/2)current=i;});
  if(e.key==='ArrowDown'||e.key==='ArrowRight'||e.key===' '){e.preventDefault();if(current<slides.length-1)slides[current+1].scrollIntoView({behavior:'smooth'});}
  if(e.key==='ArrowUp'||e.key==='ArrowLeft'){e.preventDefault();if(current>0)slides[current-1].scrollIntoView({behavior:'smooth'});}
});
</script>
</body>
</html>`;
}

function getSlideBackground(
  variant: string | undefined,
  brand: { primaryColor: string; secondaryColor: string; backgroundColor: string; accentColor?: string }
): string {
  switch (variant) {
    case "primary":
      return `background-color:${brand.primaryColor}`;
    case "gradient":
      return `background:linear-gradient(135deg,${brand.primaryColor} 0%,${brand.secondaryColor} 100%)`;
    case "light":
      return "background-color:#f8fafc";
    case "accent":
      return `background-color:${brand.accentColor || brand.primaryColor}`;
    default:
      return `background-color:${brand.backgroundColor}`;
  }
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
