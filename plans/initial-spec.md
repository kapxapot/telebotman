# Product Specification

**Project name:** TeleBotMan - Telegram Bot Metadata Manager
**Purpose:** Web application to view, manage, localize, and auto-translate Telegram bot metadata.

---

## 1. Overview

A secure web tool that:

1. Connects to a Telegram bot via Bot Token.
2. Fetches existing metadata (default + localized).
3. Detects configured ISO 639-1 languages.
4. Allows editing of:

   * Name
   * Description
   * Short description
   * Commands
5. Optionally uses OpenAI for automated translations.
6. Pushes updates back to Telegram via official Bot API endpoints.

---

## 2. Technology Stack Requirements

### Frontend

* Next.js (App Router)
* TypeScript
* **shadcn/ui (mandatory)** for all UI components
* Tailwind CSS
* React Hook Form (recommended)

### Backend

* Next.js API routes or server actions
* TypeScript
* No direct Telegram/OpenAI calls from browser

### AI Integration

* **Vercel AI SDK (mandatory)** for all AI-related functionality
* OpenAI provider via Vercel AI SDK
* Structured JSON outputs enforced

### Deployment

* Optimized for Vercel

---

## 3. User Inputs

### Required

* `bot_token`

### Optional

* `openai_api_key`

No persistent storage required in MVP.

---

## 4. Telegram API Integration

All calls must use:

```
https://api.telegram.org/bot<BOT_TOKEN>/<METHOD>
```

---

### 4.1 Validation

#### Validate Token

**Endpoint:**

```
GET https://api.telegram.org/bot<token>/getMe
```

If invalid → show error immediately.

---

### 4.2 Fetch Existing Metadata

#### Get default values

```
POST https://api.telegram.org/bot<token>/getMyName
POST https://api.telegram.org/bot<token>/getMyDescription
POST https://api.telegram.org/bot<token>/getMyShortDescription
POST https://api.telegram.org/bot<token>/getMyCommands
```

---

#### Get localized values

For each ISO 639-1 language:

```
POST https://api.telegram.org/bot<token>/getMyName
Body: { "language_code": "de" }

POST https://api.telegram.org/bot<token>/getMyDescription
Body: { "language_code": "de" }

POST https://api.telegram.org/bot<token>/getMyShortDescription
Body: { "language_code": "de" }

POST https://api.telegram.org/bot<token>/getMyCommands
Body: { "language_code": "de" }
```

If response differs from default → mark language as configured.

---

### 4.3 Save Metadata

#### Default (omit language_code)

```
POST https://api.telegram.org/bot<token>/setMyName
POST https://api.telegram.org/bot<token>/setMyDescription
POST https://api.telegram.org/bot<token>/setMyShortDescription
POST https://api.telegram.org/bot<token>/setMyCommands
```

---

#### Localized

```
POST https://api.telegram.org/bot<token>/setMyName
Body: { "name": "...", "language_code": "de" }

POST https://api.telegram.org/bot<token>/setMyDescription
Body: { "description": "...", "language_code": "de" }

POST https://api.telegram.org/bot<token>/setMyShortDescription
Body: { "short_description": "...", "language_code": "de" }

POST https://api.telegram.org/bot<token>/setMyCommands
Body: {
  "commands": [
    { "command": "start", "description": "..." }
  ],
  "language_code": "de"
}
```

---

### 4.4 Delete Localization

```
POST https://api.telegram.org/bot<token>/deleteMyName
POST https://api.telegram.org/bot<token>/deleteMyDescription
POST https://api.telegram.org/bot<token>/deleteMyShortDescription
POST https://api.telegram.org/bot<token>/deleteMyCommands
```

With optional:

```
{ "language_code": "de" }
```

---

## 5. Language Detection Strategy

Telegram does not provide a "list configured languages" endpoint.

### Strategy

1. Maintain full ISO 639-1 language list (~184 codes).
2. Fetch default metadata first.
3. Probe each language in controlled batches (parallelized).
4. Compare responses to default.
5. Cache results per session.

Rate limiting:

* Max 20 concurrent requests.
* Retry with exponential backoff on 429.

---

## 6. AI Translation (Optional)

Enabled only if OpenAI key provided.

### 6.1 AI SDK Requirement

All AI calls must use:

```
import { generateObject } from "ai"
```

With Vercel AI SDK and OpenAI provider.

---

### 6.2 Prompt Structure

System instruction:

* Translate Telegram bot metadata
* Preserve command names
* Keep tone professional
* Return strict JSON

User input:

```
Base language: English
Target language: German

Name: ...
Short Description: ...
Description: ...
Commands:
- start: Start the bot
- help: Get help
```

---

### 6.3 Expected JSON Schema

```
{
  name: string,
  short_description: string,
  description: string,
  commands: [
    {
      command: string,
      description: string
    }
  ]
}
```

Must be validated before applying.

---

## 7. UI Requirements (shadcn/ui Mandatory)

All components must use shadcn/ui:

Required components:

* Card
* Tabs
* Select
* Button
* Input
* Textarea
* Dialog
* Alert
* Badge
* ScrollArea
* Separator

---

### 7.1 Main Layout

#### Top Section

* Bot info card
* Username
* Validation status

#### Language Tabs

* Default
* Detected languages
* * Add language

---

### 7.2 Language Editor

Per-language card layout:

* Name input
* Short description textarea
* Description textarea
* Commands table editor
* Save button
* Delete localization button

---

### 7.3 AI Translation Flow

Dialog:

* Select base language
* Select target language
* Preview translation
* Confirm and apply

---

## 8. Data Flow

1. User enters bot token.
2. Backend validates via `getMe`.
3. Fetch default metadata.
4. Probe ISO languages.
5. Render dashboard.
6. Optional AI translation via Vercel AI SDK.
7. Save changes via `setMy*`.

---

## 9. Security Requirements

* Tokens never logged
* No localStorage persistence
* HTTPS only
* Server-side Telegram + AI calls
* Optional: short-lived encrypted session storage

---

## 10. Non-Functional Requirements

Performance:

* Probing completes under 5–10 seconds
* Parallelized API calls

Resilience:

* Handle Telegram 429 rate limits
* Handle partial failures
* Clear error messaging

---

## 11. Future Extensions

* Multi-bot dashboard
* JSON import/export
* Git-style version history
* Team accounts
* Scheduled AI retranslation
* Cost estimation preview for AI

---

## 12. MVP Scope

* Token validation
* Default metadata fetch
* Manual language add
* Edit + save metadata
* AI translate single language
* shadcn/ui-based interface
* Vercel AI SDK integration
