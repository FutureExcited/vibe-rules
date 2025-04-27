import fs from "fs-extra";
import path from "path";
import {
  RuleConfig,
  RuleProvider,
  RuleGeneratorOptions,
  RuleType,
} from "../types";
import {
  getRulePath,
  ensureTargetDir,
  getInternalRuleStoragePath,
} from "../utils/path";

// Helper function to update or add vibe-tools section in rules files
// Adapted from the reference code provided.
async function updateRulesSection(
  filePath: string,
  rulesContent: string
): Promise<void> {
  ensureTargetDir(filePath); // Ensure directory exists before reading/writing

  let existingContent = "";
  if (await fs.pathExists(filePath)) {
    existingContent = await fs.readFile(filePath, "utf-8");
  }

  // Standardize line endings
  existingContent = existingContent.replace(/\r\n/g, "\n");
  const rulesTemplate = rulesContent.replace(/\r\n/g, "\n").trim();

  // Use specific tags for vibe-tools integration
  const startTag = "<vibe-tools Integration>";
  const endTag = "</vibe-tools Integration>";
  const startIndex = existingContent.indexOf(startTag);
  const endIndex = existingContent.indexOf(endTag);

  let newContent: string;

  if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
    // Replace existing section
    const before = existingContent.slice(0, startIndex);
    const after = existingContent.slice(endIndex + endTag.length);
    newContent =
      `${before.trim()}\n\n${startTag}\n${rulesTemplate}\n${endTag}\n\n${after.trim()}`.trim();
  } else {
    // Append new section
    newContent =
      `${existingContent.trim()}\n\n${startTag}\n${rulesTemplate}\n${endTag}`.trim();
  }

  await fs.writeFile(filePath, newContent + "\n"); // Ensure trailing newline
}

export class ClaudeCodeRuleProvider implements RuleProvider {
  private readonly ruleType = RuleType.CLAUDE_CODE;

  /**
   * Generates plain content for Claude Code (no frontmatter needed).
   * This content is intended to be placed within the <vibe-tools Integration> block.
   */
  generateRuleContent(
    config: RuleConfig,
    options?: RuleGeneratorOptions // Options like description/isGlobal are not used by Claude format
  ): string {
    // Claude just needs the raw content
    return config.content;
  }

  /**
   * Saves the rule definition internally. Claude rules are applied, not saved as standalone.
   */
  async saveRule(
    config: RuleConfig,
    options?: RuleGeneratorOptions // options not used for internal saving
  ): Promise<string> {
    const internalPath = getInternalRuleStoragePath(this.ruleType, config.name);
    await fs.writeFile(internalPath, config.content);
    return internalPath;
  }

  /**
   * Loads a rule definition from internal storage.
   */
  async loadRule(name: string): Promise<RuleConfig | null> {
    const internalPath = getInternalRuleStoragePath(this.ruleType, name);

    if (!(await fs.pathExists(internalPath))) {
      return null;
    }

    const content = await fs.readFile(internalPath, "utf-8");
    // Description isn't stored directly for Claude, could potentially infer later
    return { name, content, description: `Internally stored rule: ${name}` };
  }

  /**
   * Lists rules from internal storage.
   */
  async listRules(): Promise<string[]> {
    const rulesDir = path.dirname(
      getInternalRuleStoragePath(this.ruleType, "dummy")
    ); // Get the directory for this type
    if (!(await fs.pathExists(rulesDir))) {
      return [];
    }
    const files = await fs.readdir(rulesDir);
    return files
      .filter((file) => file.endsWith(".txt")) // Assuming internal storage uses .txt
      .map((file) => path.basename(file, ".txt"));
  }

  /**
   * Applies a rule by updating the <vibe-tools> section in the target CLAUDE.md.
   * If targetPath is omitted, it determines local vs global based on isGlobal option.
   */
  async appendRule(
    name: string,
    targetPath?: string,
    isGlobal: boolean = false // Added isGlobal flag
  ): Promise<boolean> {
    const rule = await this.loadRule(name);
    if (!rule) {
      console.error(`Rule '${name}' not found for type ${this.ruleType}.`);
      return false;
    }

    const destinationPath =
      targetPath || getRulePath(this.ruleType, name, isGlobal); // name might not be needed by getRulePath here

    try {
      const contentToAppend = this.generateRuleContent(rule); // Get raw content
      await updateRulesSection(destinationPath, contentToAppend);
      console.log(
        `Successfully updated ${this.ruleType} rules in: ${destinationPath}`
      );
      return true;
    } catch (error) {
      console.error(
        `Error updating ${this.ruleType} rules in ${destinationPath}:`,
        error
      );
      return false;
    }
  }

  /**
   * Formats and applies a rule directly from a RuleConfig object.
   */
  async appendFormattedRule(
    config: RuleConfig,
    targetPath: string,
    isGlobal: boolean = false // Added isGlobal flag
  ): Promise<boolean> {
    // Use the provided targetPath directly. The isGlobal flag isn't strictly needed
    // here as the path is explicit, but kept for consistency if needed later.
    const destinationPath = targetPath;

    try {
      const contentToAppend = this.generateRuleContent(config); // Get raw content
      await updateRulesSection(destinationPath, contentToAppend);
      console.log(
        `Successfully applied formatted ${this.ruleType} rule to: ${destinationPath}`
      );
      return true;
    } catch (error) {
      console.error(
        `Error applying formatted ${this.ruleType} rule to ${destinationPath}:`,
        error
      );
      return false;
    }
  }
}
