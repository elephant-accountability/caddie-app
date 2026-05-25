# Caddie-App Frontend Architecture

> Expo/React Native app using Expo Router with file-based routing.
> API base: `https://caddie-core.fly.dev`

---

## 1. App Shell & Providers

### `app/_layout.tsx` — Root Layout
- **What it does**: Wraps entire app in `GestureHandlerRootView` → `AuthProvider` → `AppContent`. If not authenticated, renders `LoginScreen`. If authenticated, wraps in `QueueProvider` → `ConversationProvider` → `Stack` navigator.
- **Provider hierarchy**: `GestureHandlerRootView` > `AuthProvider` > `QueueProvider` > `ConversationProvider` > `Stack`
- **State**: reads `isAuthenticated`, `isLoading` from `useAuth()`

### `app/(tabs)/_layout.tsx` — Tab Layout
- **What it does**: Defines 5-tab bottom navigation (Brief, Queue, Chat, Vault, Settings). Renders `FloatingInput` and `CallSamButton` as persistent overlays above the tab bar.
- **Tabs**: `index` (Brief), `queue` (Queue), `log` (Chat), `vault` (Vault), `settings` (Settings)
- **Icons**: Ionicons (`sunny-outline`, `list-outline`, `chatbubble-outline`, `archive-outline`, `settings-outline`)

---

## 2. Tab Screens

### Tab 1: Brief — `app/(tabs)/index.tsx` → `BriefScreen`
- **Renders**: `QuotaBar`, `MorningBrief`
- **Data fetched**: Queue via `useQueue()` context (which calls `GET /api/queue`)
- **State**: `refreshing` (local pull-to-refresh)
- **User actions**:
  - Pull-to-refresh → re-fetches queue
  - Tap action item → expand inline card (in MorningBrief)
  - Skip action → `skip()`
  - Snooze action → `snooze()`
  - Complete action → `complete('completed')`
  - Call phone number → `Linking.openURL('tel:...')`
  - Open website → `Linking.openURL(url)`
  - Share action → `Share.share()` + `POST /api/share`

### Tab 2: Queue — `app/(tabs)/queue.tsx` → `QueueScreen`
- **Renders**: `QueueHeader`, `QuotaBar`, `ActionCard` (top card), "Up next" list with expandable items, `OutcomeModal`, `ContactSheet` + `AskInput` (in modal)
- **Data fetched**: Queue via `useQueue()` context (`GET /api/queue`); contact context via `ContactSheet` (`GET /api/context/{contactId}`); answers via `AskInput` (`POST /api/ask`); share tracking (`POST /api/share`)
- **State**: `refreshing`, `showOutcome`, `showContactSheet`, `swiping`, `expandedId`, `outcomeAction`
- **User actions**:
  - Pull-to-refresh → re-fetches queue
  - Tap "Done" on top card → opens OutcomeModal
  - Skip → advances queue (`POST /api/skip`)
  - Snooze → advances queue (`POST /api/snooze`)
  - Tap contact name → opens ContactSheet modal
  - Tap "Up next" item → expands inline card with full details
  - On expanded list item: Skip / Later / Share / Done
  - Call phone → `Linking.openURL('tel:...')`
  - Open website → `Linking.openURL(url)`
  - Share → `Share.share()` + `POST /api/share`
  - Ask question about contact → `POST /api/ask`
  - Submit outcome → `POST /api/outcome`

### Tab 3: Chat — `app/(tabs)/log.tsx` → `ChatScreen`
- **Renders**: Message bubbles (user + caddie), thinking indicator, text input
- **Data fetched**: Chat history from SQLite on mount (`loadHistory()`); messages sent via `POST /api/converse` (falls back to `POST /api/ask`)
- **State**: `input`, `sending` (local); `messages`, `conversationId`, `isThinking` (from `useConversation()`)
- **User actions**:
  - Type and send message → calls `/api/converse`
  - View conversation history (loaded from SQLite)

### Tab 4: Vault — `app/(tabs)/vault.tsx` → `VaultScreen`
- **Renders**: Upload count header, placeholder for future upload UI, list of existing uploads
- **Data fetched**: `GET /api/vault/uploads`
- **State**: `uploads`, `count`, `loading`, `refreshing`
- **User actions**:
  - Pull-to-refresh → re-fetches vault uploads
  - (Upload functionality marked as "Phase 2")

### Tab 5: Settings — `app/(tabs)/settings.tsx` → delegates to `SettingsScreen`
- **Renders**: Server status, version info, sign-out button, app about info
- **Data fetched**: `GET /api/health`
- **State**: `health`, `loading` (from `SettingsScreen`)
- **User actions**:
  - View server status/version
  - Sign out → clears tokens, sets `isAuthenticated = false`

