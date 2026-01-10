import React from "react"; 
import { Image, View, StyleSheet } from "react-native";
import { colors } from "../constants/colors";

interface AvatarProps {
  url?: string;
  size?: number;
  followed?: boolean;
}

export default function Avatar({ url, size = 36, followed = false }: AvatarProps) {
  return (
    <View
      style={[
        styles.wrap,
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2, 
          borderColor: followed ? colors.primary : colors.border 
        }
      ]}
    >
      <Image 
        source={{ uri: url || "https://picsum.photos/100" }} 
        style={{ width: size, height: size, borderRadius: size / 2 }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 2 }
});
