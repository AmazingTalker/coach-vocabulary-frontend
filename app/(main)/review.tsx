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
import { reviewService } from "../../services/reviewService";
import { handleApiError, getAssetUrl } from "../../services/api";
import type { ReviewSessionResponse, AnswerSchema } from "../../types/api";
import { ArrowLeft, Check, X, Volume2 } from "lucide-react-native";
import { useSpeech } from "../../hooks/useSpeech";
import { colors } from "../../lib/tw";
import { CountdownText } from "../../components/ui/CountdownText";

type Phase = "loading" | "display" | "exercise" | "result" | "complete";

const DISPLAY_DURATION = 3000; // 展示階段 3 秒
const EXERCISE_DURATION = 3000; // 答題時間 3 秒
const COUNTDOWN_INTERVAL = 50; // 更新間隔 50ms

export default function ReviewScreen() {
  const router = useRouter();
  const { speak, isSpeaking } = useSpeech();
  const { width } = useWindowDimensions();

  // 寬螢幕時使用較窄的內容寬度
  const isWideScreen = width > 600;
  const contentMaxWidth = isWideScreen ? 480 : undefined;

  const [session, setSession] = useState<ReviewSessionResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<AnswerSchema[]>([]);
  const [displayCompleted, setDisplayCompleted] = useState(false);
  const [remainingMs, setRemainingMs] = useState(EXERCISE_DURATION);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const words = session?.words || [];
  const exercises = session?.exercises || [];
  const currentWord = words[currentIndex];
  const currentExercise = exercises[currentIndex];
  const totalWords = words.length;

  // 清理計時器
  const clearTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 載入複習 Session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await reviewService.getSession();
        if (!data.available) {
          Alert.alert("無法複習", data.reason || "目前沒有需要複習的單字", [
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

  // 展示階段：自動播放發音 + 3秒後自動進入練習
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
          goToExercise();
        }
      }, COUNTDOWN_INTERVAL);
    }

    return () => clearTimers();
  }, [phase, currentIndex, currentWord, speak]);

  // 練習階段倒數計時
  useEffect(() => {
    if (phase === "exercise" && currentExercise) {
      const start = Date.now();
      setRemainingMs(EXERCISE_DURATION);

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
    if (selectedOptionIndex !== null) return;

    setSelectedOptionIndex(-1);
    setAnswers((prev) => [
      ...prev,
      { word_id: currentWord!.id, correct: false },
    ]);
    setPhase("result");

    setTimeout(() => {
      goToNext();
    }, 1500);
  };

  const getPoolLabel = (pool: string): string => {
    return `複習池 ${pool}`;
  };

  // 進入練習階段
  const goToExercise = async () => {
    // 如果還沒完成展示階段，先通知後端
    if (!displayCompleted) {
      try {
        const wordIds = words.map((w) => w.id);
        await reviewService.complete(wordIds);
        setDisplayCompleted(true);
      } catch (error) {
        console.error("Review complete error:", error);
      }
    }

    setPhase("exercise");
    setSelectedOptionIndex(null);
  };

  // 處理選項點擊
  const handleOptionSelect = (index: number) => {
    if (selectedOptionIndex !== null) return;

    clearTimers();
    setSelectedOptionIndex(index);
    const correct = index === currentExercise?.correct_index;

    setAnswers((prev) => [
      ...prev,
      { word_id: currentWord!.id, correct },
    ]);

    setPhase("result");

    setTimeout(() => {
      goToNext();
    }, 1500);
  };

  // 進入下一題
  const goToNext = () => {
    if (currentIndex < totalWords - 1) {
      setCurrentIndex((prev) => prev + 1);
      setPhase("display");
      setSelectedOptionIndex(null);
    } else {
      completeSession();
    }
  };

  // 完成複習
  const completeSession = async () => {
    setPhase("complete");

    try {
      await reviewService.submit(answers);
    } catch (error) {
      console.error("Submit review error:", error);
    }
  };

  // 返回
  const handleBack = () => {
    clearTimers();
    Alert.alert("確定離開？", "複習進度將不會保存", [
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
    const correctCount = answers.filter((a) => a.correct).length;
    return (
      <SafeAreaView style={styles.completeContainer}>
        <View style={styles.completeIconContainer}>
          <Check size={48} color={colors.success} />
        </View>
        <Text style={styles.completeTitle}>
          複習完成！
        </Text>
        <Text style={styles.completeSubtitle}>
          答對 {correctCount} / {totalWords} 題
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          複習中 {currentIndex + 1} / {totalWords}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        {answers.map((answer, i) => (
          <View
            key={i}
            style={[
              styles.progressBarItem,
              answer.correct ? styles.progressSuccess : styles.progressDestructive,
            ]}
          />
        ))}
        {Array.from({ length: totalWords - answers.length }).map((_, i) => (
          <View
            key={`pending-${i}`}
            style={[
              styles.progressBarItem,
              i === 0 ? styles.progressPrimary : styles.progressMuted,
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <View style={[styles.contentContainer, contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: "center", width: "100%" } : null]}>
        {phase === "display" && currentWord && (
          <View style={styles.displayContainer}>
            {/* 倒數計時 */}
            <CountdownText remainingMs={remainingMs} />

            {/* Pool 標籤 */}
            <View style={styles.poolBadge}>
              <Text style={styles.poolBadgeText}>
                {getPoolLabel(currentWord.pool)}
              </Text>
            </View>

            {currentWord.image_url && (
              <Image
                source={{ uri: getAssetUrl(currentWord.image_url) || undefined }}
                style={styles.wordImage}
                resizeMode="contain"
              />
            )}
            <Text style={styles.wordText}>
              {currentWord.word}
            </Text>
            <Text style={styles.translationText}>
              {currentWord.translation}
            </Text>

            <View style={styles.speakerContainer}>
              <Volume2
                size={24}
                color={isSpeaking ? colors.primary : colors.mutedForeground}
              />
              <Text style={styles.speakerText}>
                {isSpeaking ? "播放中..." : "已播放"}
              </Text>
            </View>
          </View>
        )}

        {(phase === "exercise" || phase === "result") && currentExercise && currentWord && (
          <View style={styles.exerciseContainer}>
            {/* Pool 標籤 */}
            <View style={styles.poolBadge}>
              <Text style={styles.poolBadgeText}>
                {getPoolLabel(currentWord.pool)}
              </Text>
            </View>

            {/* 倒數計時（僅在答題階段） */}
            {phase === "exercise" && (
              <CountdownText remainingMs={remainingMs} />
            )}

            {/* 超時提示 */}
            {phase === "result" && selectedOptionIndex === -1 && (
              <Text style={styles.timeoutText}>時間到！</Text>
            )}

            <Text style={styles.exerciseWordText}>
              {currentWord.word}
            </Text>
            <Text style={styles.exerciseHintText}>
              選出正確的翻譯
            </Text>

            <View style={styles.optionsContainer}>
              {currentExercise.options.map((option, index) => {
                const isSelected = selectedOptionIndex === index;
                const isCorrectOption = index === currentExercise.correct_index;
                const showResult = phase === "result";

                let optionStyle = [styles.optionButton, styles.optionDefault];
                if (showResult) {
                  if (isCorrectOption) {
                    optionStyle = [styles.optionButton, styles.optionCorrect];
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = [styles.optionButton, styles.optionWrong];
                  }
                } else if (isSelected) {
                  optionStyle = [styles.optionButton, styles.optionSelected];
                }

                return (
                  <TouchableOpacity
                    key={option.word_id}
                    style={optionStyle}
                    onPress={() => handleOptionSelect(index)}
                    disabled={showResult}
                  >
                    {option.image_url && (
                      <Image
                        source={{ uri: getAssetUrl(option.image_url) || undefined }}
                        style={styles.optionImage}
                        resizeMode="contain"
                      />
                    )}
                    <Text style={styles.optionText}>
                      {option.translation}
                    </Text>
                    {showResult && isCorrectOption && (
                      <Check size={24} color={colors.success} />
                    )}
                    {showResult && isSelected && !isCorrectOption && (
                      <X size={24} color={colors.destructive} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
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
  completeIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
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

  // Main container
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.foreground,
  },
  headerSpacer: {
    width: 40,
  },

  // Progress bar
  progressBarContainer: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  progressBarItem: {
    flex: 1,
    height: 8,
    borderRadius: 9999,
  },
  progressSuccess: {
    backgroundColor: colors.success,
  },
  progressDestructive: {
    backgroundColor: colors.destructive,
  },
  progressPrimary: {
    backgroundColor: colors.primary,
  },
  progressMuted: {
    backgroundColor: colors.muted,
  },

  // Content
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  // Pool badge
  poolBadge: {
    backgroundColor: `${colors.accent}1A`,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    marginBottom: 16,
  },
  poolBadgeText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: "600",
  },

  // Timeout text
  timeoutText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.destructive,
    marginBottom: 16,
  },

  // Display phase
  displayContainer: {
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
  speakerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  speakerText: {
    color: colors.mutedForeground,
    marginLeft: 8,
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

  // Exercise phase
  exerciseContainer: {
    width: "100%",
    alignItems: "center",
  },
  exerciseWordText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.foreground,
    marginBottom: 8,
  },
  exerciseHintText: {
    fontSize: 16,
    color: colors.mutedForeground,
    marginBottom: 32,
  },
  optionsContainer: {
    width: "100%",
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionDefault: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  optionSelected: {
    backgroundColor: `${colors.primary}1A`,
    borderColor: colors.primary,
  },
  optionCorrect: {
    backgroundColor: `${colors.success}33`,
    borderColor: colors.success,
  },
  optionWrong: {
    backgroundColor: `${colors.destructive}33`,
    borderColor: colors.destructive,
  },
  optionImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.muted,
    marginRight: 16,
  },
  optionText: {
    fontSize: 18,
    color: colors.foreground,
    flex: 1,
  },
});
