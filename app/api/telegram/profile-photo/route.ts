import { NextResponse } from "next/server";
import { z } from "zod";
import { profilePhotoRequestSchema } from "@/lib/schemas";
import { getProfilePhoto, validateToken } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = profilePhotoRequestSchema.parse(body);

    const bot = await validateToken(parsed.bot_token);
    const photo = await getProfilePhoto(parsed.bot_token, bot.id);

    if (!photo) {
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(photo.buffer, {
      status: 200,
      headers: {
        "Content-Type": photo.contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Invalid request" },
        { status: 400 },
      );
    }
    const message =
      err instanceof Error ? err.message : "Failed to fetch profile photo";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
