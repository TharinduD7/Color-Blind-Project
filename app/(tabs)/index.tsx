import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ---------------------------------------------------------
// ඔයාගේ ESP32 IP එක මෙතන වෙනස් කරන්න
// ---------------------------------------------------------
const ESP_IP_ADDRESS = "192.168.1.10";

export default function HomeScreen() {
  const [temp, setTemp] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [color, setColor] = useState("Waiting...");
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("--:--:--");

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  const connectWebSocket = () => {
    const wsUrl = `ws://${ESP_IP_ADDRESS}/ws`;

    if (ws.current) ws.current.close();
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setConnected(true);
      setColor("Ready");
    };

    ws.current.onmessage = (e) => {
      try {
        const message = typeof e.data === "string" ? e.data : "";
        if (!message) return;

        const data = JSON.parse(message);
        if (data.temp) setTemp(data.temp);
        if (data.hum) setHumidity(data.hum);
        if (data.color) setColor(data.color);

        // update the time
        const now = new Date();
        setLastUpdated(now.toLocaleTimeString());
      } catch (error) {
        console.log("Error parsing JSON:", error);
      }
    };

    ws.current.onclose = () => {
      setConnected(false);
      setTimeout(connectWebSocket, 5000);
    };

    ws.current.onerror = () => {
      // Error handling
    };
  };

  // update the wire color (Electrical Standards අනුව)
  const getWireFunction = (c: string) => {
    const colorLower = c.toLowerCase();
    if (colorLower.includes("red") || colorLower.includes("brown"))
      return "Phase Wire (Live)";
    if (colorLower.includes("blue") || colorLower.includes("black"))
      return "Neutral Wire";
    if (colorLower.includes("green") || colorLower.includes("yellow"))
      return "Earth Wire";
    return "Unknown Wire";
  };

  // check the color
  const getDisplayColor = (c: string) => {
    const colorLower = c.toLowerCase();
    if (colorLower.includes("red")) return "#e74c3c";
    if (colorLower.includes("green")) return "#2ecc71";
    if (colorLower.includes("blue")) return "#3498db";
    if (colorLower.includes("yellow")) return "#f1c40f";
    if (colorLower.includes("black")) return "#2c3e50";
    if (colorLower.includes("brown")) return "#795548";
    return "#95a5a6"; // Default gray
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 1. Header Section (blue part) */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialCommunityIcons name="eye-circle" size={28} color="white" />
            <Text style={styles.headerTitle}> Color Assist IoT</Text>
          </View>
          <View style={styles.connectionBadge}>
            <View
              style={[
                styles.dot,
                { backgroundColor: connected ? "#4ade80" : "#f87171" },
              ]}
            />
            <Text style={styles.connectionText}>
              {connected ? "Connected" : "Offline"}
            </Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          Smart assistant for wire detection
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 2. Main Color Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>DETECTED WIRE COLOR</Text>

          {/* color display */}
          <View
            style={[
              styles.colorBox,
              { backgroundColor: getDisplayColor(color) },
            ]}
          >
            <View style={styles.colorNameTag}>
              <Text style={styles.colorNameText}>{color.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.wireInfoRow}>
            <View>
              <Text style={styles.labelSmall}>Function</Text>
              <Text style={styles.wireFunctionText}>
                {getWireFunction(color)}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.labelSmall}>Confidence</Text>
              <Text style={styles.confidenceText}>98%</Text>
            </View>
          </View>
        </View>

        {/* 3. Sensor Grid (Temp & Humidity) */}
        <View style={styles.gridRow}>
          {/* Temperature */}
          <View style={[styles.sensorCard, { marginRight: 10 }]}>
            <View style={[styles.iconCircle, { backgroundColor: "#fff7ed" }]}>
              <MaterialCommunityIcons
                name="thermometer"
                size={24}
                color="#f97316"
              />
            </View>
            <Text style={styles.sensorLabel}>Temperature</Text>
            <Text style={styles.sensorValue}>{temp.toFixed(1)}°C</Text>
          </View>

          {/* Humidity */}
          <View style={[styles.sensorCard, { marginLeft: 10 }]}>
            <View style={[styles.iconCircle, { backgroundColor: "#eff6ff" }]}>
              <MaterialCommunityIcons
                name="water-percent"
                size={24}
                color="#3b82f6"
              />
            </View>
            <Text style={styles.sensorLabel}>Humidity</Text>
            <Text style={styles.sensorValue}>{humidity.toFixed(0)}%</Text>
          </View>
        </View>

        {/* 4. Last Updated Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Last Updated</Text>
          <Text style={styles.statusTime}>{lastUpdated}</Text>
        </View>
      </ScrollView>

      {/* 5. Bottom Reconnect Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.reconnectBtn}
          onPress={connectWebSocket}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={20}
            color="white"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.btnText}>Reconnect Device</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  // Header Styles
  header: {
    backgroundColor: "#2563eb",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    color: "#bfdbfe",
    fontSize: 14,
  },
  connectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },

  // Scroll Content
  scrollContent: {
    padding: 20,
  },

  // Main Card Styles
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#9ca3af",
    marginBottom: 15,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  colorBox: {
    height: 180,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  colorNameTag: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  colorNameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  wireInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  labelSmall: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  wireFunctionText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  confidenceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6b7280",
  },

  // Grid Styles
  gridRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  sensorCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  sensorLabel: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 5,
  },
  sensorValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },

  // Status Card
  statusCard: {
    backgroundColor: "#e5e7eb",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 80, // Space for bottom button
  },
  statusLabel: {
    color: "#6b7280",
    fontSize: 14,
  },
  statusTime: {
    color: "#374151",
    fontWeight: "bold",
    fontFamily: "Courier", // Monospace font for time
  },

  // Footer Button
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#f3f4f6",
  },
  reconnectBtn: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 15,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
