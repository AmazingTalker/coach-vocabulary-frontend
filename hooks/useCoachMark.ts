import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * 管理 coach mark 教學顯示狀態
 *
 * 使用 AsyncStorage 記錄使用者是否已看過該教學，
 * 確保每個教學只在首次出現時顯示。
 */
export function useCoachMark(storageKey: string) {
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const seen = await AsyncStorage.getItem(storageKey);
        setShouldShow(seen !== "true");
      } catch {
        // 讀取失敗時不顯示教學
        setShouldShow(false);
      } finally {
        setIsLoading(false);
      }
    };
    check();
  }, [storageKey]);

  const markAsSeen = useCallback(async () => {
    setShouldShow(false);
    try {
      await AsyncStorage.setItem(storageKey, "true");
    } catch {
      // 寫入失敗不影響使用
      console.warn("Failed to save coach mark state:", storageKey);
    }
  }, [storageKey]);

  return { shouldShow, markAsSeen, isLoading };
}
