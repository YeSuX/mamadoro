import { AVPlaybackSource } from "expo-av";

/**
 * 音频资源映射。
 * 在 assets/sounds/ 下放置同名 .wav 文件后取消对应注释即可。
 *
 * 推荐规格：WAV / 16-bit / 44.1kHz / 单声道 / 1-3 秒
 * 免费来源：https://freesound.org  https://mixkit.co/free-sound-effects/
 */
export const SOUND_ASSETS: Record<string, AVPlaybackSource | null> = {
  default: require("./default.wav"),
  bell: require("./bell.wav"),
  chime: require("./chime.wav"),
  // marimba: require("./marimba.wav"),
  // default: null,
  // bell: null,
  // chime: null,
  marimba: null,
  none: null,
};
