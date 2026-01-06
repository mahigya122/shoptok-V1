import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { colors } from "../constants/colors";

type State = { hasError: boolean; error?: Error | null; info?: string };

export default class ErrorBoundary extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null, info: undefined };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    this.setState({ error, info: info?.componentStack });
    // keep visible console error for devs
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children as any;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Unexpected error</Text>
        <Text style={styles.message}>{this.state.error?.message}</Text>
        <ScrollView style={styles.stack}>
          <Text style={styles.stackText}>{this.state.info}</Text>
        </ScrollView>
        <TouchableOpacity onPress={() => this.setState({ hasError: false, error: null, info: undefined })} style={styles.button}>
          <Text style={styles.buttonText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background, justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 8 },
  message: { color: colors.textMuted, marginBottom: 12 },
  stack: { maxHeight: 300, marginBottom: 12 },
  stackText: { color: colors.text, fontFamily: undefined },
  button: { backgroundColor: colors.primary, padding: 12, borderRadius: 10, alignSelf: "flex-start" },
  buttonText: { color: "#111", fontWeight: "700" },
});
