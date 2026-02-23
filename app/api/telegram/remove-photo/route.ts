import { NextResponse } from "next/server";
import { z } from "zod";
import { profilePhotoRequestSchema } from "@/lib/schemas";
import { removeProfilePhoto } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = profilePhotoRequestSchema.parse(body);

    await removeProfilePhoto(parsed.bot_token);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Invalid request" },
        { status: 400 },
      );
    }
    const message =
      err instanceof Error ? err.message : "Failed to remove photo";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
