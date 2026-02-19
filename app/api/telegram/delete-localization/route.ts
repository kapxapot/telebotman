import { NextResponse } from "next/server";
import { deleteLocalizationRequestSchema } from "@/lib/schemas";
import { deleteLocalization } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = deleteLocalizationRequestSchema.parse(body);

    const results = await deleteLocalization(
      parsed.bot_token,
      parsed.language_code,
    );

    const allOk = results.every((r) => r.ok);
    return NextResponse.json(
      { ok: allOk, results },
      { status: allOk ? 200 : 207 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete localization";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
