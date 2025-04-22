/**
 * Text similarity utilities for finding similar rule names
 */

/**
 * Calculate Levenshtein distance between two strings
 * @param a First string
 * @param b Second string
 * @returns Distance score (lower means more similar)
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings (0-1, higher means more similar)
 * @param a First string
 * @param b Second string
 * @returns Similarity score between 0 and 1
 */
export function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1; // Exact match
  if (!a || !b) return 0; // Handle empty strings

  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);

  // Convert distance to similarity score (1 - normalized distance)
  return 1 - distance / maxLength;
}

/**
 * Find similar rule names to the given name
 * @param notFoundName The rule name that wasn't found
 * @param availableRules List of available rule names
 * @param limit Maximum number of similar rules to return
 * @returns Array of similar rule names sorted by similarity (most similar first)
 */
export function findSimilarRules(
  notFoundName: string,
  availableRules: string[],
  limit: number = 5
): string[] {
  if (!availableRules.length) return [];

  // Calculate similarity for each rule
  const scoredRules = availableRules.map((ruleName) => ({
    name: ruleName,
    score: calculateSimilarity(notFoundName, ruleName),
  }));

  // Sort by similarity score (highest first) and take the top n
  return scoredRules
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((rule) => rule.name);
}
