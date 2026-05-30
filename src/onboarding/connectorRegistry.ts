/**
 * Connector Registry — 29 entries, Apple-review 30-scheme cap (1 reserved).
 *
 * Each entry declares:
 *  - id: kebab-case, stable key
 *  - displayName: what the rep sees
 *  - iosScheme: the URL scheme tested via Linking.canOpenURL
 *  - dataPromise: 1–2 sentences on what Caddie gets from this connector
 *  - category: for display grouping
 *  - status: "wired" (OAuth ready) | "waitlist" (notify-me only)
 *  - displayPriority: lower = higher in the list
 */

export type ConnectorStatus = "wired" | "waitlist";

export type ConnectorCategory =
  | "email"
  | "crm"
  | "calendar"
  | "storage"
  | "messaging"
  | "video"
  | "notes"
  | "maps"
  | "social";

export interface ConnectorEntry {
  id: string;
  displayName: string;
  iosScheme: string;
  dataPromise: string;
  category: ConnectorCategory;
  status: ConnectorStatus;
  displayPriority: number;
}

export const CONNECTOR_REGISTRY: ConnectorEntry[] = [
  // ── Wired (OAuth ready) ──────────────────────────────────────────
  {
    id: "gmail",
    displayName: "Gmail",
    iosScheme: "googlegmail",
    dataPromise:
      "Email engagement signals — who you're talking to, how often, reply patterns. We count emails, we don't read them.",
    category: "email",
    status: "wired",
    displayPriority: 1,
  },
  {
    id: "outlook",
    displayName: "Outlook",
    iosScheme: "ms-outlook",
    dataPromise:
      "Email and calendar signals from your Microsoft account. Meeting frequency, contact patterns, follow-up gaps.",
    category: "email",
    status: "wired",
    displayPriority: 2,
  },
  {
    id: "hubspot",
    displayName: "HubSpot",
    iosScheme: "hubspot",
    dataPromise:
      "Deal pipeline, contact activity, and engagement history. Caddie sees your CRM so you don't have to open it.",
    category: "crm",
    status: "wired",
    displayPriority: 3,
  },

  // ── Waitlist ─────────────────────────────────────────────────────
  {
    id: "salesforce",
    displayName: "Salesforce",
    iosScheme: "salesforce1",
    dataPromise:
      "CRM pipeline, opportunity stages, and contact records. Full deal context without switching apps.",
    category: "crm",
    status: "waitlist",
    displayPriority: 4,
  },
  {
    id: "apollo",
    displayName: "Apollo",
    iosScheme: "apollo",
    dataPromise:
      "Prospect enrichment and outreach sequences. Company data, contact info, engagement tracking.",
    category: "crm",
    status: "waitlist",
    displayPriority: 5,
  },
  {
    id: "closeapp",
    displayName: "Close",
    iosScheme: "closeapp",
    dataPromise:
      "Inside sales pipeline, call logs, and email sequences. Activity-first CRM data.",
    category: "crm",
    status: "waitlist",
    displayPriority: 6,
  },
  {
    id: "salesloft",
    displayName: "SalesLoft",
    iosScheme: "salesloft",
    dataPromise:
      "Cadence execution, call recordings, and engagement analytics. Sales workflow data.",
    category: "crm",
    status: "waitlist",
    displayPriority: 7,
  },
  {
    id: "google-drive",
    displayName: "Google Drive",
    iosScheme: "googledrive",
    dataPromise:
      "Proposals, spec sheets, and shared documents. Caddie finds the file you need before you ask.",
    category: "storage",
    status: "waitlist",
    displayPriority: 8,
  },
  {
    id: "onedrive",
    displayName: "OneDrive",
    iosScheme: "ms-onedrive",
    dataPromise:
      "Documents, spreadsheets, and presentations from your Microsoft account.",
    category: "storage",
    status: "waitlist",
    displayPriority: 9,
  },
  {
    id: "dropbox",
    displayName: "Dropbox",
    iosScheme: "dbapi-1",
    dataPromise:
      "File access and shared folder activity. Quick-pull docs during calls.",
    category: "storage",
    status: "waitlist",
    displayPriority: 10,
  },
  {
    id: "box",
    displayName: "Box",
    iosScheme: "boxnet",
    dataPromise:
      "Enterprise file storage. Proposals, contracts, and SOWs accessible through Caddie.",
    category: "storage",
    status: "waitlist",
    displayPriority: 11,
  },
  {
    id: "slack",
    displayName: "Slack",
    iosScheme: "slack",
    dataPromise:
      "Channel mentions, DM patterns, and shared links. Team communication context.",
    category: "messaging",
    status: "waitlist",
    displayPriority: 12,
  },
  {
    id: "teams",
    displayName: "Microsoft Teams",
    iosScheme: "msteams",
    dataPromise:
      "Chat threads, meeting schedules, and team activity. Your Teams context in one place.",
    category: "messaging",
    status: "waitlist",
    displayPriority: 13,
  },
  {
    id: "whatsapp",
    displayName: "WhatsApp",
    iosScheme: "whatsapp",
    dataPromise:
      "Contact communication patterns. Caddie knows who you message most.",
    category: "messaging",
    status: "waitlist",
    displayPriority: 14,
  },
  {
    id: "telegram",
    displayName: "Telegram",
    iosScheme: "tg",
    dataPromise:
      "Messaging patterns and contact activity from Telegram.",
    category: "messaging",
    status: "waitlist",
    displayPriority: 15,
  },
  {
    id: "zoom",
    displayName: "Zoom",
    iosScheme: "zoomus",
    dataPromise:
      "Meeting history, duration, and participant patterns. Who you're meeting and how often.",
    category: "video",
    status: "waitlist",
    displayPriority: 16,
  },
  {
    id: "granola",
    displayName: "Granola",
    iosScheme: "granola",
    dataPromise:
      "AI meeting notes and action items. Auto-captured context from every call.",
    category: "notes",
    status: "waitlist",
    displayPriority: 17,
  },
  {
    id: "otter",
    displayName: "Otter.ai",
    iosScheme: "otter",
    dataPromise:
      "Transcribed meeting notes and highlights. Searchable conversation history.",
    category: "notes",
    status: "waitlist",
    displayPriority: 18,
  },
  {
    id: "fireflies",
    displayName: "Fireflies.ai",
    iosScheme: "fireflies",
    dataPromise:
      "Meeting transcripts, action items, and conversation intelligence.",
    category: "notes",
    status: "waitlist",
    displayPriority: 19,
  },
  {
    id: "calendly",
    displayName: "Calendly",
    iosScheme: "calendly",
    dataPromise:
      "Scheduling patterns, meeting types, and booking frequency. Who's booking time with you.",
    category: "calendar",
    status: "waitlist",
    displayPriority: 20,
  },
  {
    id: "google-maps",
    displayName: "Google Maps",
    iosScheme: "comgooglemaps",
    dataPromise:
      "Route planning and location context. Caddie knows where you're headed.",
    category: "maps",
    status: "waitlist",
    displayPriority: 21,
  },
  {
    id: "waze",
    displayName: "Waze",
    iosScheme: "waze",
    dataPromise:
      "Real-time route data and drive-time estimates between accounts.",
    category: "maps",
    status: "waitlist",
    displayPriority: 22,
  },
  {
    id: "linkedin",
    displayName: "LinkedIn",
    iosScheme: "linkedin",
    dataPromise:
      "Professional network activity. Connection requests, profile views, and engagement signals.",
    category: "social",
    status: "waitlist",
    displayPriority: 23,
  },
  // ── Apple system apps (always available, no canOpenURL needed) ──
  // These are NOT in the registry because they don't need scheme checks.
  // They're rendered as a separate "Always-on Apple services" card.
  //
  // Apple Contacts — relationship graph, names, companies
  // Apple Calendar — meeting schedule, availability, event context
  // Apple Health — step count, sleep, activity (opt-in only)
  // Apple Maps — location + drive time (via MapKit)
  // Siri Shortcuts — trigger Caddie from Shortcuts automation
  // CallKit — already wired, detects phone calls passively
];

/** The 30 URL schemes for Info.plist LSApplicationQueriesSchemes */
export const IOS_QUERY_SCHEMES = CONNECTOR_REGISTRY.map((c) => c.iosScheme);

/**
 * Apple services that are always available — no canOpenURL check needed.
 * Rendered as a separate card below the detected apps.
 */
export const APPLE_ALWAYS_ON = [
  { name: "Contacts", dataPromise: "Relationship graph — names, companies, last-contacted" },
  { name: "Calendar", dataPromise: "Meeting schedule, availability, event context" },
  { name: "Health", dataPromise: "Step count, sleep, activity (opt-in)" },
  { name: "Maps", dataPromise: "Location and drive time via MapKit" },
  { name: "Siri Shortcuts", dataPromise: "Trigger Caddie from Shortcuts automation" },
  { name: "CallKit", dataPromise: "Phone call detection — already active" },
];
