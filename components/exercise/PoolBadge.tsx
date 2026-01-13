import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../lib/tw";

interface PoolBadgeProps {
  pool: string;
  type?: "practice" | "review";
}

export function PoolBadge({ pool, type = "practice" }: PoolBadgeProps) {
  const getPoolLabel = (pool: string): string => {
    if (type === "review") {
      return `複習池 ${pool}`;
    }
    if (pool.startsWith("P")) {
      return `練習池 ${pool}`;
    }
    return `複習池 ${pool}`;
  };

  return (
    <View style={styles.poolBadge}>
      <Text style={styles.poolBadgeText}>{getPoolLabel(pool)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
