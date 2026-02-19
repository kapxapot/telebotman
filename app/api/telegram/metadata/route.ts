import { NextResponse } from "next/server";
import { metadataRequestSchema } from "@/lib/schemas";
import { getDefaultMetadata, getLocalizedMetadata } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = metadataRequestSchema.parse(body);

    const metadata = parsed.language_code
      ? await getLocalizedMetadata(parsed.bot_token, parsed.language_code)
      : await getDefaultMetadata(parsed.bot_token);

    return NextResponse.json({ ok: true, metadata });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch metadata";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
