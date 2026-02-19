import { z } from "zod";

export const botTokenSchema = z
  .string()
  .min(1, "Bot token is required")
  .regex(/^\d+:[A-Za-z0-9_-]+$/, "Invalid bot token format");

export const botCommandSchema = z.object({
  command: z.string().min(1).max(32),
  description: z.string().min(1).max(256),
});

export const botMetadataSchema = z.object({
  name: z.string().max(64),
  description: z.string().max(512),
  short_description: z.string().max(120),
  commands: z.array(botCommandSchema),
});

export const validateRequestSchema = z.object({
  bot_token: botTokenSchema,
});

export const metadataRequestSchema = z.object({
  bot_token: botTokenSchema,
  language_code: z.string().optional(),
});

export const saveRequestSchema = z.object({
  bot_token: botTokenSchema,
  metadata: botMetadataSchema,
  language_code: z.string().optional(),
});

export const deleteLocalizationRequestSchema = z.object({
  bot_token: botTokenSchema,
  language_code: z.string().min(1, "Language code is required"),
});

export const translateRequestSchema = z.object({
  openai_api_key: z.string().min(1, "OpenAI API key is required"),
  source_lang: z.string().min(1),
  target_lang: z.string().min(1),
  metadata: botMetadataSchema,
});

export const translationOutputSchema = z.object({
  name: z.string(),
  short_description: z.string(),
  description: z.string(),
  commands: z.array(
    z.object({
      command: z.string(),
      description: z.string(),
    }),
  ),
});
