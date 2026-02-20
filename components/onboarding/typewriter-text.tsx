import { useEffect, useState } from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

export function TypewriterText({
  text,
  style,
  containerStyle,
  speed = 50,
}: {
  text: string;
  style?: TextStyle;
  containerStyle?: ViewStyle;
  speed?: number;
}) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return (
    <View style={containerStyle}>
      {/* 透明占位：撑开与完整文字等高的空间，避免打字时布局抖动 */}
      <Text style={[style, { opacity: 0 }]} aria-hidden>
        {text}
      </Text>
      <Text style={[style, StyleSheet.absoluteFillObject]}>{displayed}</Text>
    </View>
  );
}
