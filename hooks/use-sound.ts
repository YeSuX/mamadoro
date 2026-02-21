import { useCallback, useEffect, useRef } from "react";
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";

import { SOUND_ASSETS } from "@/assets/sounds";

export function useSound() {
  const playerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
    return () => {
      playerRef.current?.remove();
    };
  }, []);

  const play = useCallback(async (name: string) => {
    try {
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }

      const source = SOUND_ASSETS[name];
      if (!source) return;

      const player = createAudioPlayer(source);
      playerRef.current = player;
      player.play();
    } catch {
      // 静默处理音频播放错误，避免阻断主流程
    }
  }, []);

  return { play };
}
