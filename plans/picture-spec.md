# 📘 Feature Specification

**Feature:** Telegram Bot Profile Picture Management
**Platform:** Next.js 16 (App Router)
**API:** Telegram Bot API (`getUserProfilePhotos`, `getFile`, `setMyProfilePhoto`, `removeMyProfilePhoto`)

---

## 1️⃣ Functional Overview

### The system must:

* Fetch and display the current bot profile photo
* Show fallback UI if no photo exists
* Allow uploading a new profile photo
* Replace the current photo
* Optionally remove the current photo
* Handle errors and API failures gracefully

---

## 2️⃣ Telegram API Endpoints Used

All calls are server-side only (never expose bot token to client).

### 🔹 Get bot basic info

```
GET https://api.telegram.org/bot<TOKEN>/getMe
```

### 🔹 Get bot profile photos

```
GET https://api.telegram.org/bot<TOKEN>/getUserProfilePhotos?user_id=<BOT_ID>&limit=1
```

Returns:

```json
{
  "total_count": 1,
  "photos": [
    [
      {
        "file_id": "...",
        "file_unique_id": "...",
        "file_size": 12345,
        "width": 640,
        "height": 640
      }
    ]
  ]
}
```

⚠️ Each photo entry is an array of different sizes.
You should select the largest resolution photo (last element).

---

### 🔹 Get file path

```
GET https://api.telegram.org/bot<TOKEN>/getFile?file_id=<FILE_ID>
```

Response:

```json
{
  "file_path": "photos/file_123.jpg"
}
```

Actual image URL:

```
https://api.telegram.org/file/bot<TOKEN>/<file_path>
```

---

### 🔹 Set profile photo

```
POST https://api.telegram.org/bot<TOKEN>/setMyProfilePhoto
Content-Type: multipart/form-data
photo=<binary>
```

---

### 🔹 Remove profile photo

```
POST https://api.telegram.org/bot<TOKEN>/removeMyProfilePhoto
```

---

## 3️⃣ Architecture

### 🔒 Security Rules

* Bot token stored in `.env`
* All Telegram API calls executed in server routes
* Never expose token to client
* Use Next.js Route Handlers (`app/api/.../route.ts`)

---

## 4️⃣ API Layer Design (Next.js)

### Folder Structure

```
app/
  api/
    telegram/
      profile/
        route.ts        -> GET (fetch current photo)
      upload/
        route.ts        -> POST (upload new photo)
      remove/
        route.ts        -> POST (remove photo)
```

---

## 5️⃣ API Specifications

---

### 🔹 GET /api/telegram/profile

#### Flow

1. Call `getMe`
2. Extract `id`
3. Call `getUserProfilePhotos`
4. If no photos → return null
5. If photos exist:

   * Select largest size
   * Call `getFile`
   * Construct image URL
6. Return public file URL to client

#### Response

```json
{
  "photoUrl": "https://api.telegram.org/file/bot<TOKEN>/photos/..."
}
```

Or

```json
{
  "photoUrl": null
}
```

---

### 🔹 POST /api/telegram/upload

#### Input

Multipart form-data:

```
file: File
```

#### Validation

* Must be image
* Max 10MB
* Recommended square image
* JPG or PNG

#### Flow

1. Parse form-data
2. Call `setMyProfilePhoto`
3. Return success/failure

#### Response

```json
{
  "success": true
}
```

---

### 🔹 POST /api/telegram/remove

#### Flow

1. Call `removeMyProfilePhoto`
2. Return success

---

## 6️⃣ Frontend UI Spec

### Page: `/bot/profile`

#### UI Components

#### 🖼 Profile Photo Card

* Circular preview
* 160x160px
* Loading skeleton
* Fallback avatar icon if null

#### 📤 Upload Button

* File input (hidden)
* Button: “Change Photo”
* Show loading state while uploading

#### 🗑 Remove Button

* Visible only if photo exists
* Confirmation dialog
* Loading state

---

### UX Flow

#### Initial Load

* Fetch `/api/telegram/profile`
* Display photo or placeholder

#### On Upload

* Disable buttons
* Show spinner
* Call upload endpoint
* Refresh profile photo
* Show success toast

#### On Remove

* Confirm
* Call remove endpoint
* Refresh UI

---

## 7️⃣ Error Handling

Handle these Telegram API errors:

| Error   | Meaning        | UI Response           |
| ------- | -------------- | --------------------- |
| 400     | invalid file   | Show validation error |
| 413     | file too large | Show max size error   |
| 401     | invalid token  | Server misconfig      |
| network | API down       | Retry button          |

---

## 8️⃣ Caching Strategy

* Do NOT cache profile photo requests
* Always fetch fresh data
* Use `cache: "no-store"` in fetch

---

## 9️⃣ Performance Considerations

* Telegram file URL is already CDN-backed
* No need to proxy image
* Use `<Image>` component with `unoptimized` or allow remote domain
* Add domain in `next.config.js`:

```js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'api.telegram.org'
    }
  ]
}
```

---

## 🔟 State Management

Simple solution:

* React `useState`
* React `useEffect`
* Refetch after mutation

Advanced:

* TanStack Query / SWR for revalidation

---

## 1️⃣1️⃣ Optional Enhancements

* Image cropper before upload
* Drag & drop upload
* Animated preview support
* Display file size
* Show bot username + name via `getMe`

---

## 1️⃣2️⃣ Environment Variables

```
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
```

Never expose this to client.

---

## 1️⃣3️⃣ Edge Cases

| Case                      | Expected Behavior |
| ------------------------- | ----------------- |
| Bot has no profile photo  | Show placeholder  |
| Bot has multiple photos   | Show most recent  |
| Upload fails              | Keep old image    |
| User refreshes mid-upload | Safe retry        |

---

## 1️⃣4️⃣ Testing Plan

### Unit Tests

* API response parsing
* Largest photo selection logic

### Integration Tests

* Upload → fetch → confirm changed

### Manual Tests

* Remove photo
* Upload invalid file
* Upload large file
* Network offline

---

## 1️⃣5️⃣ Deployment Notes

* Works on Vercel
* Must use Node runtime (not Edge) for multipart parsing
* Increase body size limit if needed
