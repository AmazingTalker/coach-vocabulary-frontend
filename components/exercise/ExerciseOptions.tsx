import { View } from "react-native";
import { OptionButton } from "./OptionButton";
import { exerciseStyles } from "./styles";
import type { OptionSchema } from "../../types/api";

export interface ExerciseOptionsProps {
  options: OptionSchema[];
  selectedIndex: number | null;
  correctIndex: number | null;
  showResult: boolean;
  onSelect: (index: number) => void;
  disabled?: boolean;
  layout?: "list" | "grid";
  showImage?: boolean;
}

export function ExerciseOptions({
  options,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
  disabled = false,
  layout = "list",
  showImage = false,
}: ExerciseOptionsProps) {
  const containerStyle =
    layout === "grid"
      ? exerciseStyles.optionsContainerGrid
      : exerciseStyles.optionsContainer;

  return (
    <View style={containerStyle}>
      {options.map((option, index) => (
        <OptionButton
          key={option.word_id}
          option={option}
          index={index}
          isSelected={selectedIndex === index}
          isCorrect={index === correctIndex}
          showResult={showResult}
          onPress={() => onSelect(index)}
          disabled={disabled}
          layout={layout}
          showImage={showImage}
        />
      ))}
    </View>
  );
}
