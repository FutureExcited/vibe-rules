import fs from "fs-extra";
import path from "path";
import {
  RuleConfig,
  RuleProvider,
  RuleGeneratorOptions,
  RuleType,
} from "../types";
import { getRulePath, getInternalRuleStoragePath } from "../utils/path";
import {
  formatRuleWithMetadata,
  createTaggedRuleBlock,
} from "../utils/rule-formatter";
import chalk from "chalk";

export class ClaudeCodeRuleProvider implements RuleProvider {
  private readonly ruleType = RuleType.CLAUDE_CODE;

  /**
   * Generates formatted content for Claude Code including metadata.
   * This content is intended to be placed within the <vibe-tools Integration> block.
   */
  generateRuleContent(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): string {
    // Format the content with metadata
    return formatRuleWithMetadata(config, options);
  }

  /**
   * Saves the rule definition internally. Claude rules are applied, not saved as standalone.
   */
  async saveRule(
    config: RuleConfig,
    options?: RuleGeneratorOptions
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

    try {
      const content = await fs.readFile(internalPath, "utf-8");
      // Description isn't stored directly for Claude, could potentially infer later
      return { name, content, description: `Internally stored rule: ${name}` };
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // File not found, which is expected if rule doesn't exist
        return null;
      }
      // Re-throw other errors
      console.error(
        `Error loading rule "${name}" from ${internalPath}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Lists rules from internal storage.
   */
  async listRules(): Promise<string[]> {
    const rulesDir = path.dirname(
      getInternalRuleStoragePath(this.ruleType, "dummy")
    ); // Get the directory for this type
    try {
      const files = await fs.readdir(rulesDir);
      return files
        .filter((file) => file.endsWith(".txt")) // Assuming internal storage uses .txt
        .map((file) => path.basename(file, ".txt"));
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // Directory not found, means no rules saved yet
        return [];
      }
      // Re-throw other errors
      console.error(`Error listing rules from ${rulesDir}:`, error);
      throw error;
    }
  }

  /**
   * Applies a rule by updating the <vibe-tools> section in the target CLAUDE.md.
   * If targetPath is omitted, it determines local vs global based on isGlobal option.
   */
  async appendRule(
    name: string,
    targetPath?: string,
    isGlobal: boolean = false,
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    const rule = await this.loadRule(name);
    if (!rule) {
      console.error(`Rule '${name}' not found for type ${this.ruleType}.`);
      return false;
    }

    const destinationPath =
      targetPath || getRulePath(this.ruleType, name, isGlobal); // name might not be needed by getRulePath here

    return this.appendFormattedRule(rule, destinationPath, isGlobal, options);
  }

  /**
   * Formats and applies a rule directly from a RuleConfig object using XML-like tags.
   * If a rule with the same name (tag) already exists, its content is updated.
   */
  async appendFormattedRule(
    config: RuleConfig,
    targetPath: string,
    isGlobal?: boolean,
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    const destinationPath = targetPath;
    // Ensure the parent directory exists
    fs.ensureDirSync(path.dirname(destinationPath));

    const newBlock = createTaggedRuleBlock(config, options);

    let fileContent = "";
    if (await fs.pathExists(destinationPath)) {
      fileContent = await fs.readFile(destinationPath, "utf-8");
    }

    // Escape rule name for regex
    const ruleNameRegex = config.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `^<${ruleNameRegex}>[\\s\\S]*?</${ruleNameRegex}>`,
      "m"
    );

    let updatedContent: string;
    const match = fileContent.match(regex);

    if (match) {
      // Rule exists, replace its content
      console.log(
        chalk.blue(
          `Updating existing rule block for "${config.name}" in ${destinationPath}...`
        )
      );
      updatedContent = fileContent.replace(regex, newBlock);
    } else {
      // Rule doesn't exist, append it
      // Attempt to append within <vibe-tools Integration> if possible
      const integrationStartTag = "<vibe-tools Integration>";
      const integrationEndTag = "</vibe-tools Integration>";
      const startIndex = fileContent.indexOf(integrationStartTag);
      const endIndex = fileContent.indexOf(integrationEndTag);

      console.log(
        chalk.blue(
          `Appending new rule block for "${config.name}" to ${destinationPath}...`
        )
      );

      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        // Insert before the end tag of the integration block
        const insertionPoint = endIndex;
        const before = fileContent.slice(0, insertionPoint);
        const after = fileContent.slice(insertionPoint);
        updatedContent = `${before.trimEnd()}\n\n${newBlock}\n\n${after.trimStart()}`;
      } else {
        // Append to the end of the file if integration block not found or invalid
        const separator = fileContent.trim().length > 0 ? "\n\n" : "";
        updatedContent = fileContent + separator + newBlock;
      }
    }

    try {
      await fs.writeFile(destinationPath, updatedContent.trim() + "\n");
      return true;
    } catch (error) {
      console.error(
        chalk.red(`Error writing updated rules to ${destinationPath}: ${error}`)
      );
      return false;
    }
  }
}
