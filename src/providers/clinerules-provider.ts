import * as fs from "fs-extra/esm";
import { writeFile } from "fs/promises";
import * as path from "path";
import { RuleConfig, RuleProvider, RuleGeneratorOptions, RuleType } from "../types.js";
import {
  getRulePath, // Returns the .clinerules directory path
  ensureDirectoryExists,
} from "../utils/path.js";
import { formatRuleWithMetadata } from "../utils/rule-formatter.js";
import chalk from "chalk";
import { saveInternalRule, loadInternalRule, listInternalRules } from "../utils/rule-storage.js";

// Helper function specifically for clinerules/roo setup
// Focuses on the directory structure: .clinerules/vibe-rules.md
async function setupClinerulesDirectory(
  clinerulesDirPath: string,
  rulesContent: string
): Promise<void> {
  await fs.ensureDir(clinerulesDirPath); // Ensure the .clinerules directory exists

  const vibeRulesRulePath = path.join(clinerulesDirPath, "vibe-rules.md");
  const rulesTemplate = rulesContent.replace(/\r\n/g, "\n").trim();

  // Wrap content with <!-- vibe-rules --> tags if not already present
  const startTag = "<!-- vibe-rules Integration -->";
  const endTag = "<!-- /vibe-rules Integration -->";
  let contentToWrite = rulesTemplate;
  if (!contentToWrite.includes(startTag)) {
    contentToWrite = `${startTag}\n${rulesTemplate}\n${endTag}`;
  }

  await writeFile(vibeRulesRulePath, contentToWrite + "\n");
}

export class ClinerulesRuleProvider implements RuleProvider {
  private readonly ruleType = RuleType.CLINERULES;

  /**
   * Generates formatted content for Clinerules/Roo including metadata.
   */
  generateRuleContent(config: RuleConfig, options?: RuleGeneratorOptions): string {
    return formatRuleWithMetadata(config, options);
  }

  /**
   * Saves a rule definition to internal storage for later use.
   * @param config - The rule configuration.
   * @returns Path where the rule definition was saved internally.
   */
  async saveRule(config: RuleConfig): Promise<string> {
    return saveInternalRule(this.ruleType, config);
  }

  /**
   * Loads a rule definition from internal storage.
   * @param name - The name of the rule to load.
   * @returns The RuleConfig if found, otherwise null.
   */
  async loadRule(name: string): Promise<RuleConfig | null> {
    return loadInternalRule(this.ruleType, name);
  }

  /**
   * Lists rule definitions available in internal storage.
   * @returns An array of rule names.
   */
  async listRules(): Promise<string[]> {
    return listInternalRules(this.ruleType);
  }

  /**
   * Applies a rule by setting up the .clinerules/vibe-rules.md structure.
   * Always targets the project-local .clinerules directory.
   */
  async appendRule(
    name: string,
    targetPath?: string, // If provided, should be the .clinerules directory path
    isGlobal?: boolean,
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    const rule = await this.loadRule(name);
    if (!rule) {
      console.error(`Rule '${name}' not found for type ${RuleType.CLINERULES}/${RuleType.ROO}.`);
      return false;
    }

    // getRulePath for CLINERULES/ROO returns the directory path
    const destinationDir = targetPath || getRulePath(RuleType.CLINERULES, name); // name is ignored here

    try {
      const contentToAppend = this.generateRuleContent(rule, options);
      await setupClinerulesDirectory(destinationDir, contentToAppend);
      console.log(
        chalk.green(
          `Successfully set up ${RuleType.CLINERULES}/${RuleType.ROO} rules in: ${destinationDir}`
        )
      );
      return true;
    } catch (error) {
      console.error(
        chalk.red(
          `Error setting up ${RuleType.CLINERULES}/${RuleType.ROO} rules in ${destinationDir}:`
        ),
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
    targetPath: string, // Should now receive the correct .../.clinerules/slugified-name.md path
    isGlobal?: boolean,
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    // Ensure the parent .clinerules directory exists
    const parentDir = path.dirname(targetPath);
    ensureDirectoryExists(parentDir);

    // Generate the content
    const content = this.generateRuleContent(config, options);

    // Log metadata inclusion (optional, but kept from previous state)
    if (options?.alwaysApply !== undefined || options?.globs) {
      console.log(
        chalk.blue(
          `  Including metadata in rule content: alwaysApply=${options.alwaysApply}, globs=${JSON.stringify(options.globs)}`
        )
      );
    }

    try {
      // Write directly to the target file path
      await writeFile(targetPath, content, "utf-8");
      console.log(chalk.green(`Successfully applied rule "${config.name}" to ${targetPath}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`Error applying rule "${config.name}" to ${targetPath}: ${error}`));
      return false;
    }
  }
}
