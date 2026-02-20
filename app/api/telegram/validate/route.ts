import { NextResponse } from "next/server";
import { z } from "zod";
import { validateRequestSchema } from "@/lib/schemas";
import { validateToken } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = validateRequestSchema.parse(body);
    const bot = await validateToken(parsed.bot_token);
    return NextResponse.json({ ok: true, bot });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of err.issues) {
        const field = issue.path.join(".");
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      return NextResponse.json(
        { ok: false, fieldErrors },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
