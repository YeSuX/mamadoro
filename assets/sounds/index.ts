import type { AudioSource } from "expo-audio";

/**
 * 音频资源映射。
 * 免费来源：https://mixkit.co/free-sound-effects/
 */
export const SOUND_ASSETS: Record<string, AudioSource> = {
  bell: require("./bell-notification.wav"),
  correct: require("./correct-answer-tone.wav"),
  fart: require("./cartoon-strong-fart.wav"),
  magic: require("./magic-transition-sweep-presentation.wav"),
  cheer: require("./small-group-cheer-and-applause.wav"),
  none: null,
};
