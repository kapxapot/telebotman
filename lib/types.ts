export interface BotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups: boolean;
}

export interface BotCommand {
  command: string;
  description: string;
}

export interface BotMetadata {
  name: string;
  description: string;
  short_description: string;
  commands: BotCommand[];
}

export interface LanguageMetadata {
  languageCode: string;
  metadata: BotMetadata;
  isConfigured: boolean;
}

export interface TelegramApiResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}
