import { useCallback, useEffect, useRef } from "react";
import { Audio } from "expo-av";

import { SOUND_ASSETS } from "@/assets/sounds";

export function useSound() {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  }, []);

  const play = useCallback(async (name: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const source = SOUND_ASSETS[name];
      if (!source) return;

      const { sound } = await Audio.Sound.createAsync(source);
      soundRef.current = sound;
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          if (soundRef.current === sound) soundRef.current = null;
        }
      });
    } catch {
      // 静默处理音频播放错误，避免阻断主流程
    }
  }, []);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  return { play };
}
