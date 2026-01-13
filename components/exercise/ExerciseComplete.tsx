import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";
import { colors } from "../../lib/tw";

interface ExerciseCompleteProps {
  title: string;
  subtitle: string;
  onBack: () => void;
}

export function ExerciseComplete({
  title,
  subtitle,
  onBack,
}: ExerciseCompleteProps) {
  return (
    <SafeAreaView style={styles.completeContainer}>
      <View style={styles.completeIconContainer}>
        <Check size={48} color={colors.success} />
      </View>
      <Text style={styles.completeTitle}>{title}</Text>
      <Text style={styles.completeSubtitle}>{subtitle}</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={onBack}>
        <Text style={styles.primaryButtonText}>返回首頁</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
