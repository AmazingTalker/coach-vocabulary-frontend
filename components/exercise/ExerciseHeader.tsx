import { View, Text, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { exerciseStyles, colors } from "./styles";

export interface ExerciseHeaderProps {
  title: string;
  currentIndex: number;
  total: number;
  onBack: () => void;
}

export function ExerciseHeader({
  title,
  currentIndex,
  total,
  onBack,
}: ExerciseHeaderProps) {
  return (
    <View style={exerciseStyles.header}>
      <TouchableOpacity style={exerciseStyles.backButton} onPress={onBack}>
        <ArrowLeft size={24} color={colors.foreground} />
      </TouchableOpacity>
      <Text style={exerciseStyles.headerTitle}>
        {title} ({currentIndex + 1}/{total})
      </Text>
      <View style={exerciseStyles.headerSpacer} />
    </View>
  );
}
