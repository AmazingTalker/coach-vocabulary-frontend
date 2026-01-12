import { TouchableOpacity, Text, Image, StyleSheet } from "react-native";
import { Check, X } from "lucide-react-native";
import { exerciseStyles, colors } from "./styles";
import { getAssetUrl } from "../../services/api";
import type { OptionSchema } from "../../types/api";

export interface OptionButtonProps {
  option: OptionSchema;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  showResult: boolean;
  onPress: () => void;
  disabled?: boolean;
  layout?: "list" | "grid";
  showImage?: boolean;
}

export function OptionButton({
  option,
  index,
  isSelected,
  isCorrect,
  showResult,
  onPress,
  disabled = false,
  layout = "list",
  showImage = false,
}: OptionButtonProps) {
  const isGridLayout = layout === "grid";

  // Determine button style based on state
  const baseStyle = isGridLayout
    ? exerciseStyles.optionBaseGrid
    : exerciseStyles.optionBase;

  let stateStyle = exerciseStyles.optionDefault;
  if (showResult) {
    if (isCorrect) {
      stateStyle = exerciseStyles.optionCorrect;
    } else if (isSelected && !isCorrect) {
      stateStyle = exerciseStyles.optionIncorrect;
    }
  } else if (isSelected) {
    stateStyle = exerciseStyles.optionSelected;
  }

  return (
    <TouchableOpacity
      style={[baseStyle, stateStyle]}
      onPress={onPress}
      disabled={disabled}
    >
      {showImage && option.image_url && (
        <Image
          source={{ uri: getAssetUrl(option.image_url) || undefined }}
          style={
            isGridLayout
              ? exerciseStyles.optionImageGrid
              : exerciseStyles.optionImage
          }
          resizeMode="contain"
        />
      )}
      <Text
        style={
          isGridLayout
            ? exerciseStyles.optionTextGrid
            : exerciseStyles.optionText
        }
      >
        {option.translation}
      </Text>
      {showResult && isCorrect && (
        <Check
          size={24}
          color={colors.success}
          style={isGridLayout ? exerciseStyles.resultIcon : undefined}
        />
      )}
      {showResult && isSelected && !isCorrect && (
        <X
          size={24}
          color={colors.destructive}
          style={isGridLayout ? exerciseStyles.resultIcon : undefined}
        />
      )}
    </TouchableOpacity>
  );
}
