/**
 * Rule type definitions for the vibe-rules utility
 */
import type { INSTALL_ALL_EXCLUDES, INSTALL_ALL_INCLUDES } from './commands/install';
import type { AssertAreEqual, AssertIsEmpty, Intersection } from './genericTypeUtilities';

export type * from "./schemas";
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
  CUSTOM: "custom",
} as const;

export type RuleTypeArray = (typeof RuleType)[keyof typeof RuleType][];
export type RuleType = (typeof RuleType)[keyof typeof RuleType];

/**
 * TypeScript compile-time validation to ensure all editors are properly accounted for.
 * Key benefit: When adding a new editor to RuleType, TypeScript will show a clear error
 * indicating that the new editor must be added to either ALL_SUPPORTED_EDITORS or EXCLUDED_FROM_ALL_EDITORS.
 */
// Create type aliases for the array element unions
type AllSupportedEditorsUnion = (typeof INSTALL_ALL_INCLUDES)[number];
type ExcludedEditorsUnion = (typeof INSTALL_ALL_EXCLUDES)[number];
type AllRuleTypes = (typeof RuleType)[keyof typeof RuleType];

// Ensure the two editor arrays don't overlap (no editor should be in both lists)
// The arrays are expected to have no overlap
const _allEditorSetsDoNotOverlap: AssertIsEmpty<Intersection<AllSupportedEditorsUnion, ExcludedEditorsUnion>> = true;

// Ensure the union of both arrays exactly equals all RuleType values  
const _allEditorSetsIncludeAllEditors: AssertAreEqual<AllSupportedEditorsUnion | ExcludedEditorsUnion, AllRuleTypes> = true;

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
  generateRuleContent(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): string;
}

export interface RuleGeneratorOptions {
  description?: string;
  isGlobal?: boolean;
  alwaysApply?: boolean;
  globs?: string | string[];
  debug?: boolean;
  // Additional options for specific rule types
}
