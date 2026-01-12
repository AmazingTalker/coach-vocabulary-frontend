import { View } from "react-native";
import { exerciseStyles } from "./styles";

export interface ProgressBarProps {
  total: number;
  currentIndex: number;
  answers?: { correct: boolean }[];
}

export function ProgressBar({
  total,
  currentIndex,
  answers,
}: ProgressBarProps) {
  // If answers are provided, show correct/incorrect states
  if (answers) {
    const answeredCount = answers.length;
    const pendingCount = total - answeredCount;

    return (
      <View style={exerciseStyles.progressBarContainer}>
        {/* Answered items */}
        {answers.map((answer, i) => (
          <View
            key={i}
            style={[
              exerciseStyles.progressBarItem,
              answer.correct
                ? exerciseStyles.progressBarSuccess
                : exerciseStyles.progressBarDestructive,
            ]}
          />
        ))}
        {/* Pending items */}
        {Array.from({ length: pendingCount }).map((_, i) => (
          <View
            key={`pending-${i}`}
            style={[
              exerciseStyles.progressBarItem,
              i === 0
                ? exerciseStyles.progressBarPrimary
                : exerciseStyles.progressBarMuted,
            ]}
          />
        ))}
      </View>
    );
  }

  // Simple mode: just show completed/current/pending based on currentIndex
  return (
    <View style={exerciseStyles.progressBarContainer}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            exerciseStyles.progressBarItem,
            i < currentIndex && exerciseStyles.progressBarSuccess,
            i === currentIndex && exerciseStyles.progressBarPrimary,
            i > currentIndex && exerciseStyles.progressBarMuted,
          ]}
        />
      ))}
    </View>
  );
}
