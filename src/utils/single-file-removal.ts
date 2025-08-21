import * as fs from "fs/promises";
import * as fsExtra from "fs-extra";
import { debugLog } from "./debug.js";

/**
 * Removes a tagged rule block from a single file
 */
export async function removeTaggedRuleFromFile(
  filePath: string,
  ruleName: string
): Promise<boolean> {
  try {
    if (!(await fsExtra.pathExists(filePath))) {
      debugLog(`File does not exist: ${filePath}`);
      return false;
    }

    const content = await fs.readFile(filePath, "utf8");

    // Create regex to match the tagged block
    const tagPattern = new RegExp(
      `<${escapeRegex(ruleName)}>[\\s\\S]*?</${escapeRegex(ruleName)}>\\s*`,
      "g"
    );

    const originalContent = content;
    const updatedContent = content.replace(tagPattern, "");

    if (originalContent === updatedContent) {
      debugLog(`Rule "${ruleName}" not found in ${filePath}`);
      return false;
    }

    await fs.writeFile(filePath, updatedContent, "utf8");
    debugLog(`Removed rule "${ruleName}" from ${filePath}`);
    return true;
  } catch (error) {
    debugLog(`Error removing rule "${ruleName}" from ${filePath}:`, "red", error);
    return false;
  }
}

/**
 * Removes a tagged rule block from within a wrapper (like vibe-rules Integration)
 */
export async function removeTaggedRuleFromWrapper(
  filePath: string,
  ruleName: string,
  wrapperStart: string,
  wrapperEnd: string
): Promise<boolean> {
  try {
    if (!(await fsExtra.pathExists(filePath))) {
      debugLog(`File does not exist: ${filePath}`);
      return false;
    }

    const content = await fs.readFile(filePath, "utf8");

    // Find the wrapper block
    const wrapperPattern = new RegExp(
      `(${escapeRegex(wrapperStart)}[\\s\\S]*?)(${escapeRegex(wrapperEnd)})`,
      "g"
    );

    let found = false;
    const updatedContent = content.replace(wrapperPattern, (match, beforeEnd, endTag) => {
      // Within the wrapper, remove the specific rule
      const tagPattern = new RegExp(
        `<${escapeRegex(ruleName)}>[\\s\\S]*?</${escapeRegex(ruleName)}>\\s*`,
        "g"
      );

      const originalWrapper = beforeEnd;
      const updatedWrapper = beforeEnd.replace(tagPattern, "");

      if (originalWrapper !== updatedWrapper) {
        found = true;
        return updatedWrapper + endTag;
      }

      return match;
    });

    if (!found) {
      debugLog(`Rule "${ruleName}" not found in wrapper within ${filePath}`);
      return false;
    }

    await fs.writeFile(filePath, updatedContent, "utf8");
    debugLog(`Removed rule "${ruleName}" from wrapper in ${filePath}`);
    return true;
  } catch (error) {
    debugLog(`Error removing rule "${ruleName}" from wrapper in ${filePath}:`, "red", error);
    return false;
  }
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