---

## 3. Contexts (Global State)

### `src/auth/AuthContext.tsx` — AuthProvider / useAuth
- **State**: `isAuthenticated`, `isLoading`
- **API calls**: `POST /api/auth/issue` (login)
- **Methods**: `login(repId, secret)`, `logout()`, `checkAuth()`
- **Token storage**: via `src/auth/tokens.ts` (expo-secure-store)

### `src/context/QueueContext.tsx` — QueueProvider / useQueue
- **State**: `actions` (Action[]), `currentIndex`, `quota`, `loading`, `error`, `mutating`
- **Derived**: `currentAction`, `remaining`
- **API calls**:
  - `GET /api/queue` (refresh)
  - `POST /api/outcome` (complete — fire-and-forget)
  - `POST /api/skip` (skip — fire-and-forget)
  - `POST /api/snooze` (snooze — fire-and-forget)
- **Offline**: Caches queue to SQLite (`saveQueueCache`); falls back to cache on network error. Enqueues mutations to outbox (`enqueueOutcome`, `enqueueSkip`, `enqueueSnooze`).
- **Methods**: `refresh()`, `complete(outcome, note?)`, `skip()`, `snooze(hours?)`, `skipAction(action)`, `snoozeAction(action, hours?)`, `completeAction(action, outcome, note?)`
- **Optimistic updates**: Advances `currentIndex` immediately, API call is fire-and-forget.

### `src/context/ConversationContext.tsx` — ConversationProvider / useConversation
- **State**: `messages` (ChatMessage[]), `conversationId`, `isThinking`
- **API calls**:
  - `POST /api/converse` (primary chat)
  - `POST /api/ask` (fallback if converse fails)
- **Persistence**: SQLite table `chat_messages` — loads on `loadHistory()`, persists each message on add
- **Methods**: `addUserMessage(text)`, `addCaddieResponse(text, intent?, suggestedActions?)`, `sendToConverse(text, opts?)`, `startBrainstorm(patternId)`, `loadHistory()`

---

## 4. API Client

### `src/api/client.ts` — CaddieAPI class (singleton `api`)
- **Base URL**: `https://caddie-core.fly.dev` (configurable via `EXPO_PUBLIC_API_URL`)
- **Auth**: Bearer token from expo-secure-store
- **Timeout**: 15s per request, 2 retries on TypeError (network errors)

| Method | HTTP | Endpoint | Used By |
|--------|------|----------|---------|
| `issueToken(data)` | POST | `/api/auth/issue` | AuthContext.login |
| `getQueue()` | GET | `/api/queue` | QueueContext.refresh |
| `submitOutcome(data)` | POST | `/api/outcome` | QueueContext.complete |
| `skip(actionId?)` | POST | `/api/skip` | QueueContext.skip |
| `snooze(actionId?, hours)` | POST | `/api/snooze` | QueueContext.snooze |
| `share(actionId, contactId?, account?)` | POST | `/api/share` | QueueScreen, MorningBrief, ActionCard |
| `getContext(contactId)` | GET | `/api/context/{contactId}` | ContactSheet |
| `ask(data)` | POST | `/api/ask` | AskInput, ConversationContext (fallback) |
| `getHistory()` | GET | `/api/history` | HistoryScreen |
| `getQuota()` | GET | `/api/quota` | (available, not directly called — quota comes via queue) |
| `ingestConversation(formData)` | POST | `/api/conversation/ingest` | FloatingInput, VoiceCapture |
| `getDraft(actionId)` | GET | `/api/actions/{actionId}/draft` | (available, not yet wired) |
| `registerPushToken(token)` | POST | `/api/push-token` | useNotifications |
| `getVaultUploads()` | GET | `/api/vault/uploads` | VaultScreen |
| `converse(data)` | POST | `/api/converse` | ConversationContext.sendToConverse |
| `callSam()` | POST | `/api/call-sam` | CallSamButton |
| `health()` | GET | `/api/health` | SettingsScreen |

---

## 5. Components

### `src/components/ActionCard.tsx`
- **Purpose**: Top recommendation card in Queue tab — shows action type badge, contact name, account, reason, supporting text, revenue range, call button, website link, and Skip/Later/Share/Done buttons.
- **API calls**: None directly (delegates to parent callbacks). `Share.share()` + calls `onShare`.
- **Props**: `action`, `onDone`, `onSkip`, `onSnooze`, `onTapContact`, `onShare`

