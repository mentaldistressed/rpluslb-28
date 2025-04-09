
/**
 * Extracts a summary from message content
 * Gets first paragraph or first 150 characters, whichever is shorter
 */
export function extractSummary(content: string): string {
  const firstParagraph = content.split('\n')[0];
  return firstParagraph.length > 150 ? firstParagraph.substring(0, 147) + '...' : firstParagraph;
}
