import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { learnService } from "../../services/learnService";
import { handleApiError, getAssetUrl } from "../../services/api";
import type { LearnSessionResponse } from "../../types/api";
import { Volume2, Check } from "lucide-react-native";
import { useSpeech } from "../../hooks/useSpeech";
import { colors } from "../../lib/tw";
import { CountdownText } from "../../components/ui/CountdownText";
import {
  ExerciseHeader,
  ProgressBar,
  ExerciseOptions,
} from "../../components/exercise";

type Phase = "loading" | "display" | "exercise" | "result" | "complete";

const DISPLAY_DURATION = 3000; // 展示階段 3 秒
const EXERCISE_DURATION = 3000; // 答題時間 3 秒
const COUNTDOWN_INTERVAL = 50; // 更新間隔 50ms 以實現平滑倒數

export default function LearnScreen() {
  const router = useRouter();
  const { speak, isSpeaking } = useSpeech();
  const { width } = useWindowDimensions();

  // 寬螢幕時使用較窄的內容寬度
  const isWideScreen = width > 600;
  const contentMaxWidth = isWideScreen ? 480 : undefined;

  const [session, setSession] = useState<LearnSessionResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(DISPLAY_DURATION);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentWord = session?.words[currentIndex];
  const currentExercise = session?.exercises[currentIndex];
  const totalWords = session?.words.length || 0;

  // 清理計時器
  const clearTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 載入學習 Session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await learnService.getSession();
        if (!data.available) {
          Alert.alert("無法學習", data.reason || "目前無法學習新單字", [
            { text: "返回", onPress: () => router.back() },
          ]);
          return;
        }
        setSession(data);
        setPhase("display");
      } catch (error) {
        Alert.alert("載入失敗", handleApiError(error), [
          { text: "返回", onPress: () => router.back() },
        ]);
      }
    };
    loadSession();

    return () => clearTimers();
  }, [router]);

  // 展示階段：自動播放音檔 + 3秒後自動進入練習
  useEffect(() => {
    if (phase === "display" && currentWord) {
      // 播放音檔
      speak(currentWord.word, getAssetUrl(currentWord.audio_url));

      // 重置倒數
      const start = Date.now();
      setRemainingMs(DISPLAY_DURATION);

      // 設定倒數計時器
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, DISPLAY_DURATION - elapsed);
        setRemainingMs(remaining);

        if (remaining <= 0) {
          clearTimers();
          setPhase("exercise");
          setSelectedOptionIndex(null);
        }
      }, COUNTDOWN_INTERVAL);
    }

    return () => clearTimers();
  }, [phase, currentIndex, currentWord, speak]);

  // 練習階段：3秒倒數，超時自動答錯
  useEffect(() => {
    if (phase === "exercise" && currentExercise) {
      // 重置倒數
      const start = Date.now();
      setRemainingMs(EXERCISE_DURATION);

      // 設定倒數計時器
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, EXERCISE_DURATION - elapsed);
        setRemainingMs(remaining);

        if (remaining <= 0) {
          clearTimers();
          handleTimeout();
        }
      }, COUNTDOWN_INTERVAL);
    }

    return () => clearTimers();
  }, [phase, currentIndex]);

  // 超時處理
  const handleTimeout = () => {
    if (selectedOptionIndex !== null) return; // 已經選過了

    setSelectedOptionIndex(-1); // -1 表示超時未作答
    setPhase("result");

    // 1.5 秒後進入下一個單字
    setTimeout(() => {
      goToNext();
    }, 1500);
  };

  // 處理選項點擊
  const handleOptionSelect = (index: number) => {
    if (selectedOptionIndex !== null) return; // 已選擇過

    clearTimers();
    setSelectedOptionIndex(index);
    setPhase("result");

    // 1.5 秒後進入下一個單字
    setTimeout(() => {
      goToNext();
    }, 1500);
  };

  // 前往下一個單字
  const goToNext = () => {
    if (currentIndex < totalWords - 1) {
      setCurrentIndex((prev) => prev + 1);
      setPhase("display");
    } else {
      setPhase("complete");
      completeSession();
    }
  };

  // 完成學習
  const completeSession = async () => {
    if (!session) return;

    try {
      const wordIds = session.words.map((w) => w.id);
      await learnService.complete(wordIds);
    } catch (error) {
      console.error("Complete session error:", error);
    }
  };

  // 返回首頁
  const handleBack = () => {
    clearTimers();
    Alert.alert("確定離開？", "學習進度將不會保存", [
      { text: "取消", style: "cancel" },
      { text: "離開", style: "destructive", onPress: () => router.back() },
    ]);
  };

  if (phase === "loading") {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>載入中...</Text>
      </SafeAreaView>
    );
  }

  if (phase === "complete") {
    return (
      <SafeAreaView style={styles.completeContainer}>
        <View style={styles.successIconContainer}>
          <Check size={48} color={colors.success} />
        </View>
        <Text style={styles.completeTitle}>
          學習完成！
        </Text>
        <Text style={styles.completeSubtitle}>
          你已學習 {totalWords} 個新單字{"\n"}
          10 分鐘後可以開始練習
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace("/(main)")}
        >
          <Text style={styles.primaryButtonText}>
            返回首頁
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ExerciseHeader
        title="學習中"
        currentIndex={currentIndex}
        total={totalWords}
        onBack={handleBack}
      />

      {/* Progress Bar */}
      <ProgressBar
        total={totalWords}
        currentIndex={currentIndex}
      />

      {/* Content */}
      <View style={[styles.content, contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: "center", width: "100%" } : null]}>
        {phase === "display" && currentWord && (
          <View style={styles.displayContent}>
            {/* 倒數計時 */}
            <CountdownText remainingMs={remainingMs} />

            {/* 圖片 */}
            {currentWord.image_url && (
              <Image
                source={{ uri: getAssetUrl(currentWord.image_url) || undefined }}
                style={styles.wordImage}
                resizeMode="contain"
              />
            )}

            {/* 單字 */}
            <Text style={styles.wordText}>
              {currentWord.word}
            </Text>

            {/* 翻譯 */}
            <Text style={styles.translationText}>
              {currentWord.translation}
            </Text>

            {/* 音檔狀態 */}
            <View style={styles.audioStatus}>
              <Volume2
                size={24}
                color={isSpeaking ? colors.success : colors.mutedForeground}
              />
              <Text style={styles.audioStatusText}>
                {isSpeaking ? "播放中..." : "已播放"}
              </Text>
            </View>
          </View>
        )}

        {(phase === "exercise" || phase === "result") && currentExercise && currentWord && (
          <View style={styles.exerciseContent}>
            {/* 倒數計時（只在答題時顯示） */}
            {phase === "exercise" && (
              <CountdownText remainingMs={remainingMs} />
            )}

            <Text style={styles.exerciseWordText}>
              {currentWord.word}
            </Text>
            <Text style={styles.exerciseInstructions}>
              選出正確的翻譯
            </Text>

            {/* Options */}
            <ExerciseOptions
              options={currentExercise.options}
              selectedIndex={selectedOptionIndex}
              correctIndex={currentExercise.correct_index}
              showResult={phase === "result"}
              onSelect={handleOptionSelect}
              disabled={phase === "result"}
              layout={currentExercise.type === "reading_lv1" ? "grid" : "list"}
              showImage={currentExercise.type === "reading_lv1"}
            />

            {/* 超時提示 */}
            {phase === "result" && selectedOptionIndex === -1 && (
              <Text style={styles.timeoutText}>時間到！</Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Loading screen
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: colors.mutedForeground,
    marginTop: 16,
  },

  // Complete screen
  completeContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 9999,
    backgroundColor: `${colors.success}33`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  completeTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: colors.foreground,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 18,
    color: colors.mutedForeground,
    textAlign: "center",
    marginBottom: 32,
  },

  // Primary button
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primaryForeground,
  },

  // Main container
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Content
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  // Display phase
  displayContent: {
    alignItems: "center",
  },
  wordImage: {
    width: 160,
    height: 160,
    borderRadius: 16,
    backgroundColor: colors.muted,
    marginBottom: 24,
  },
  wordText: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.foreground,
    marginBottom: 8,
  },
  translationText: {
    fontSize: 24,
    color: colors.mutedForeground,
    marginBottom: 16,
  },
  audioStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  audioStatusText: {
    color: colors.mutedForeground,
    marginLeft: 8,
  },

  // Exercise phase
  exerciseContent: {
    width: "100%",
    alignItems: "center",
  },
  exerciseWordText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.foreground,
    marginBottom: 8,
  },
  exerciseInstructions: {
    fontSize: 16,
    color: colors.mutedForeground,
    marginBottom: 32,
  },
  timeoutText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.destructive,
    marginTop: 16,
  },
});
