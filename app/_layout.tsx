import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { Text, View } from "react-native";

import { getDb } from "@/db";
import migrations from "@/drizzle/migrations";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { hasSettings } from "@/services/settings";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { success, error } = useMigrations(getDb(), migrations);
  const [destination, setDestination] = useState<
    "main" | "onboarding" | null
  >(null);

  useEffect(() => {
    if (!success) return;
    hasSettings().then((exists) =>
      setDestination(exists ? "main" : "onboarding"),
    );
  }, [success]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Migration error: {error.message}</Text>
      </View>
    );
  }

  if (!success || destination === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      {destination === "onboarding" && <Redirect href="/onboarding" />}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
