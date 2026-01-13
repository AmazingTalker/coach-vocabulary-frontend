/**
 * Get exercise category from type
 */
export function getExerciseCategory(type: string): string {
  if (type.startsWith("reading")) return "reading";
  if (type.startsWith("listening")) return "listening";
  return "speaking";
}

/**
 * Get exercise title from category
 */
export function getExerciseTitle(category: string): string {
  switch (category) {
    case "reading":
      return "閱讀練習";
    case "listening":
      return "聽力練習";
    case "speaking":
      return "口說練習";
    default:
      return "練習";
  }
}

/**
 * Get pool label from pool identifier
 */
export function getPoolLabel(pool: string, type: "practice" | "review" = "practice"): string {
  if (type === "review") {
    return `複習池 ${pool}`;
  }
  if (pool.startsWith("P")) {
    return `練習池 ${pool}`;
  }
  return `複習池 ${pool}`;
}

/**
 * Check if speaking answer is correct using contains matching
 */
export function checkSpeakingAnswer(transcript: string, correctWord: string): boolean {
  const normalizedTranscript = transcript.toLowerCase().trim();
  const normalizedCorrect = correctWord.toLowerCase().trim();
  return normalizedTranscript.includes(normalizedCorrect);
}
