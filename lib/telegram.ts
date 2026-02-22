import type {
  BotCommand,
  BotInfo,
  BotMetadata,
  TelegramApiResponse,
} from "./types";

const BASE_URL = "https://api.telegram.org/bot";

async function callTelegram<T>(
  token: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const url = `${BASE_URL}${token}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as TelegramApiResponse<T>;

  if (!data.ok) {
    throw new Error(
      data.description ?? `Telegram API error: ${method} (${data.error_code})`,
    );
  }

  return data.result as T;
}

export async function validateToken(token: string): Promise<BotInfo> {
  return callTelegram<BotInfo>(token, "getMe");
}

export async function getDefaultMetadata(
  token: string,
): Promise<BotMetadata> {
  const [nameRes, descRes, shortDescRes, commandsRes] = await Promise.all([
    callTelegram<{ name: string }>(token, "getMyName"),
    callTelegram<{ description: string }>(token, "getMyDescription"),
    callTelegram<{ short_description: string }>(
      token,
      "getMyShortDescription",
    ),
    callTelegram<BotCommand[]>(token, "getMyCommands"),
  ]);

  return {
    name: nameRes.name ?? "",
    description: descRes.description ?? "",
    short_description: shortDescRes.short_description ?? "",
    commands: commandsRes ?? [],
  };
}

export async function getLocalizedMetadata(
  token: string,
  languageCode: string,
): Promise<BotMetadata> {
  const body = { language_code: languageCode };

  const [nameRes, descRes, shortDescRes, commandsRes] = await Promise.all([
    callTelegram<{ name: string }>(token, "getMyName", body),
    callTelegram<{ description: string }>(token, "getMyDescription", body),
    callTelegram<{ short_description: string }>(
      token,
      "getMyShortDescription",
      body,
    ),
    callTelegram<BotCommand[]>(token, "getMyCommands", body),
  ]);

  return {
    name: nameRes.name ?? "",
    description: descRes.description ?? "",
    short_description: shortDescRes.short_description ?? "",
    commands: commandsRes ?? [],
  };
}

export async function saveMetadata(
  token: string,
  metadata: BotMetadata,
  languageCode?: string,
): Promise<{ field: string; ok: boolean; error?: string }[]> {
  const langBody = languageCode ? { language_code: languageCode } : {};

  const results = await Promise.allSettled([
    callTelegram(token, "setMyName", {
      name: metadata.name,
      ...langBody,
    }),
    callTelegram(token, "setMyDescription", {
      description: metadata.description,
      ...langBody,
    }),
    callTelegram(token, "setMyShortDescription", {
      short_description: metadata.short_description,
      ...langBody,
    }),
    callTelegram(token, "setMyCommands", {
      commands: metadata.commands,
      ...langBody,
    }),
  ]);

  const fields = ["name", "description", "short_description", "commands"];
  return results.map((r, i) => ({
    field: fields[i],
    ok: r.status === "fulfilled",
    error: r.status === "rejected" ? (r.reason as Error).message : undefined,
  }));
}

export async function deleteLocalization(
  token: string,
  languageCode: string,
): Promise<{ field: string; ok: boolean; error?: string }[]> {
  const langBody = { language_code: languageCode };

  const results = await Promise.allSettled([
    callTelegram(token, "setMyName", { name: "", ...langBody }),
    callTelegram(token, "setMyDescription", { description: "", ...langBody }),
    callTelegram(token, "setMyShortDescription", {
      short_description: "",
      ...langBody,
    }),
    callTelegram(token, "deleteMyCommands", langBody),
  ]);

  const fields = ["name", "description", "short_description", "commands"];
  return results.map((r, i) => ({
    field: fields[i],
    ok: r.status === "fulfilled",
    error: r.status === "rejected" ? (r.reason as Error).message : undefined,
  }));
}
