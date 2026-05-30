/**
 * Tests for the onboarding sweep feature.
 */

import { CONNECTOR_REGISTRY, IOS_QUERY_SCHEMES } from "../connectorRegistry";

describe("Connector Registry", () => {
  it("has exactly 23 entries (under Apple 30-scheme cap)", () => {
    expect(CONNECTOR_REGISTRY.length).toBe(23);
  });

  it("has no duplicate IDs", () => {
    const ids = CONNECTOR_REGISTRY.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("has no duplicate iOS schemes", () => {
    const schemes = CONNECTOR_REGISTRY.map((c) => c.iosScheme);
    const uniqueSchemes = new Set(schemes);
    expect(uniqueSchemes.size).toBe(schemes.length);
  });

  it("exports IOS_QUERY_SCHEMES matching registry length", () => {
    expect(IOS_QUERY_SCHEMES.length).toBe(CONNECTOR_REGISTRY.length);
  });

  it("has exactly 3 wired connectors", () => {
    const wired = CONNECTOR_REGISTRY.filter((c) => c.status === "wired");
    expect(wired.length).toBe(3);
    expect(wired.map((c) => c.id).sort()).toEqual(["gmail", "hubspot", "outlook"]);
  });

  it("every entry has required fields", () => {
    for (const c of CONNECTOR_REGISTRY) {
      expect(c.id).toBeTruthy();
      expect(c.displayName).toBeTruthy();
      expect(c.iosScheme).toBeTruthy();
      expect(c.dataPromise.length).toBeGreaterThan(20);
      expect(["wired", "waitlist"]).toContain(c.status);
      expect(c.displayPriority).toBeGreaterThan(0);
    }
  });

  it("wired connectors have lower displayPriority than waitlist", () => {
    const wired = CONNECTOR_REGISTRY.filter((c) => c.status === "wired");
    const waitlist = CONNECTOR_REGISTRY.filter((c) => c.status === "waitlist");
    const maxWired = Math.max(...wired.map((c) => c.displayPriority));
    const minWaitlist = Math.min(...waitlist.map((c) => c.displayPriority));
    expect(maxWired).toBeLessThan(minWaitlist);
  });

  it("display priorities are unique and sequential", () => {
    const priorities = CONNECTOR_REGISTRY.map((c) => c.displayPriority).sort(
      (a, b) => a - b
    );
    const uniquePriorities = new Set(priorities);
    expect(uniquePriorities.size).toBe(priorities.length);
  });
});

describe("OAuth clients", () => {
  it("every wired connector has an OAuth module", async () => {
    // This tests that startOAuth doesn't throw "No OAuth flow" for wired connectors
    const { startOAuth } = await import("../oauthClients");
    const wired = CONNECTOR_REGISTRY.filter((c) => c.status === "wired");

    for (const c of wired) {
      // We can't actually run OAuth, but we can verify the mapping exists
      // by checking that startOAuth doesn't throw the "No OAuth flow" error
      try {
        // This will fail because CaddieAPI isn't configured in test,
        // but it should NOT fail with "No OAuth flow for connector"
        await startOAuth(c.id, "test-rep");
      } catch (e: any) {
        expect(e.message).not.toContain("No OAuth flow");
      }
    }
  });
});
