import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a world-class brand design system analyst. Analyze the provided visual asset (screenshot, image, or PDF) and extract a PRECISE design system.

LOOK AT THE VISUAL DESIGN — not just data. Study colors, typography weight, spacing, layout patterns, and overall aesthetic.

Return ONLY valid JSON with this exact structure:
{
  "primaryColor": "#hex — the main brand color",
  "secondaryColor": "#hex — secondary/supporting color",
  "accentColor": "#hex — highlight or call-to-action color",
  "backgroundColor": "#hex — page/section background",
  "textColor": "#hex — main text color",
  "textMutedColor": "#hex — secondary/muted text color",
  "fontStyle": "sans-serif" | "serif" | "mono" | "display",
  "headingFont": "font family name (e.g. Inter, Neue Haas Grotesk, GT Walsheim)",
  "bodyFont": "font family name for body text",
  "headingWeight": 700,
  "headingTracking": "-0.02em",
  "fontCharacter": "geometric|humanist|grotesque|neo-grotesque|serif|slab|rounded|display",
  "tone": "2-4 word description (e.g. bold and minimal, warm and elegant)",
  "borderRadius": "CSS value (e.g. 0px, 4px, 8px, 16px, 9999px)",
  "spacing": "tight|airy|generous",
  "layout": "centered|left-aligned|asymmetric",
  "mood": ["word1", "word2", "word3"],
  "avoids": ["things this brand clearly avoids"],
  "logoDescription": "brief description of logo/visual identity"
}

RULES:
- Extract EXACT hex colors from the visual, not approximations
- headingWeight: 100=thin, 300=light, 400=regular, 500=medium, 600=semibold, 700=bold, 800=extrabold, 900=black
- headingTracking: tight=-0.03em, slightly tight=-0.01em, normal=0em, wide=0.05em, very wide=0.12em
- mood: 3 words capturing the emotional feel (e.g. ["confident", "premium", "understated"])
- avoids: what this brand does NOT use (e.g. ["rounded corners", "gradients", "playful colors", "thin fonts"])
- If dark-themed, backgroundColor should be dark. If light, it should be light.
- Be specific about font identification — name real font families when you can recognize them
- All colors MUST be valid 6-character hex codes`;

async function screenshotUrl(url: string): Promise<string | null> {
  // Use thum.io to get a screenshot — zero dependencies, works serverless
  const screenshotEndpoint = `https://image.thum.io/get/width/1440/crop/900/png/noanimate/${url}`;
  try {
    const res = await fetch(screenshotEndpoint, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Presora/1.0)" },
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 1000) return null; // Too small = probably error
    return Buffer.from(buffer).toString("base64");
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url, file, fileName } = await req.json();

    if (!url && !file) {
      return NextResponse.json(
        { error: "Provide either a URL or file" },
        { status: 400 }
      );
    }

    const contentBlocks: Anthropic.MessageCreateParams["messages"][0]["content"] =
      [];

    if (url) {
      // Step 1: Try to get a screenshot for Vision analysis
      const screenshot = await screenshotUrl(url);

      if (screenshot) {
        // Send screenshot to Claude Vision
        contentBlocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: screenshot,
          },
        });
      }

      // Step 2: Also fetch HTML for supplementary data (font names, CSS values)
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; Presora/1.0)",
          },
          signal: AbortSignal.timeout(10000),
        });
        const html = await res.text();
        // Extract CSS-relevant portions (stylesheets, inline styles, meta)
        const cssInfo = extractCssInfo(html);
        contentBlocks.push({
          type: "text",
          text: screenshot
            ? `Analyze this website screenshot and extract the brand design system. URL: ${url}\n\nSupplementary CSS data from the page:\n${cssInfo}`
            : `Analyze this website's brand identity from its HTML. URL: ${url}\n\n${html.substring(0, 8000)}`,
        });
      } catch {
        if (!screenshot) {
          return NextResponse.json(
            { error: "Failed to fetch the website. Check the URL and try again." },
            { status: 400 }
          );
        }
        contentBlocks.push({
          type: "text",
          text: `Analyze this website screenshot and extract the brand design system. URL: ${url}`,
        });
      }
    } else if (file) {
      const isPdf = fileName?.toLowerCase().endsWith(".pdf");
      const isImage = fileName?.toLowerCase().match(/\.(png|jpg|jpeg|webp|gif)$/);

      if (isPdf) {
        contentBlocks.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: file,
          },
        } as Anthropic.DocumentBlockParam);
        contentBlocks.push({
          type: "text",
          text: "Analyze this brand document/deck and extract the complete design system — colors, typography, spacing, layout style, mood, and what the brand avoids.",
        });
      } else if (isImage) {
        const ext = fileName?.toLowerCase().split(".").pop();
        const mediaMap: Record<string, string> = {
          png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
          webp: "image/webp", gif: "image/gif",
        };
        contentBlocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: (mediaMap[ext || "png"] || "image/png") as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
            data: file,
          },
        });
        contentBlocks.push({
          type: "text",
          text: "Analyze this brand asset/screenshot and extract the complete design system — colors, typography, spacing, layout style, mood, and what the brand avoids.",
        });
      } else {
        return NextResponse.json(
          { error: "Unsupported file type. Use PDF, PNG, JPG, or WEBP." },
          { status: 400 }
        );
      }
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: contentBlocks }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse brand analysis" },
        { status: 500 }
      );
    }

    const brand = JSON.parse(jsonMatch[0]);
    return NextResponse.json(brand);
  } catch (error) {
    console.error("Brand analysis error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to analyze brand",
      },
      { status: 500 }
    );
  }
}

// Extract CSS-relevant info from HTML (fonts, colors, key styles)
function extractCssInfo(html: string): string {
  const parts: string[] = [];

  // Extract <style> blocks
  const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (styleMatches) {
    const css = styleMatches.map(m => m.replace(/<\/?style[^>]*>/gi, "")).join("\n");
    // Keep only font and color declarations
    const relevantCss = css
      .split(/[{}]/)
      .filter(block =>
        /font|color|background|--.*color|letter-spacing|border-radius/i.test(block)
      )
      .join("\n")
      .substring(0, 3000);
    if (relevantCss.trim()) parts.push(`Inline CSS:\n${relevantCss}`);
  }

  // Extract Google Fonts links
  const fontLinks = html.match(/fonts\.googleapis\.com[^"'\s]*/g);
  if (fontLinks) parts.push(`Google Fonts: ${fontLinks.join(", ")}`);

  // Extract CSS custom properties from :root
  const rootMatch = html.match(/:root\s*\{([^}]+)\}/);
  if (rootMatch) parts.push(`CSS Variables: ${rootMatch[1].substring(0, 1000)}`);

  // Extract meta theme-color
  const themeColor = html.match(/<meta[^>]*name="theme-color"[^>]*content="([^"]*)"[^>]*>/i);
  if (themeColor) parts.push(`Theme color: ${themeColor[1]}`);

  return parts.join("\n\n").substring(0, 4000) || "No CSS data extracted";
}
