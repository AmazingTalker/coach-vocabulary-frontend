import { StyleSheet } from "react-native";
import { colors } from "../../lib/tw";

export const exerciseStyles = StyleSheet.create({
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
  progressBarSuccess: {
    backgroundColor: colors.success,
  },
  progressBarDestructive: {
    backgroundColor: colors.destructive,
  },
  progressBarPrimary: {
    backgroundColor: colors.primary,
  },
  progressBarMuted: {
    backgroundColor: colors.muted,
  },

  // Options container
  optionsContainer: {
    width: "100%",
    gap: 12,
  },
  optionsContainerGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },

  // Option button base
  optionBase: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionBaseGrid: {
    width: "48%",
    flexDirection: "column",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },

  // Option button states
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
  optionIncorrect: {
    backgroundColor: `${colors.destructive}33`,
    borderColor: colors.destructive,
  },

  // Option image
  optionImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.muted,
    marginRight: 16,
  },
  optionImageGrid: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: colors.muted,
    marginBottom: 8,
  },

  // Option text
  optionText: {
    fontSize: 18,
    color: colors.foreground,
    flex: 1,
  },
  optionTextGrid: {
    fontSize: 16,
    color: colors.foreground,
    textAlign: "center",
  },

  // Result icon position (for grid layout)
  resultIcon: {
    position: "absolute",
    top: 8,
    right: 8,
  },
});

export { colors };
