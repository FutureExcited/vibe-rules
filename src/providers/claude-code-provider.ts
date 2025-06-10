import * as fs from "fs-extra/esm";
import { readFile, writeFile } from "fs/promises";
import * as path from "path";
import { RuleConfig, RuleProvider, RuleGeneratorOptions, RuleType } from "../types.js";
import { getRulePath } from "../utils/path.js";
import { formatRuleWithMetadata, createTaggedRuleBlock } from "../utils/rule-formatter.js";
import { saveInternalRule, loadInternalRule, listInternalRules } from "../utils/rule-storage.js";
import chalk from "chalk";

export class ClaudeCodeRuleProvider implements RuleProvider {
  private readonly ruleType = RuleType.CLAUDE_CODE;

  /**
   * Generates formatted content for Claude Code including metadata.
   * This content is intended to be placed within the <!-- vibe-rules Integration --> block.
   */
  generateRuleContent(config: RuleConfig, options?: RuleGeneratorOptions): string {
    // Format the content with metadata
    return formatRuleWithMetadata(config, options);
  }

  /**
   * Saves a rule definition to internal storage for later use.
   * @param config - The rule configuration.
   * @returns Path where the rule definition was saved internally.
   */
  async saveRule(config: RuleConfig): Promise<string> {
    return saveInternalRule(RuleType.CLAUDE_CODE, config);
  }

  /**
   * Loads a rule definition from internal storage.
   * @param name - The name of the rule to load.
   * @returns The RuleConfig if found, otherwise null.
   */
  async loadRule(name: string): Promise<RuleConfig | null> {
    return loadInternalRule(RuleType.CLAUDE_CODE, name);
  }

  /**
   * Lists rule definitions available in internal storage.
   * @returns An array of rule names.
   */
  async listRules(): Promise<string[]> {
    return listInternalRules(RuleType.CLAUDE_CODE);
  }

  /**
   * Applies a rule by updating the <vibe-rules> section in the target CLAUDE.md.
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

    const destinationPath = targetPath || getRulePath(this.ruleType, name, isGlobal); // name might not be needed by getRulePath here

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
      fileContent = await readFile(destinationPath, "utf-8");
    }

    // Escape rule name for regex
    const ruleNameRegex = config.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^<${ruleNameRegex}>[\\s\\S]*?</${ruleNameRegex}>`, "m");

    let updatedContent: string;
    const match = fileContent.match(regex);

    if (match) {
      // Rule exists, replace its content
      console.log(
        chalk.blue(`Updating existing rule block for "${config.name}" in ${destinationPath}...`)
      );
      updatedContent = fileContent.replace(regex, newBlock);
    } else {
      // Rule doesn't exist, append it
      // Attempt to append within <!-- vibe-rules Integration --> if possible
      const integrationStartTag = "<!-- vibe-rules Integration -->";
      const integrationEndTag = "<!-- /vibe-rules Integration -->";
      const startIndex = fileContent.indexOf(integrationStartTag);
      const endIndex = fileContent.indexOf(integrationEndTag);

      console.log(
        chalk.blue(`Appending new rule block for "${config.name}" to ${destinationPath}...`)
      );

      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        // Insert before the end tag of the integration block
        const insertionPoint = endIndex;
        const before = fileContent.slice(0, insertionPoint);
        const after = fileContent.slice(insertionPoint);
        updatedContent = `${before.trimEnd()}\n\n${newBlock}\n\n${after.trimStart()}`;
      } else {
        // Create the vibe-rules Integration block if it doesn't exist
        if (fileContent.trim().length > 0) {
          // File has content but no integration block, wrap everything
          updatedContent = `<!-- vibe-rules Integration -->\n\n${fileContent.trim()}\n\n${newBlock}\n\n<!-- /vibe-rules Integration -->`;
        } else {
          // New/empty file, create integration block with the new rule
          updatedContent = `<!-- vibe-rules Integration -->\n\n${newBlock}\n\n<!-- /vibe-rules Integration -->`;
        }
      }
    }

    try {
      await writeFile(destinationPath, updatedContent.trim() + "\n");
      return true;
    } catch (error) {
      console.error(chalk.red(`Error writing updated rules to ${destinationPath}: ${error}`));
      return false;
    }
  }
}
