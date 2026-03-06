import Anthropic from "@anthropic-ai/sdk";
import JSZip from "jszip";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { file, fileName } = await req.json();

    if (!file || !fileName) {
      return NextResponse.json(
        { error: "File and filename are required" },
        { status: 400 }
      );
    }

    const ext = fileName.toLowerCase().split(".").pop();

    if (ext === "pptx") {
      const content = await extractFromPptx(file);
      return NextResponse.json({ content });
    } else if (ext === "pdf") {
      const content = await extractFromPdf(file);
      return NextResponse.json({ content });
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Use PPTX or PDF." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Content extraction error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract content",
      },
      { status: 500 }
    );
  }
}

async function extractFromPptx(base64Data: string): Promise<string> {
  const buffer = Buffer.from(base64Data, "base64");
  const zip = await JSZip.loadAsync(buffer);

  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
      return numA - numB;
    });

  const slides: string[] = [];

  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async("string");
    const text = extractTextFromXml(xml);
    if (text.trim()) {
      const slideNum = slideFile.match(/slide(\d+)/)?.[1] || "?";
      slides.push(`--- Slide ${slideNum} ---\n${text}`);
    }
  }

  const noteFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/notesSlide(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/notesSlide(\d+)/)?.[1] || "0");
      return numA - numB;
    });

  const notes: string[] = [];
  for (const noteFile of noteFiles) {
    const xml = await zip.files[noteFile].async("string");
    const text = extractTextFromXml(xml);
    if (text.trim()) {
      notes.push(text);
    }
  }

  let result = slides.join("\n\n");
  if (notes.length > 0) {
    result += "\n\n--- Speaker Notes ---\n" + notes.join("\n");
  }

  return result;
}

function extractTextFromXml(xml: string): string {
  const lines: string[] = [];
  const paragraphs = xml.split(/<\/a:p>/);

  for (const para of paragraphs) {
    const texts = para.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
    if (texts) {
      const lineText = texts
        .map((t) => {
          const match = t.match(/<a:t[^>]*>([^<]*)<\/a:t>/);
          return match ? match[1] : "";
        })
        .join("");

      if (lineText.trim()) {
        lines.push(lineText.trim());
      }
    }
  }

  return lines.join("\n");
}

async function extractFromPdf(base64Data: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64Data,
            },
          } as Anthropic.DocumentBlockParam,
          {
            type: "text",
            text: `Extract ALL text content from this presentation/document. Organize it slide-by-slide or section-by-section. Format as:

--- Slide 1 ---
[Title]
[Content]

--- Slide 2 ---
[Title]
[Content]

Include ALL text, numbers, data points, bullet points, and any other content. Be thorough — this content will be used to regenerate the presentation with better design.`,
          },
        ],
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  return text;
}
