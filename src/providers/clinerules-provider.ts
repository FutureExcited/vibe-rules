import fs from "fs-extra";
import path from "path";
import {
  RuleConfig,
  RuleProvider,
  RuleGeneratorOptions,
  RuleType,
} from "../types";
import {
  getRulePath, // Returns the .clinerules directory path
  ensureTargetDir, // Ensures parent directory exists
  getInternalRuleStoragePath,
} from "../utils/path";
import {
  formatRuleWithMetadata,
  createTaggedRuleBlock,
} from "../utils/rule-formatter";
import chalk from "chalk";

// Helper function specifically for clinerules/roo setup
// Focuses on the directory structure: .clinerules/vibe-tools.md
async function setupClinerulesDirectory(
  clinerulesDirPath: string,
  rulesContent: string
): Promise<void> {
  await fs.ensureDir(clinerulesDirPath); // Ensure the .clinerules directory exists

  const vibeToolsRulePath = path.join(clinerulesDirPath, "vibe-tools.md");
  const rulesTemplate = rulesContent.replace(/\r\n/g, "\n").trim();

  // Wrap content with <vibe-tools> tags if not already present
  const startTag = "<vibe-tools Integration>";
  const endTag = "</vibe-tools Integration>";
  let contentToWrite = rulesTemplate;
  if (!contentToWrite.includes(startTag)) {
    contentToWrite = `${startTag}\n${rulesTemplate}\n${endTag}`;
  }

  await fs.writeFile(vibeToolsRulePath, contentToWrite + "\n");
}

export class ClinerulesRuleProvider implements RuleProvider {
  // Handles both CLINERULES and ROO types
  private readonly supportedTypes = [RuleType.CLINERULES, RuleType.ROO];

  /**
   * Generates formatted content for Clinerules/Roo including metadata.
   */
  generateRuleContent(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): string {
    return formatRuleWithMetadata(config, options);
  }

  /**
   * Saves the rule definition internally.
   */
  async saveRule(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): Promise<string> {
    // Use CLINERULES type for internal storage regardless of ROO
    const internalPath = getInternalRuleStoragePath(
      RuleType.CLINERULES,
      config.name
    );
    await fs.writeFile(internalPath, config.content);
    return internalPath;
  }

  /**
   * Loads a rule definition from internal storage.
   */
  async loadRule(name: string): Promise<RuleConfig | null> {
    const internalPath = getInternalRuleStoragePath(RuleType.CLINERULES, name);
    if (!(await fs.pathExists(internalPath))) {
      return null;
    }
    const content = await fs.readFile(internalPath, "utf-8");
    return {
      name,
      content,
      description: `Internally stored rule: ${name}`,
    };
  }

  /**
   * Lists rules from internal storage.
   */
  async listRules(): Promise<string[]> {
    const rulesDir = path.dirname(
      getInternalRuleStoragePath(RuleType.CLINERULES, "dummy")
    );
    if (!(await fs.pathExists(rulesDir))) {
      return [];
    }
    const files = await fs.readdir(rulesDir);
    return files
      .filter((file) => file.endsWith(".txt"))
      .map((file) => path.basename(file, ".txt"));
  }

  /**
   * Applies a rule by setting up the .clinerules/vibe-tools.md structure.
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
      console.error(
        `Rule '${name}' not found for type ${RuleType.CLINERULES}/${RuleType.ROO}.`
      );
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
    targetPath: string, // Should be the .clinerules directory path
    isGlobal?: boolean,
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    const destinationDir = targetPath;

    try {
      if (options?.alwaysApply !== undefined || options?.globs) {
        console.log(
          chalk.blue(
            `Rule "${config.name}" has metadata that will be included in content:`
          )
        );

        if (options?.alwaysApply !== undefined) {
          console.log(chalk.blue(`  - alwaysApply: ${options.alwaysApply}`));
        }

        if (options?.globs) {
          const globsStr = Array.isArray(options.globs)
            ? options.globs.join(", ")
            : options.globs;
          console.log(chalk.blue(`  - globs: ${globsStr}`));
        }
      }

      const contentToAppend = this.generateRuleContent(config, options);
      await setupClinerulesDirectory(destinationDir, contentToAppend);
      console.log(
        chalk.green(
          `Successfully applied formatted ${RuleType.CLINERULES}/${RuleType.ROO} rule to: ${destinationDir}`
        )
      );
      return true;
    } catch (error) {
      console.error(
        chalk.red(
          `Error applying formatted ${RuleType.CLINERULES}/${RuleType.ROO} rule to ${destinationDir}:`
        ),
        error
      );
      return false;
    }
  }
}
