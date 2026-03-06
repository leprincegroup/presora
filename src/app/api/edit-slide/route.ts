import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { BrandAnalysis, SlideData } from "../../types";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const {
      slide,
      slideIndex,
      totalSlides,
      feedback,
      presentationTitle,
      brand,
    }: {
      slide: SlideData;
      slideIndex: number;
      totalSlides: number;
      feedback: string;
      presentationTitle: string;
      brand: BrandAnalysis;
    } = await req.json();

    if (!feedback?.trim()) {
      return NextResponse.json(
        { error: "Feedback is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a world-class presentation designer. You will edit a single slide based on user feedback. Return ONLY valid JSON — no markdown, no explanation.

BRAND: primary=${brand.primaryColor} secondary=${brand.secondaryColor} accent=${brand.accentColor} bg=${brand.backgroundColor} text=${brand.textColor} font=${brand.fontStyle} tone=${brand.tone}

SLIDE TYPES available:
- hero: title, subtitle?, body?, accentWords?:string[], backgroundVariant
- content: title, body?, bullets?:string[], accentWords?:string[], backgroundVariant
- stats: title, stats:[{value,label,description?}], backgroundVariant
- features: title, features:[{title,description,color?}], backgroundVariant
- comparison: title, columns:[{title,items:string[]}], backgroundVariant
- timeline: title, timelineItems:[{label,description}], backgroundVariant
- quote: quote:{text,attribution}, backgroundVariant
- section-break: title, subtitle?, accentWords?:string[], backgroundVariant
- cta: title, subtitle?, body?, backgroundVariant
- image: title?, body?, accentWords?:string[], backgroundVariant
- table: title, tableData:{headers:string[],rows:string[][]}, accentWords?:string[], backgroundVariant
- big-statement: title, subtitle?, body?, accentWords?:string[], backgroundVariant

backgroundVariant: "primary"|"dark"|"gradient"|"light"|"accent"
accentWords: words from the title to highlight in accent color

Return a single slide JSON object (not wrapped in an array). You may change the slide type if the feedback requires it.`;

    const userPrompt = `Presentation: "${presentationTitle}"
Slide ${slideIndex + 1} of ${totalSlides}

CURRENT SLIDE:
${JSON.stringify(slide, null, 2)}

USER FEEDBACK:
${feedback}

Return the updated slide as a single JSON object.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to parse edit response:", text);
      return NextResponse.json(
        { error: "Failed to edit slide" },
        { status: 500 }
      );
    }

    const updatedSlide = JSON.parse(jsonMatch[0]);

    if (!updatedSlide.type) {
      return NextResponse.json(
        { error: "Invalid slide format received" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedSlide);
  } catch (error) {
    console.error("Edit slide error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to edit slide",
      },
      { status: 500 }
    );
  }
}
