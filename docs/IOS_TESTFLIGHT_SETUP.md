# iOS TestFlight Setup — Caddie EDC

**Last updated:** 2026-05-22

This doc walks Chris through the steps only he can do (Apple account actions), then confirms what Chuck already prepped.

---

## Step 0: Confirm Bundle ID

The app.json is configured with `com.elephantaccountability.caddie`. If you prefer the original `com.ealegalllc.caddie`, let Chuck know — one-line change.

---

## Step 1: Get Your Apple Team ID

1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Click **Membership Details** (left sidebar)
3. Copy the **Team ID** (10-character alphanumeric string, e.g., `A1B2C3D4E5`)
4. Open `eas.json` → replace `APPLE_TEAM_ID_HERE` with your Team ID

---

## Step 2: Register the Bundle ID

1. Go to [developer.apple.com/account/resources/identifiers/list](https://developer.apple.com/account/resources/identifiers/list)
2. Click **"+"** (Register a New Identifier)
3. Select **App IDs** → Continue
4. Select **App** (not App Clip) → Continue
5. Fill in:
   - **Description:** Caddie EDC
   - **Bundle ID:** Select "Explicit" → enter `com.elephantaccountability.caddie`
6. Under **Capabilities**, check at minimum:
   - Push Notifications
   - (others can be added later)
7. Click **Continue** → **Register**

---

## Step 3: Create App Store Connect Entry

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → **"+"** → **New App**
2. Fill in:
   - **Platforms:** iOS
   - **Name:** `Caddie EDC`
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** Select `com.elephantaccountability.caddie` from dropdown (registered in Step 2)
   - **SKU:** `caddie-edc-ios-001`
   - **User Access:** Full Access
3. Click **Create**
4. On the **App Information** page, find the **Apple ID** (numeric, e.g., `6744328591`)
5. Open `eas.json` → replace `ASC_APP_ID_HERE` with this numeric ID

---

## Step 4: Verify eas.json is Complete

After Steps 1-3, your `eas.json` submit section should look like:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "cpkenney06@yahoo.com",
      "ascAppId": "1234567890",
      "appleTeamId": "A1B2C3D4E5"
    }
  }
}
```

**No `HERE` placeholders should remain.** If any do, something was missed above.

---

## Step 5: EAS Login (one-time)

On a machine with Node.js:

```bash
npx eas-cli login
# Enter: cpkenney06@yahoo.com + Expo account password
# (Create an Expo account at expo.dev if you don't have one)
```

---

## Step 6: Tell Chuck "Go"

Once Steps 1-5 are done, tell Chuck. He'll:

1. Run `eas build --platform ios --profile preview` (builds the .ipa)
2. Run `eas submit --platform ios` (uploads to TestFlight)
3. You'll get a TestFlight notification on your phone within ~15 min

**Do NOT run the build yourself** unless you want to — Chuck handles it.

---

## What Chuck Already Prepped

| Item | Status | File |
|------|--------|------|
| App name → "Caddie EDC" | ✅ Done | `app.json` |
| Slug → "caddie-edc" | ✅ Done | `app.json` |
| Bundle ID → com.elephantaccountability.caddie | ✅ Done | `app.json` |
| Apple ID email | ✅ Done | `eas.json` |
| Apple Team ID | ⏳ Chris fills | `eas.json` |
| App Store Connect ID | ⏳ Chris fills | `eas.json` |
| Mic permission string → "Caddie EDC" | ✅ Done | `app.json` |
| Settings screen → "Caddie EDC by EA LLC" | ✅ Done | `app/(tabs)/settings.tsx` |
| Notification channel → "Caddie EDC" | ✅ Done | `src/hooks/useNotifications.ts` |

---

## Asset Audit (Separate Task)

These assets need review/replacement for EDC branding:

| Asset | Current | Needed |
|-------|---------|--------|
| `assets/icon.png` | 17KB, unknown design | EDC pocket caddie imagery (NOT golf) |
| `assets/splash-icon.png` | 17KB, unknown design | EDC brand splash |
| `assets/adaptive-icon.png` | 17KB, Android adaptive | Match iOS icon |
| `assets/notification-icon.png` | 1KB, notification | Monochrome EDC mark |
| `assets/favicon.png` | 2KB, web favicon | EDC favicon |

> **Do not block TestFlight on new art.** Default icons work for internal testing. Replace before any external distribution.
