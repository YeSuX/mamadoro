import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PALETTE } from "@/components/onboarding/constants";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: PALETTE.accent,
        tabBarInactiveTintColor: PALETTE.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: PALETTE.cardBg,
          borderTopColor: PALETTE.cardBorder,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "首页",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "设置",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="test"
        options={{
          title: "测试",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="flask.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
