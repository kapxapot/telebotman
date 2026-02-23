import { NextResponse } from "next/server";
import sharp from "sharp";
import { botTokenSchema } from "@/lib/schemas";
import { uploadProfilePhoto } from "@/lib/telegram";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const rawToken = formData.get("bot_token");
    const token = botTokenSchema.parse(rawToken);

    const file = formData.get("photo");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "No photo file provided" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Only JPEG and PNG images are allowed" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: "File size must be under 5 MB" },
        { status: 400 },
      );
    }

    const rawBuffer = await file.arrayBuffer();
    const processed = await sharp(Buffer.from(rawBuffer))
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .png()
      .toBuffer();

    const arrayBuffer = processed.buffer.slice(
      processed.byteOffset,
      processed.byteOffset + processed.byteLength,
    ) as ArrayBuffer;
    await uploadProfilePhoto(token, arrayBuffer, file.name, "image/png");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[upload-photo]", err);
    const message =
      err instanceof Error ? err.message : "Failed to upload photo";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
