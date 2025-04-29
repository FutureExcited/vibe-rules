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
import chalk from "chalk";

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
    isGlobal: boolean = false,
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    const rule = await this.loadRule(name);
    if (!rule) {
      console.error(`Rule '${name}' not found for type ${this.ruleType}.`);
      return false;
    }

    const destinationPath =
      targetPath || getRulePath(this.ruleType, name, isGlobal);

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
    ensureTargetDir(destinationPath);

    const ruleContent = this.generateRuleContent(config, options);
    const startTag = `<${config.name}>`;
    const endTag = `</${config.name}>`;
    const newBlock = `${startTag}\n${ruleContent}\n${endTag}`;

    let fileContent = "";
    if (await fs.pathExists(destinationPath)) {
      fileContent = await fs.readFile(destinationPath, "utf-8");
    }

    const ruleNameRegex = config.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `^<${ruleNameRegex}>[\\s\\S]*?</${ruleNameRegex}>`,
      "m"
    );

    let updatedContent: string;
    const match = fileContent.match(regex);

    if (match) {
      console.log(
        chalk.blue(`Updating existing rule block for "${config.name}" in ${destinationPath}...`)
      );
      updatedContent = fileContent.replace(regex, newBlock);
    } else {
      console.log(
        chalk.blue(`Appending new rule block for "${config.name}" to ${destinationPath}...`)
      );

      const integrationStartTag = "<vibe-tools Integration>";
      const integrationEndTag = "</vibe-tools Integration>";
      const startIndex = fileContent.indexOf(integrationStartTag);
      const endIndex = fileContent.indexOf(integrationEndTag);

      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        const insertionPoint = endIndex;
        const before = fileContent.slice(0, insertionPoint);
        const after = fileContent.slice(insertionPoint);
        updatedContent = `${before.trimEnd()}\n\n${newBlock}\n\n${after.trimStart()}`;
      } else {
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
