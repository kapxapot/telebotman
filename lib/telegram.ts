import type {
  BotCommand,
  BotInfo,
  BotMetadata,
  TelegramApiResponse,
  TelegramFile,
  UserProfilePhotos,
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

async function callTelegramFormData<T>(
  token: string,
  method: string,
  formData: FormData,
): Promise<T> {
  const url = `${BASE_URL}${token}/${method}`;

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`[callTelegramFormData] field="${key}" file="${value.name}" type="${value.type}" size=${value.size}`);
    } else {
      console.log(`[callTelegramFormData] field="${key}" value="${String(value).slice(0, 20)}..."`);
    }
  }

  const res = await fetch(url, { method: "POST", body: formData });
  const data = (await res.json()) as TelegramApiResponse<T>;

  if (!data.ok) {
    console.error(`[callTelegramFormData] ${method} failed:`, data);
    throw new Error(
      data.description ?? `Telegram API error: ${method} (${data.error_code})`,
    );
  }

  return data.result as T;
}

export async function validateToken(token: string): Promise<BotInfo> {
  return callTelegram<BotInfo>(token, "getMe");
}

export async function getProfilePhoto(
  token: string,
  botId: number,
): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  const photos = await callTelegram<UserProfilePhotos>(
    token,
    "getUserProfilePhotos",
    { user_id: botId, limit: 1 },
  );

  if (photos.total_count === 0 || photos.photos.length === 0) {
    return null;
  }

  const sizes = photos.photos[0];
  const largest = sizes[sizes.length - 1];

  const fileInfo = await callTelegram<TelegramFile>(token, "getFile", {
    file_id: largest.file_id,
  });

  if (!fileInfo.file_path) {
    return null;
  }

  const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
  const fileRes = await fetch(fileUrl);

  if (!fileRes.ok) {
    throw new Error(`Failed to download profile photo: ${fileRes.status}`);
  }

  const buffer = await fileRes.arrayBuffer();
  const contentType = fileRes.headers.get("content-type") ?? "image/jpeg";

  return { buffer, contentType };
}

export async function uploadProfilePhoto(
  token: string,
  photoBuffer: ArrayBuffer,
  filename: string,
  contentType: string,
): Promise<void> {
  const file = new File([photoBuffer], filename, { type: contentType });
  const formData = new FormData();
  formData.append("photo_file", file);
  formData.append(
    "photo",
    JSON.stringify({ type: "static", photo: "attach://photo_file" }),
  );
  await callTelegramFormData(token, "setMyProfilePhoto", formData);
}

export async function removeProfilePhoto(token: string): Promise<void> {
  await callTelegram(token, "removeMyProfilePhoto");
}

export async function getDefaultMetadata(token: string): Promise<BotMetadata> {
  const [nameRes, descRes, shortDescRes, commandsRes] = await Promise.all([
    callTelegram<{ name: string }>(token, "getMyName"),
    callTelegram<{ description: string }>(token, "getMyDescription"),
    callTelegram<{ short_description: string }>(token, "getMyShortDescription"),
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
