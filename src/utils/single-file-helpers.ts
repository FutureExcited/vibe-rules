import * as fs from "fs/promises";
import * as path from "path";
import { RuleConfig, RuleGeneratorOptions } from "../types";
import { createTaggedRuleBlock } from "./rule-formatter";
import { ensureDirectoryExists } from "./path";

/**
 * Appends or updates a tagged block within a single target file.
 *
 * Reads the file content, looks for an existing block matching the rule name tag,
 * replaces it if found, or appends the new block otherwise.
 *
 * @param targetPath The path to the target file.
 * @param config The rule configuration.
 * @param options Optional generator options.
 * @param appendInsideVibeToolsBlock If true, tries to append within <vibe-tools Integration> block.
 * @returns Promise resolving to true if successful, false otherwise.
 */
export async function appendOrUpdateTaggedBlock(
  targetPath: string,
  config: RuleConfig,
  options?: RuleGeneratorOptions,
  appendInsideVibeToolsBlock: boolean = false
): Promise<boolean> {
  try {
    // Ensure the PARENT directory exists, but only if it's not the current directory itself.
    const parentDir = path.dirname(targetPath);
    // Avoid calling ensureDirectoryExists('.') as it's unnecessary and might mask other issues.
    if (parentDir !== ".") {
      ensureDirectoryExists(parentDir);
    }

    let currentContent = "";
    try {
      currentContent = await fs.readFile(targetPath, "utf-8");
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        console.error(`Error reading target file ${targetPath}:`, error);
        return false;
      }
      // File doesn't exist, which is fine, we'll create it.
      console.debug(`Target file ${targetPath} not found, will create.`);
    }

    const newBlock = createTaggedRuleBlock(config, options);
    const ruleNameRegexStr = config.name.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\\\$&"
    ); // Escape regex special chars
    const existingBlockRegex = new RegExp(
      `<${ruleNameRegexStr}>[\\s\\S]*?</${ruleNameRegexStr}>`,
      "m"
    );

    let updatedContent: string;
    const match = currentContent.match(existingBlockRegex);

    if (match) {
      // Update existing block
      console.debug(
        `Updating existing block for rule "${config.name}" in ${targetPath}`
      );
      updatedContent = currentContent.replace(existingBlockRegex, newBlock);
    } else {
      // Append new block
      console.debug(
        `Appending new block for rule "${config.name}" to ${targetPath}`
      );
      const vibeToolsIntegrationEndTag = "</vibe-tools Integration>";
      const integrationEndIndex = currentContent.lastIndexOf(
        vibeToolsIntegrationEndTag
      );

      if (appendInsideVibeToolsBlock && integrationEndIndex !== -1) {
        // Append inside the vibe-tools block if requested and found
        const insertionPoint = integrationEndIndex;
        updatedContent =
          currentContent.slice(0, insertionPoint).trimEnd() +
          "\\n\\n" + // Ensure separation
          newBlock +
          "\\n\\n" + // Ensure separation
          currentContent.slice(insertionPoint);
        console.debug(`Appending rule inside <vibe-tools Integration> block.`);
      } else {
        // Append to the end
        const separator = currentContent.trim().length > 0 ? "\\n\\n" : ""; // Add separator if file not empty
        updatedContent = currentContent.trimEnd() + separator + newBlock;
        if (appendInsideVibeToolsBlock) {
          console.debug(
            `Could not find <vibe-tools Integration> block, appending rule to the end.`
          );
        }
      }
    }

    // Ensure file ends with a newline
    if (!updatedContent.endsWith("\\n")) {
      updatedContent += "\\n";
    }

    await fs.writeFile(targetPath, updatedContent, "utf-8");
    console.log(`Successfully applied rule "${config.name}" to ${targetPath}`);
    return true;
  } catch (error) {
    console.error(
      `Error applying rule "${config.name}" to ${targetPath}:`,
      error
    );
    return false;
  }
}