### `src/components/SwipeableActionCard.tsx`
- **Purpose**: Gesture-based (swipeable) action card with PanResponder. Swipe right = done, left = skip, up = snooze. Shows swipe hint indicators.
- **API calls**: None (delegates to parent)
- **Props**: `action`, `onSwipeRight`, `onSwipeLeft`, `onSwipeUp`, `onTapContact`, `onTapAction`
- **Note**: Currently not used in any tab (ActionCard is used instead). Exported via `index.tsx`.

### `src/components/MorningBrief.tsx`
- **Purpose**: Brief tab's main content. Shows greeting, date, stats (total actions/calls/emails), trade show follow-ups section, priority actions list. Each item expandable inline with full details and action buttons.
- **API calls**: `POST /api/share` (via inline share button)
- **State**: `expandedId`
- **Props**: `actions`, `date`, `onSkip`, `onSnooze`, `onDone`

### `src/components/OutcomeModal.tsx`
- **Purpose**: Bottom sheet modal for logging call outcomes. 5 outcome types: Connected, Voicemail, No answer, Call back, Not relevant. Optional note field.
- **API calls**: None (delegates via `onSubmit`)
- **State**: `selected` (OutcomeType), `note`
- **Props**: `visible`, `contactName`, `onSubmit`, `onClose`

### `src/components/ContactSheet.tsx`
- **Purpose**: Bottom sheet showing contact details — name, company, role, phone/email actions, revenue, deal count, days since contact, RSI score, products, why recommended, signals.
- **API calls**: `GET /api/context/{contactId}`
- **State**: `context`, `loading`, `error`
- **Props**: `contactId`, `contactName`, `onClose`

### `src/components/AskInput.tsx`
- **Purpose**: Text input for asking questions about a specific contact. Shows answer with sources.
- **API calls**: `POST /api/ask`
- **State**: `question`, `answer`, `loading`, `error`
- **Props**: `contactId`

### `src/components/FloatingInput.tsx`
- **Purpose**: Persistent floating pill ("Caddie") above tab bar. Expands into text/voice input. Text → ingest + converse. Voice → record audio → ingest (transcription) → converse. Shows reply bubble.
- **API calls**: `POST /api/conversation/ingest` (text or audio), `POST /api/converse` (via `sendToConverse` from ConversationContext)
- **State**: `expanded`, `text`, `submitting`, `recording`, `feedback`, `caddieReply`, `showReply`
- **Note**: Uses `expo-av` for audio recording.

### `src/components/CallSamButton.tsx`
- **Purpose**: Floating phone button (bottom-left). Triggers outbound Vapi call — Sam calls the rep's phone.
- **API calls**: `POST /api/call-sam`
- **State**: `state` (idle/calling/error), `message`, pulse animation

### `src/components/QuotaBar.tsx`
- **Purpose**: Horizontal progress bar showing quota attainment (%). Shows behind/on-pace status.
- **API calls**: None (pure display)
- **Props**: `quota` (Quota | null), `compact?`

### `src/components/QueueHeader.tsx`
- **Purpose**: Header showing "Your queue" title, remaining/total count, refresh button.
- **API calls**: None (delegates `onRefresh`)
- **Props**: `remaining`, `total`, `onRefresh`

### `src/components/LoginScreen.tsx`
- **Purpose**: Login form — rep ID + signup secret → sign in.
- **API calls**: None directly (calls `useAuth().login()` which calls `POST /api/auth/issue`)
- **State**: `repId`, `secret`, `showSecret`, `error`, `submitting`

### `src/components/SettingsScreen.tsx`
- **Purpose**: Settings page — server health status, version, sign-out button.
- **API calls**: `GET /api/health`
- **State**: `health`, `loading`

### `src/components/HistoryScreen.tsx`
- **Purpose**: List of completed actions with outcomes and timestamps.
- **API calls**: `GET /api/history`
- **State**: `history`, `loading`, `refreshing`, `error`
- **Note**: Has back navigation, but not currently wired to any tab route.

### `src/components/VoiceCapture.tsx`
- **Purpose**: Text input for logging conversation notes. Submits as text to ingest endpoint.
- **API calls**: `POST /api/conversation/ingest`
- **State**: `text`, `submitting`, `feedback`
- **Note**: Exported via `index.tsx`, but not directly mounted in any current tab.

---

## 6. Hooks

### `src/hooks/useQueue.ts`
- **Purpose**: Standalone queue hook (simpler version without offline support). Calls `GET /api/queue`, `POST /api/outcome`, `POST /api/skip`, `POST /api/snooze`.
- **Note**: Not used — the app uses `QueueContext` instead (which has offline/outbox support).

