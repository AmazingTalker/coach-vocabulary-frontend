import { useCallback, useState, useRef, useEffect } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";
import * as Speech from "expo-speech";

interface UseSpeechReturn {
  speak: (text: string, audioUrl?: string | null) => Promise<void>;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

/**
 * 語音播放 Hook（跨平台支援）
 *
 * 優先使用提供的音檔 URL（透過 expo-av），
 * 若播放失敗則使用 TTS 作為備案（透過 expo-speech）
 *
 * 支援平台：Web、iOS、Android
 */
export function useSpeech(): UseSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // 所有平台都支援
  const isSupported = true;

  const cancel = useCallback(async () => {
    // 停止音檔播放
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (error) {
        console.warn("Error stopping audio:", error);
      }
      soundRef.current = null;
    }

    // 停止 TTS
    Speech.stop();

    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string, audioUrl?: string | null): Promise<void> => {
      // 取消之前的播放
      await cancel();

      // 如果有音檔 URL，優先使用音檔
      if (audioUrl) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: true }
          );
          soundRef.current = sound;
          setIsSpeaking(true);

          return new Promise<void>((resolve) => {
            sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
              if (status.isLoaded && status.didJustFinish) {
                setIsSpeaking(false);
                sound.unloadAsync();
                soundRef.current = null;
                resolve();
              }
            });
          });
        } catch (error) {
          console.warn("Audio playback failed, falling back to TTS:", error);
          // 繼續使用 TTS 作為備案
        }
      }

      // 備案：使用 TTS
      return new Promise<void>((resolve) => {
        setIsSpeaking(true);
        Speech.speak(text, {
          language: "en-US",
          rate: 0.9,
          onDone: () => {
            setIsSpeaking(false);
            resolve();
          },
          onError: () => {
            setIsSpeaking(false);
            resolve();
          },
        });
      });
    },
    [cancel]
  );

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      Speech.stop();
    };
  }, []);

  return { speak, cancel, isSpeaking, isSupported };
}
