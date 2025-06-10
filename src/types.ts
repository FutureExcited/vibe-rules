/**
 * Rule type definitions for the vibe-rules utility
 */
export type * from "./schemas.js";
export interface RuleConfig {
  name: string;
  content: string;
  description?: string;
  // Additional properties can be added as needed
}

export const RuleType = {
  CURSOR: "cursor",
  WINDSURF: "windsurf",
  CLAUDE_CODE: "claude-code",
  CODEX: "codex",
  CLINERULES: "clinerules",
  ROO: "roo",
  ZED: "zed",
  UNIFIED: "unified",
  VSCODE: "vscode",
  CUSTOM: "custom",
} as const;

export type RuleTypeArray = (typeof RuleType)[keyof typeof RuleType][];
export type RuleType = (typeof RuleType)[keyof typeof RuleType];

export interface RuleProvider {
  /**
   * Creates a new rule file with the given content
   */
  saveRule(config: RuleConfig, options?: RuleGeneratorOptions): Promise<string>;

  /**
   * Loads a rule from storage
   */
  loadRule(name: string): Promise<RuleConfig | null>;

  /**
   * Lists all available rules
   */
  listRules(): Promise<string[]>;

  /**
   * Appends a rule to an existing file
   */
  appendRule(name: string, targetPath?: string): Promise<boolean>;

  /**
   * Formats and appends a rule directly from a RuleConfig object
   */
  appendFormattedRule(
    config: RuleConfig,
    targetPath: string,
    isGlobal?: boolean,
    options?: RuleGeneratorOptions
  ): Promise<boolean>;

  /**
   * Generates formatted rule content with editor-specific formatting
   */
  generateRuleContent(config: RuleConfig, options?: RuleGeneratorOptions): string;
}

export interface RuleGeneratorOptions {
  description?: string;
  isGlobal?: boolean;
  alwaysApply?: boolean;
  globs?: string | string[];
  debug?: boolean;
  // Additional options for specific rule types
}
