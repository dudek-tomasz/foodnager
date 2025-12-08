/**
 * HTML to Text Converter
 *
 * Converts HTML content (especially recipe instructions) to readable text
 */

/**
 * Convert HTML ordered/unordered list to numbered/bulleted text
 */
export function htmlToText(html: string): string {
  if (!html) return "";

  let text = html;

  // Convert ordered list items to numbered steps
  text = text.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
    let counter = 1;
    const items = content.replace(/<li[^>]*>(.*?)<\/li>/gi, (_: string, itemContent: string) => {
      const cleaned = stripHtmlTags(itemContent).trim();
      return `${counter++}. ${cleaned}\n`;
    });
    return items;
  });

  // Convert unordered list items to bullet points
  text = text.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
    const items = content.replace(/<li[^>]*>(.*?)<\/li>/gi, (_: string, itemContent: string) => {
      const cleaned = stripHtmlTags(itemContent).trim();
      return `• ${cleaned}\n`;
    });
    return items;
  });

  // Convert remaining list items (orphaned)
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, (_: string, itemContent: string) => {
    const cleaned = stripHtmlTags(itemContent).trim();
    return `• ${cleaned}\n`;
  });

  // Convert paragraphs to newlines
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");

  // Convert breaks to newlines
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // Convert headers to text with newlines
  text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n$1\n");

  // Remove remaining HTML tags
  text = stripHtmlTags(text);

  // Clean up excessive whitespace
  text = text.replace(/\n{3,}/g, "\n\n"); // Max 2 newlines
  text = text.replace(/[ \t]+/g, " "); // Single spaces
  text = text.trim();

  return text;
}

/**
 * Strip all HTML tags from text
 */
export function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, "") // Remove tags
    .replace(/&nbsp;/g, " ") // Replace &nbsp;
    .replace(/&amp;/g, "&") // Replace &amp;
    .replace(/&lt;/g, "<") // Replace &lt;
    .replace(/&gt;/g, ">") // Replace &gt;
    .replace(/&quot;/g, '"') // Replace &quot;
    .replace(/&#39;/g, "'") // Replace &#39;
    .trim();
}

/**
 * Extract plain text summary from HTML (for descriptions)
 * Removes all formatting and limits to reasonable length
 */
export function extractSummary(html: string, maxLength = 500): string {
  const plainText = htmlToText(html);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Cut at sentence boundary if possible
  const cutPoint = plainText.lastIndexOf(". ", maxLength);
  if (cutPoint > maxLength * 0.7) {
    return plainText.substring(0, cutPoint + 1);
  }

  // Otherwise cut at word boundary
  const wordCutPoint = plainText.lastIndexOf(" ", maxLength);
  return plainText.substring(0, wordCutPoint) + "...";
}
