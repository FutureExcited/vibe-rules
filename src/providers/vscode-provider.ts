import * as path from "path";
import { writeFile } from "fs/promises";
import {
  RuleConfig,
  RuleProvider,
  RuleGeneratorOptions,
  RuleType,
} from "../types.js";
import {
  getRulePath,
  ensureDirectoryExists,
} from "../utils/path.js";
import {
  saveInternalRule,
  loadInternalRule,
  listInternalRules,
} from "../utils/rule-storage.js";

//vs code bugged for 2+ globs...

export class VSCodeRuleProvider implements RuleProvider {
  /**
   * Generate VSCode instruction content with frontmatter
   * 
   * NOTE: VSCode has a bug where multiple globs in applyTo don't work properly,
   * so we always use "**" to apply rules universally for better reliability.
   */
  generateRuleContent(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): string {
    // VSCode Bug Workaround: Always use "**" because VSCode's applyTo field
    // doesn't properly handle multiple globs or complex glob patterns.
    // This ensures rules work consistently across all files.
    const applyToValue = "**";

    // Always include frontmatter with applyTo (required for VSCode)
    const frontmatterString = `---\napplyTo: "${applyToValue}"\n---\n`;

    // Start with the original rule content
    let content = config.content;
    
    // Add name and description in content if available
    let contentPrefix = "";
    
    // Extract original rule name from prefixed config.name (remove package prefix)
    let displayName = config.name;
    if (displayName.includes("_")) {
      displayName = displayName.split("_").slice(1).join("_");
    }
    
    // Add name as heading if not already present in content
    if (displayName && !content.includes(`# ${displayName}`)) {
      contentPrefix += `# ${displayName}\n`;
    }
    
    // Add description if provided
    if (options?.description ?? config.description) {
      contentPrefix += `## ${options?.description ?? config.description}\n\n`;
    } else if (contentPrefix) {
      contentPrefix += "\n";
    }

    return `${frontmatterString}${contentPrefix}${content}`;
  }

  /**
   * Saves a rule definition to internal storage for later use.
   * @param config - The rule configuration.
   * @returns Path where the rule definition was saved internally.
   */
  async saveRule(config: RuleConfig): Promise<string> {
    return saveInternalRule(RuleType.VSCODE, config);
  }

  /**
   * Loads a rule definition from internal storage.
   * @param name - The name of the rule to load.
   * @returns The RuleConfig if found, otherwise null.
   */
  async loadRule(name: string): Promise<RuleConfig | null> {
    return loadInternalRule(RuleType.VSCODE, name);
  }

  /**
   * Lists rule definitions available in internal storage.
   * @returns An array of rule names.
   */
  async listRules(): Promise<string[]> {
    return listInternalRules(RuleType.VSCODE);
  }

  /**
   * Append a VSCode instruction rule to a target file
   */
  async appendRule(
    name: string,
    targetPath?: string,
    isGlobal?: boolean
  ): Promise<boolean> {
    const ruleConfig = await this.loadRule(name);
    if (!ruleConfig) {
      console.error(`Rule "${name}" not found in internal VSCode storage.`);
      return false;
    }
    const finalTargetPath =
      targetPath || getRulePath(RuleType.VSCODE, name, isGlobal);
    return this.appendFormattedRule(ruleConfig, finalTargetPath, isGlobal);
  }

  /**
   * Formats and applies a rule directly from a RuleConfig object.
   * Creates the .github/instructions directory if it doesn't exist.
   * Uses slugified rule name for the filename with .instructions.md extension.
   */
  async appendFormattedRule(
    config: RuleConfig,
    targetPath: string,
    isGlobal: boolean = false,
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    const fullPath = targetPath;
    const dir = path.dirname(fullPath);

    try {
      await ensureDirectoryExists(dir);
      const formattedContent = this.generateRuleContent(config, options);
      await writeFile(fullPath, formattedContent, "utf-8");
      return true;
    } catch (error) {
      console.error(
        `Error applying VSCode rule "${config.name}" to ${fullPath}:`,
        error
      );
      return false;
    }
  }
} 