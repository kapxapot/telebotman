import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { translateRequestSchema, translationOutputSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = translateRequestSchema.parse(body);

    const openai = createOpenAI({ apiKey: parsed.openai_api_key });

    const commandsList = parsed.metadata.commands
      .map((c) => `- ${c.command}: ${c.description}`)
      .join("\n");

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: translationOutputSchema,
      system: [
        "You are a professional translator for Telegram bot metadata.",
        "Translate all text fields accurately while preserving the original tone and intent.",
        "IMPORTANT: Command names (the 'command' field) must NOT be translated - keep them exactly as provided.",
        "Only translate the command descriptions.",
        "Keep the tone professional and concise.",
        "Return strict JSON matching the required schema.",
      ].join(" "),
      prompt: [
        `Base language: ${parsed.source_lang}`,
        `Target language: ${parsed.target_lang}`,
        "",
        `Name: ${parsed.metadata.name}`,
        `Short Description: ${parsed.metadata.short_description}`,
        `Description: ${parsed.metadata.description}`,
        `Commands:`,
        commandsList,
      ].join("\n"),
    });

    return NextResponse.json({ ok: true, metadata: object });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
