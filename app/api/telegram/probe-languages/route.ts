import { validateRequestSchema } from "@/lib/schemas";
import { getDefaultMetadata, getLocalizedMetadata } from "@/lib/telegram";
import { ISO_639_1_LANGUAGES } from "@/lib/languages";
import { runWithConcurrency } from "@/lib/rate-limiter";
import type { BotMetadata } from "@/lib/types";

function metadataDiffers(a: BotMetadata, b: BotMetadata): boolean {
  if (a.name !== b.name) return true;
  if (a.description !== b.description) return true;
  if (a.short_description !== b.short_description) return true;
  if (a.commands.length !== b.commands.length) return true;
  for (let i = 0; i < a.commands.length; i++) {
    if (
      a.commands[i].command !== b.commands[i].command ||
      a.commands[i].description !== b.commands[i].description
    )
      return true;
  }
  return false;
}

function isMetadataEmpty(meta: BotMetadata): boolean {
  return (
    !meta.name &&
    !meta.description &&
    !meta.short_description &&
    meta.commands.length === 0
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = validateRequestSchema.parse(body);
    const token = parsed.bot_token;

    const defaultMeta = await getDefaultMetadata(token);
    const total = ISO_639_1_LANGUAGES.length;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(data)}\n`));
        };

        send({ type: "start", total });

        const tasks = ISO_639_1_LANGUAGES.map((lang) => ({
          key: lang.code,
          fn: () => getLocalizedMetadata(token, lang.code),
        }));

        const configuredLanguages: string[] = [];

        const results = await runWithConcurrency(
          tasks,
          20,
          3,
          (checked, t) => {
            send({ type: "progress", checked, total: t });
          },
        );

        for (const result of results) {
          if (
            result.value &&
            !isMetadataEmpty(result.value) &&
            metadataDiffers(defaultMeta, result.value)
          ) {
            configuredLanguages.push(result.key);
          }
        }

        send({ type: "done", configuredLanguages });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to probe languages";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
