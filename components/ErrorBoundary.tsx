import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Keep lightweight logging; avoid crashing the app on render errors.
     
    console.warn("ErrorBoundary caught", error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{this.state.error.message}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#330000",
    borderRadius: 12,
    margin: 16,
  },
  title: {
    color: "#ff8080",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  message: {
    color: "#ffd6d6",
    fontSize: 14,
  },
});
