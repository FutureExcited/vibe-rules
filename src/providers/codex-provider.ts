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
// Reused from claude-code-provider - consider moving to a shared util if used more.
async function updateRulesSection(
  filePath: string,
  rulesContent: string
): Promise<void> {
  ensureTargetDir(filePath);
  let existingContent = "";
  if (await fs.pathExists(filePath)) {
    existingContent = await fs.readFile(filePath, "utf-8");
  }
  existingContent = existingContent.replace(/\r\n/g, "\n");
  const rulesTemplate = rulesContent.replace(/\r\n/g, "\n").trim();
  const startTag = "<vibe-tools Integration>";
  const endTag = "</vibe-tools Integration>";
  const startIndex = existingContent.indexOf(startTag);
  const endIndex = existingContent.indexOf(endTag);
  let newContent: string;
  if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
    const before = existingContent.slice(0, startIndex);
    const after = existingContent.slice(endIndex + endTag.length);
    newContent =
      `${before.trim()}\n\n${startTag}\n${rulesTemplate}\n${endTag}\n\n${after.trim()}`.trim();
  } else {
    newContent =
      `${existingContent.trim()}\n\n${startTag}\n${rulesTemplate}\n${endTag}`.trim();
  }
  await fs.writeFile(filePath, newContent + "\n");
}

export class CodexRuleProvider implements RuleProvider {
  private readonly ruleType = RuleType.CODEX;

  /**
   * Generates plain content for Codex.
   */
  generateRuleContent(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): string {
    return config.content;
  }

  /**
   * Saves the rule definition internally.
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
    if (!(await fs.pathExists(internalPath))) {
      return null;
    }
    const content = await fs.readFile(internalPath, "utf-8");
    return { name, content, description: `Internally stored rule: ${name}` };
  }

  /**
   * Lists rules from internal storage.
   */
  async listRules(): Promise<string[]> {
    const rulesDir = path.dirname(
      getInternalRuleStoragePath(this.ruleType, "dummy")
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
   * Applies a rule by updating the <vibe-tools> section in the target codex.md/instructions.md.
   */
  async appendRule(
    name: string,
    targetPath?: string,
    isGlobal: boolean = false
  ): Promise<boolean> {
    const rule = await this.loadRule(name);
    if (!rule) {
      console.error(`Rule '${name}' not found for type ${this.ruleType}.`);
      return false;
    }

    const destinationPath =
      targetPath || getRulePath(this.ruleType, name, isGlobal);

    try {
      const contentToAppend = this.generateRuleContent(rule);
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
    isGlobal: boolean = false
  ): Promise<boolean> {
    const destinationPath = targetPath;
    try {
      const contentToAppend = this.generateRuleContent(config);
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
