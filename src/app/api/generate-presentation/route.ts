import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { BrandAnalysis, BriefData } from "../../types";

const client = new Anthropic();

function buildBrandRules(brand: BrandAnalysis): string {
  const lines: string[] = [
    `Background: ${brand.backgroundColor}`,
    `Primary: ${brand.primaryColor}`,
    `Secondary: ${brand.secondaryColor}`,
    `Accent: ${brand.accentColor} — use for emphasis, highlights, CTAs`,
    `Text: ${brand.textColor}`,
  ];
  if (brand.textMutedColor) lines.push(`Muted text: ${brand.textMutedColor}`);
  if (brand.headingFont) lines.push(`Heading font: ${brand.headingFont}${brand.headingWeight ? `, weight ${brand.headingWeight}` : ""}${brand.headingTracking ? `, tracking ${brand.headingTracking}` : ""}`);
  if (brand.bodyFont) lines.push(`Body font: ${brand.bodyFont}`);
  if (brand.fontCharacter) lines.push(`Font character: ${brand.fontCharacter}`);
  lines.push(`Font style: ${brand.fontStyle}`);
  if (brand.borderRadius) lines.push(`Border radius: ${brand.borderRadius}`);
  if (brand.spacing) lines.push(`Spacing: ${brand.spacing}`);
  if (brand.layout) lines.push(`Layout: ${brand.layout}`);
  if (brand.mood?.length) lines.push(`Mood: ${brand.mood.join(", ")}`);
  if (brand.avoids?.length) lines.push(`AVOID: ${brand.avoids.join(", ")}`);
  lines.push(`Tone: ${brand.tone}`);
  return lines.join("\n");
}

function buildSystemPrompt(brand: BrandAnalysis): string {
  return `You are a world-class presentation designer. Return ONLY valid JSON — no markdown, no explanation.

BRAND SYSTEM (follow exactly):
${buildBrandRules(brand)}

JSON SCHEMA: {"title":"string","slides":[SlideObject]}

SLIDE TYPES (use "type" field):
- hero: title, subtitle?, body?, accentWords?:string[], backgroundVariant
- content: title, body?, bullets?:string[], accentWords?:string[], backgroundVariant
- stats: title, stats:[{value,label,description?,icon?}], backgroundVariant
- features: title, features:[{title,description,color?,icon}], backgroundVariant (color: optional hex for bold colored cards)
- comparison: title, columns:[{title,items:string[]}], backgroundVariant
- timeline: title, timelineItems:[{label,description}], backgroundVariant
- quote: quote:{text,attribution}, backgroundVariant
- section-break: title, subtitle?, accentWords?:string[], backgroundVariant
- cta: title, subtitle?, body?, backgroundVariant
- image: title?, body?, accentWords?:string[], backgroundVariant (use when user provides images)
- table: title, tableData:{headers:string[],rows:string[][]}, accentWords?:string[], backgroundVariant (for structured data, comparisons, metrics)
- big-statement: title, subtitle?, body?, accentWords?:string[], backgroundVariant (bold centered statement with colored keywords)

backgroundVariant: "primary"|"dark"|"gradient"|"light"|"accent". Use gradient for hero/section-break/cta. Use accent sparingly for bold colored slides.

accentWords: array of words/phrases from the title that should be highlighted in the brand accent color. Use this to create visual emphasis like "Making athletic sports items look sexy" where "sports items" and "sexy" are accent-colored.

ICON SYSTEM — CRITICAL for features and stats:
The "icon" field on features and stats maps to Lucide icon names. Pick icons that PRECISELY match the content context. Examples:
- Boxing/fighting: "swords", "shield", "trophy", "flame"
- Money/revenue: "dollar-sign", "trending-up", "wallet", "coins"
- Users/audience: "users", "eye", "user-check", "megaphone"
- Technology/digital: "monitor", "smartphone", "wifi", "cpu"
- Social media: "share-2", "heart", "message-circle", "at-sign"
- Content/media: "play", "film", "camera", "tv"
- Growth/analytics: "bar-chart-3", "trending-up", "target", "pie-chart"
- Time/schedule: "clock", "calendar", "timer", "hourglass"
- Location/venue: "map-pin", "building", "flag", "compass"
- Communication: "mail", "phone", "send", "message-square"
- Security/trust: "shield-check", "lock", "check-circle", "award"
- Branding/design: "palette", "pen-tool", "layers", "sparkles"
- Shopping/commerce: "shopping-cart", "tag", "credit-card", "package"
- Sports/fitness: "dumbbell", "medal", "timer", "zap"
- Food/restaurant: "utensils", "chef-hat", "coffee", "wine"
- Travel: "plane", "globe", "map", "navigation"
- Healthcare: "heart-pulse", "stethoscope", "pill", "activity"
- Education: "graduation-cap", "book-open", "brain", "lightbulb"
ALWAYS choose icons that reflect the actual content of each feature/stat — never use generic icons. Think about what visual would best represent each specific item.

RULES: Start hero, end cta. Vary types — no consecutive repeats. Use section-break between topics. Headlines <8 words, bullets <12 words. Stats: big impactful numbers. Features: 3-6 items with contextual icons. Comparison: 2-3 columns. Use table for structured data/metrics. Use big-statement for impactful one-liners with accentWords. Use accentWords on at least 3-4 slides for visual variety. Match the brand's mood and tone exactly — if the brand is minimal, be minimal. If bold, be bold.`;
}

