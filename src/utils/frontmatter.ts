/**
 * Simple frontmatter parser for .mdc files
 * Parses YAML-like frontmatter without external dependencies
 */

export interface ParsedContent {
  frontmatter: Record<string, any>;
  content: string;
}

/**
 * Parse frontmatter from content that may contain YAML frontmatter
 * Returns the parsed frontmatter object and the remaining content
 */
export function parseFrontmatter(input: string): ParsedContent {
  const lines = input.split("\n");

  // Check if content starts with frontmatter delimiter
  if (lines[0]?.trim() !== "---") {
    return {
      frontmatter: {},
      content: input,
    };
  }

  // Find the closing delimiter
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === "---") {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    // No closing delimiter found, treat as regular content
    return {
      frontmatter: {},
      content: input,
    };
  }

  // Extract frontmatter lines
  const frontmatterLines = lines.slice(1, endIndex);
  const contentLines = lines.slice(endIndex + 1);

  // Parse frontmatter (simple YAML-like parsing)
  const frontmatter: Record<string, any> = {};

  for (const line of frontmatterLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue; // Skip empty lines and comments
    }

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) {
      continue; // Skip lines without colons
    }

    const key = trimmed.substring(0, colonIndex).trim();
    let value = trimmed.substring(colonIndex + 1).trim();

    // Parse different value types
    if (value === "true") {
      frontmatter[key] = true;
    } else if (value === "false") {
      frontmatter[key] = false;
    } else if (value === "null" || value === "") {
      // Skip null or empty values instead of setting them
      continue;
    } else if (/^\d+$/.test(value)) {
      frontmatter[key] = parseInt(value, 10);
    } else if (/^\d+\.\d+$/.test(value)) {
      frontmatter[key] = parseFloat(value);
    } else if (value.startsWith("[") && value.endsWith("]")) {
      // Simple array parsing for globs
      try {
        const arrayContent = value.slice(1, -1);
        if (arrayContent.trim() === "") {
          frontmatter[key] = [];
        } else {
          const items = arrayContent.split(",").map((item) => {
            const trimmed = item.trim();
            // Remove quotes if present
            if (
              (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
              (trimmed.startsWith("'") && trimmed.endsWith("'"))
            ) {
              return trimmed.slice(1, -1);
            }
            return trimmed;
          });
          frontmatter[key] = items;
        }
      } catch {
        frontmatter[key] = value; // Fallback to string if parsing fails
      }
    } else {
      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  }

  return {
    frontmatter,
    content: contentLines.join("\n").replace(/^\n+/, ""), // Remove leading newlines
  };
}
