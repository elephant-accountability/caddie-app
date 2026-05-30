import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Linking,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  CONNECTOR_REGISTRY,
  APPLE_ALWAYS_ON,
  type ConnectorEntry,
} from "@/onboarding/connectorRegistry";
import { ConnectorCard, AppleServicesCard } from "@/onboarding/ConnectorCard";
import { startOAuth } from "@/onboarding/oauthClients";
import { CaddieAPI } from "@/api/client";

// ── Design tokens ──────────────────────────────────────────────────
const C = {
  oliveDeep: "#1C1E18",
  bone: "#E8E2D2",
  boneSoft: "#C9C2B0",
  boneFaint: "#8A8474",
  safety: "#E85A1D",
} as const;

interface Props {
  repId: string;
  onComplete: () => void;
}

type SweepResult = {
  connector: ConnectorEntry;
  detected: boolean;
};

export default function SweepScreen({ repId, onComplete }: Props) {
  const [results, setResults] = useState<SweepResult[] | null>(null);
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    runSweep();
  }, []);

  async function runSweep() {
    const checks = CONNECTOR_REGISTRY.map(async (connector) => {
      try {
        const detected = await Promise.race([
          Linking.canOpenURL(`${connector.iosScheme}://`),
          new Promise<boolean>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 500)
          ),
        ]);
        return { connector, detected: !!detected };
      } catch {
        return { connector, detected: false };
      }
    });

    const swept = await Promise.all(checks);

    // Sort: detected first, then by displayPriority
    swept.sort((a, b) => {
      if (a.detected !== b.detected) return a.detected ? -1 : 1;
      return a.connector.displayPriority - b.connector.displayPriority;
    });

    setResults(swept);
  }

  const handleConnect = useCallback(
    async (connectorId: string) => {
      try {
        await startOAuth(connectorId, repId);
      } catch (e: any) {
        Alert.alert("Connection failed", e.message || "Try again later.");
      }
    },
    [repId]
  );

  const handleNotify = useCallback(
    async (connectorId: string) => {
      try {
        await CaddieAPI.post("/api/onboarding/waitlist_signal", {
          rep_id: repId,
          connector_id: connectorId,
          urgency: "wanted",
        });
        setNotifiedIds((prev) => new Set(prev).add(connectorId));
      } catch {
        // Silent fail — non-blocking
      }
    },
    [repId]
  );

  if (!results) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={C.safety} size="large" />
        <Text style={styles.loadingText}>Detecting your tools…</Text>
      </View>
    );
  }

  const detected = results.filter((r) => r.detected);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Your tools</Text>
      <Text style={styles.subtitle}>
        {detected.length > 0
          ? `Found ${detected.length} app${detected.length === 1 ? "" : "s"} on this device.`
          : "No third-party apps detected."}
        {" Connect what you want — skip the rest."}
      </Text>

      {results.map((r) => (
        <ConnectorCard
          key={r.connector.id}
          connector={r.connector}
          detected={r.detected}
          onConnect={handleConnect}
          onNotify={
            notifiedIds.has(r.connector.id)
              ? () => {} // Already notified, no-op
              : handleNotify
          }
        />
      ))}

      <AppleServicesCard services={APPLE_ALWAYS_ON} />

      <Pressable style={styles.waitlistLink} onPress={onComplete}>
        {/* Future: route to a waitlist signal endpoint */}
      </Pressable>

      <Pressable style={styles.skipLink} onPress={onComplete}>
        <Text style={styles.skipText}>Continue without connecting</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.oliveDeep,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loading: {
    flex: 1,
    backgroundColor: C.oliveDeep,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "System",
    fontSize: 15,
    color: C.boneSoft,
    marginTop: 16,
  },
  title: {
    fontFamily: "System",
    fontWeight: "700",
    fontSize: 28,
    color: C.bone,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "System",
    fontSize: 15,
    lineHeight: 22,
    color: C.boneSoft,
    marginBottom: 24,
  },
  waitlistLink: {
    marginTop: 8,
    alignItems: "center",
    padding: 12,
  },
  skipLink: {
    marginTop: 4,
    alignItems: "center",
    padding: 16,
  },
  skipText: {
    fontFamily: "System",
    fontSize: 14,
    color: C.boneFaint,
    textDecorationLine: "underline",
  },
});
