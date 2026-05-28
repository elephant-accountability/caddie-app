/**
 * Caddie Share Extension — receives shared content and sends it to the app.
 *
 * Text/URLs → opens host app via deep link → /api/capture handles it
 * Images → stored in app group, opens host app to process
 */
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import {
  Text,
  close,
  openHostApp,
  clearAppGroupContainer,
} from "expo-share-extension";
import type { InitialProps } from "expo-share-extension";

const API_URL = "https://caddie-core.fly.dev";

export default function ShareExtension({
  url,
  text,
  images,
  files,
}: InitialProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const shared = url || text || "";
  const hasImages = images && images.length > 0;
  const hasFiles = files && files.length > 0;
  const preview =
    shared.length > 200 ? shared.substring(0, 200) + "…" : shared;

  const handleSend = async () => {
    setStatus("sending");

    try {
      if (hasImages) {
        // Open host app to handle image capture (needs camera roll access)
        const imagePath = encodeURIComponent(images![0]);
        openHostApp(`capture?type=photo&content=${imagePath}`);
        return;
      }

      if (hasFiles) {
        const filePath = encodeURIComponent(files![0]);
        openHostApp(`capture?type=file&content=${filePath}`);
        return;
      }

      // Text/URL — send directly to API via bulk-import
      const payload = url
        ? { mode: "raw_text", raw_text: `Shared URL: ${url}\n\n${text || ""}`, source: "share_sheet" }
        : { mode: "raw_text", raw_text: text || "", source: "share_sheet" };

      const resp = await fetch(`${API_URL}/api/bulk-import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Caddie-Rep-Id": "chris-kenney",
        },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        setStatus("done");
        setMessage("Saved to Caddie");
        setTimeout(() => close(), 1200);
      } else {
        // Fallback: open host app
        const content = encodeURIComponent(shared);
        openHostApp(`capture?type=text&content=${content}`);
      }
    } catch {
      // Network error — open host app as fallback
      const content = encodeURIComponent(shared);
      openHostApp(`capture?type=text&content=${content}`);
    }
  };

  const handleCancel = () => {
    clearAppGroupContainer();
    close();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Send to Caddie</Text>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.preview}>
          {hasImages && (
            <Image
              source={{ uri: images![0] }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          )}
          {preview ? (
            <Text style={styles.previewText} allowFontScaling={false}>
              {preview}
            </Text>
          ) : hasFiles ? (
            <Text style={styles.previewText} allowFontScaling={false}>
              📎 {files![0].split("/").pop()}
            </Text>
          ) : null}
        </View>

        {status === "done" ? (
          <View style={styles.doneRow}>
            <Text style={styles.doneText}>✓ {message}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={status === "sending"}
          >
            {status === "sending" ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.sendText}>Save to Vault</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  card: {
    backgroundColor: "#1A1A2E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cancelText: {
    fontSize: 15,
    color: "#8888AA",
  },
  preview: {
    backgroundColor: "#0A0A0F",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    minHeight: 60,
  },
  previewText: {
    fontSize: 14,
    color: "#CCCCDD",
    lineHeight: 20,
  },
  imagePreview: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  sendButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  sendText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  doneRow: {
    alignItems: "center",
    paddingVertical: 14,
  },
  doneText: {
    fontSize: 16,
    color: "#22C55E",
    fontWeight: "600",
  },
});
