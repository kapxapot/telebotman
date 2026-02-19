import { NextResponse } from "next/server";
import { saveRequestSchema } from "@/lib/schemas";
import { saveMetadata } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = saveRequestSchema.parse(body);

    const results = await saveMetadata(
      parsed.bot_token,
      parsed.metadata,
      parsed.language_code,
    );

    const allOk = results.every((r) => r.ok);
    return NextResponse.json(
      { ok: allOk, results },
      { status: allOk ? 200 : 207 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save metadata";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