### `src/hooks/useNotifications.ts`
- **Purpose**: Registers for push notifications on mount, sends Expo push token to backend via `POST /api/push-token`. Listens for notification received/tapped events.
- **API calls**: `POST /api/push-token`
- **Note**: Not currently mounted — no component calls `useNotifications()` in the codebase.

---

## 7. Offline Layer

### `src/offline/db.ts`
- **Database**: SQLite (`caddie.db`) via `expo-sqlite`
- **Tables**:
  - `outbox` — mutation queue (outcome/skip/snooze) with retry logic, idempotency keys
  - `queue_cache` — cached queue response for offline mode
  - `history_cache` — cached history (schema exists, not actively used)
  - `contact_cache` — cached contact context with 24h TTL
  - `voice_queue` — queued audio files (schema exists, not actively used)
  - `chat_messages` — created by ConversationContext (not in db.ts init)
- **Key functions**: `enqueueOutcome()`, `enqueueSkip()`, `enqueueSnooze()`, `saveQueueCache()`, `loadQueueCache()`, `saveContactCache()`, `loadContactCache()`, `getPendingOutbox()`, `markOutboxDone()`, `markOutboxError()`

---

## 8. Auth Layer

### `src/auth/tokens.ts`
- **Storage**: `expo-secure-store` (keys: `caddie_auth_token`, `caddie_token_expiry`)
- **Functions**: `storeTokens()`, `getToken()`, `getTokenExpiry()`, `isTokenValid()` (5min buffer), `clearTokens()`, `refreshIfNeeded()` (10min refresh window)

---

## 9. Theme

### `src/theme/colors.ts` — Dark navy color palette
- Primary: navy (#1B2A4A), navyLight (#243B5D)
- Status: forest (green), amber, rust (red)
- Action accents: call=green, email=blue, sms=amber, research=purple

### `src/theme/typography.ts` — Font sizes (xs:11 through hero:34) and font families

### `src/theme/index.ts` — Re-exports colors and typography

---

## 10. Types

### `src/types/api.ts`
- **Action types**: `call`, `email`, `sms`, `research`
- **Outcome types**: `completed`, `no_answer`, `voicemail`, `callback`, `not_relevant`
- **Interfaces**: `Action`, `Quota`, `QueueResponse`, `OutcomeRequest/Response`, `DraftResponse`, `HealthResponse`, `AuthIssueRequest/Response`, `ContextResponse`, `AskRequest/Response`, `HistoryItem/Response`, `QuotaResponse`, `ConversationIngestResponse`, `PushTokenRequest`, `VaultUpload/UploadsResponse`, `ConverseRequest/Response`, `SuggestedAction`

---

## 11. Component Barrel Export

### `src/components/index.tsx`
- Exports: `SwipeableActionCard`, `MorningBrief`, `OutcomeModal`, `QueueHeader`, `VoiceCapture`

---

## 12. Data Flow Summary

```
User opens app
  → AuthProvider checks token validity (SecureStore)
  → If invalid → LoginScreen → POST /api/auth/issue → store token
  → If valid → QueueProvider fetches GET /api/queue → caches to SQLite
  → ConversationProvider (lazy — loads chat_messages from SQLite)
  → Tab bar renders with FloatingInput + CallSamButton overlays

Brief tab: reads from QueueContext → MorningBrief renders action list
Queue tab: reads from QueueContext → ActionCard (top) + expandable list
  → mutations: POST /api/outcome, /api/skip, /api/snooze (optimistic + outbox)
  → contact drill-down: GET /api/context/{id}, POST /api/ask
Chat tab: ConversationContext → POST /api/converse (fallback: POST /api/ask)
Vault tab: GET /api/vault/uploads (display only)
Settings tab: GET /api/health + logout
FloatingInput: POST /api/conversation/ingest + POST /api/converse
CallSamButton: POST /api/call-sam
```

---

## 13. Unused/Dormant Code

| File | Status |
|------|--------|
| `SwipeableActionCard.tsx` | Exported but not rendered in any screen (ActionCard used instead) |
| `VoiceCapture.tsx` | Exported but not mounted (FloatingInput handles voice) |
| `HistoryScreen.tsx` | Defined but no route points to it |
| `useQueue.ts` (hook) | Superseded by QueueContext (has offline support) |
| `useNotifications.ts` | Defined but never called |
| `api.getDraft()` | Defined but not called anywhere |
| `api.getQuota()` | Defined but not called (quota comes embedded in queue response) |
| `history_cache` table | Schema exists, not read/written |
| `voice_queue` table | Schema exists, not read/written |
