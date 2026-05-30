import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { ConnectorEntry } from "@/onboarding/connectorRegistry";

// ── Design tokens (caddie_design.md Field skin) ────────────────────
const C = {
  olive2: "#24271F",
  border: "#3A3F35",
  bone: "#E8E2D2",
  boneSoft: "#C9C2B0",
  boneFaint: "#8A8474",
  safety: "#E85A1D",
  safetyPressed: "#C84812",
  oliveDeep: "#1C1E18",
} as const;

interface Props {
  connector: ConnectorEntry;
  detected: boolean;
  onConnect: (id: string) => void;
  onNotify: (id: string) => void;
}

export function ConnectorCard({ connector, detected, onConnect, onNotify }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isWired = connector.status === "wired";

  const truncated =
    connector.dataPromise.length > 90 && !expanded
      ? connector.dataPromise.slice(0, 87) + "…"
      : connector.dataPromise;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{connector.displayName}</Text>
        {detected && <View style={styles.dot} />}
      </View>

      <Pressable onPress={() => setExpanded(!expanded)}>
        <Text style={styles.promise}>{truncated}</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => (isWired ? onConnect(connector.id) : onNotify(connector.id))}
      >
        <Text style={styles.buttonText}>
          {isWired ? "Connect →" : "Notify me →"}
        </Text>
      </Pressable>
    </View>
  );
}

// ── Apple always-on card ───────────────────────────────────────────
export function AppleServicesCard({ services }: { services: { name: string; dataPromise: string }[] }) {
  return (
    <View style={[styles.card, styles.appleCard]}>
      <Text style={styles.name}>Always-on Apple services</Text>
      <Text style={styles.appleSubtitle}>Available without setup</Text>
      {services.map((s) => (
        <View key={s.name} style={styles.appleRow}>
          <Text style={styles.appleName}>{s.name}</Text>
          <Text style={styles.applePromise}>{s.dataPromise}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.olive2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 0, // hard corners per spec
    padding: 16,
    marginBottom: 12,
  },
  appleCard: {
    borderStyle: "dashed",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  name: {
    fontFamily: "System",
    fontWeight: "700",
    fontSize: 17,
    color: C.bone,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.safety,
  },
  promise: {
    fontFamily: "System",
    fontSize: 14,
    lineHeight: 20,
    color: C.boneSoft,
    marginBottom: 12,
  },
  button: {
    backgroundColor: C.safety,
    borderRadius: 4, // max per spec
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    minHeight: 48, // tap target per spec
  },
  buttonPressed: {
    backgroundColor: C.safetyPressed,
  },
  buttonText: {
    fontFamily: "System",
    fontWeight: "600",
    fontSize: 15,
    color: C.bone,
  },
  appleSubtitle: {
    fontFamily: "System",
    fontSize: 13,
    color: C.boneFaint,
    marginBottom: 12,
  },
  appleRow: {
    marginBottom: 8,
  },
  appleName: {
    fontFamily: "System",
    fontWeight: "600",
    fontSize: 14,
    color: C.bone,
  },
  applePromise: {
    fontFamily: "System",
    fontSize: 13,
    color: C.boneFaint,
    marginTop: 2,
  },
});