export async function POST(req: NextRequest) {
  try {
    const { brief, brand }: { brief: BriefData; brand: BrandAnalysis } =
      await req.json();

    if (!brief?.topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    // Detect if brief contains extracted slide content (from PPTX/PDF upload)
    const isRedesign = brief.description?.includes("--- Slide ");

    const lengthGuide = brief.length === "short" ? "6-8" : brief.length === "extensive" ? "14-18" : "10-12";

    const imageCount = brief.images?.length || 0;
    const imageNote = imageCount > 0
      ? `\n\nThe user has uploaded ${imageCount} image(s). Include at least ${imageCount} "image" type slides spread throughout the presentation to showcase them. Also use hero and content slides with images where appropriate.`
      : "";

    const userPrompt = isRedesign
      ? `REDESIGN this uploaded presentation into better slide types.

Title: "${brief.topic}"
${brief.audience ? `Target audience: ${brief.audience}` : ""}

ORIGINAL CONTENT (extracted from uploaded file):

${brief.description}

CRITICAL RULES:
- USE THE ORIGINAL TEXT. Keep the same titles, headings, data points, numbers, names, and wording from the source.
- You may shorten or tighten sentences for slide format, but do NOT invent new content or replace the original messaging.
- Every piece of information from the original MUST appear in the output — do not drop slides or data.
- Choose the best slide type for each piece of content (stats for numbers, features for lists, etc.)
- You may reorder slides for better narrative flow and add a hero + cta slide.
- Generate ${lengthGuide} slides (use your judgment for the right count).${imageNote}`
      : `Create a presentation about: "${brief.topic}"

${brief.description ? `Content direction from the user (use this as the basis for slide content — respect the user's wording and intent):\n${brief.description}` : ""}
${brief.audience ? `Target audience: ${brief.audience}` : ""}

Generate ${lengthGuide} slides. Use your judgment for the exact count. Make it compelling and visually diverse.${imageNote}`;

    // Strip base64 data (logo, font) before sending to API — keep design system fields
    const cleanBrand: Partial<BrandAnalysis> = {
      primaryColor: brand.primaryColor,
      secondaryColor: brand.secondaryColor,
      accentColor: brand.accentColor,
      backgroundColor: brand.backgroundColor,
      textColor: brand.textColor,
      fontStyle: brand.fontStyle,
      tone: brand.tone,
      // Extended design system
      ...(brand.textMutedColor && { textMutedColor: brand.textMutedColor }),
      ...(brand.headingFont && { headingFont: brand.headingFont }),
      ...(brand.bodyFont && { bodyFont: brand.bodyFont }),
      ...(brand.headingWeight && { headingWeight: brand.headingWeight }),
      ...(brand.headingTracking && { headingTracking: brand.headingTracking }),
      ...(brand.fontCharacter && { fontCharacter: brand.fontCharacter }),
      ...(brand.borderRadius && { borderRadius: brand.borderRadius }),
      ...(brand.spacing && { spacing: brand.spacing }),
      ...(brand.layout && { layout: brand.layout }),
      ...(brand.mood && { mood: brand.mood }),
      ...(brand.avoids && { avoids: brand.avoids }),
    };

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: buildSystemPrompt(cleanBrand as BrandAnalysis),
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to parse response:", text);
      return NextResponse.json(
        { error: "Failed to generate presentation content" },
        { status: 500 }
      );
    }

    const presentation = JSON.parse(jsonMatch[0]);

    if (!presentation.title || !Array.isArray(presentation.slides)) {
      return NextResponse.json(
        { error: "Invalid presentation format received" },
        { status: 500 }
      );
    }

    return NextResponse.json(presentation);
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate presentation",
      },
      { status: 500 }
    );
  }
}
