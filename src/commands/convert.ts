import { RuleConfig, RuleType, StoredRuleConfig, RuleGeneratorOptions } from "../types.js";
import { getRuleProvider } from "../providers/index.js";
import { getDefaultTargetPath, getRulePath } from "../utils/path.js";
import { debugLog } from "../utils/debug.js";
import { parseFrontmatter } from "../utils/frontmatter.js";
import * as fs from "fs/promises";
import * as fsExtra from "fs-extra";
import * as path from "path";
import chalk from "chalk";
import type { Stats } from "fs";

interface ConvertOptions {
  target?: string;
  global?: boolean;
  debug?: boolean;
}

/**
 * Main handler for the convert command
 */
export async function convertCommandAction(
  sourceFormat: string,
  targetFormat: string,
  sourcePath: string,
  options: ConvertOptions
): Promise<void> {
  debugLog(`Converting from ${sourceFormat} to ${targetFormat}, source: ${sourcePath}`);

  try {
    // Validate source and target formats
    const sourceType = validateAndGetRuleType(sourceFormat, "source");
    if (!sourceType) {
      process.exit(1);
    }

    const targetType = validateAndGetRuleType(targetFormat, "target");
    if (!targetType) {
      process.exit(1);
    }

    if (sourceType === targetType) {
      console.error(chalk.red("❌ Source and target formats cannot be the same"));
      process.exit(1);
    }

    // Get target provider
    const targetProvider = getRuleProvider(targetType);

    // Determine if source is a directory or file
    let sourceStats: Stats;
    try {
      debugLog(`Checking source path: ${sourcePath}`);
      debugLog(`Current working directory: ${process.cwd()}`);
      const absolutePath = path.resolve(sourcePath);
      debugLog(`Absolute path: ${absolutePath}`);
      sourceStats = await fs.stat(sourcePath);
      debugLog(
        `Source stats: isDirectory=${sourceStats.isDirectory()}, isFile=${sourceStats.isFile()}`
      );
    } catch (error) {
      console.error(chalk.red(`❌ Source path not found: ${sourcePath}`));
      debugLog(`Error details: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }

    let rules: StoredRuleConfig[] = [];

    try {
      if (sourceStats.isDirectory()) {
        rules = await extractRulesFromDirectory(sourceType, sourcePath);
      } else {
        rules = await extractRulesFromFile(sourceType, sourcePath);
      }
    } catch (error) {
      console.error(
        chalk.red(
          `❌ Error extracting rules: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }

    if (rules.length === 0) {
      console.error(chalk.yellow("⚠️  No rules found in source"));
      process.exit(1);
    }

    // Determine target path
    const targetPath = options.target || getDefaultTargetPath(targetType, options.global);

    console.log(chalk.blue(`📋 Found ${rules.length} rule(s) to convert`));
    console.log(chalk.blue(`🎯 Target: ${targetPath}`));

    // Convert each rule
    let successCount = 0;
    for (const rule of rules) {
      try {
        const ruleConfig: RuleConfig = {
          name: rule.name,
          content: rule.content,
          description: rule.description,
        };

        // For multi-file providers (Cursor, Clinerules, VSCode), we need to construct individual file paths
        let finalTargetPath = targetPath;
        if (isMultiFileProvider(targetType)) {
          finalTargetPath = getRulePath(targetType, rule.name, options.global);
        }

        const success = await targetProvider.appendFormattedRule(
          ruleConfig,
          finalTargetPath,
          options.global,
          rule.metadata
        );

        if (success) {
          successCount++;
          console.log(chalk.green(`✅ Converted rule "${rule.name}"`));
        } else {
          console.error(chalk.red(`❌ Failed to convert rule "${rule.name}"`));
        }
      } catch (error) {
        console.error(
          chalk.red(
            `❌ Error converting rule "${rule.name}": ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    }

    console.log(
      chalk.green(
        `\n🎉 Successfully converted ${successCount}/${rules.length} rules from ${sourceFormat} to ${targetFormat}`
      )
    );
  } catch (error) {
    console.error(
      chalk.red(
        `❌ Convert command failed: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    process.exit(1);
  }
}

/**
 * Extract rules from a directory based on the source format
 */
async function extractRulesFromDirectory(
  sourceType: RuleType,
  dirPath: string
): Promise<StoredRuleConfig[]> {
  switch (sourceType) {
    case RuleType.CURSOR:
      return await extractFromCursorDirectory(dirPath);

    case RuleType.CLINERULES:
    case RuleType.ROO:
      return await extractFromClinerulesDireatory(dirPath);

    case RuleType.VSCODE:
      return await extractFromVSCodeDirectory(dirPath);

    default:
      throw new Error(`Directory extraction not supported for ${sourceType}`);
  }
}

/**
 * Extracts rules from a single file based on the source format
 */
async function extractRulesFromFile(
  sourceType: RuleType,
  filePath: string
): Promise<StoredRuleConfig[]> {
  switch (sourceType) {
    case RuleType.CURSOR:
      return await extractFromCursorFile(filePath);

    case RuleType.WINDSURF:
      return await extractFromWindsurfFile(filePath);

    case RuleType.CLAUDE_CODE:
      return await extractFromClaudeCodeFile(filePath);

    case RuleType.CODEX:
      return await extractFromCodexFile(filePath);

    case RuleType.AMP:
      return await extractFromAmpFile(filePath);

    case RuleType.ZED:
    case RuleType.UNIFIED:
      return await extractFromTaggedFile(filePath);

    case RuleType.VSCODE:
      return await extractFromVSCodeFile(filePath);

    default:
      throw new Error(`File extraction not supported for ${sourceType} format`);
  }
}

/**
 * Extract rules from Cursor .mdc files in a directory
 */
async function extractFromCursorDirectory(dirPath: string): Promise<StoredRuleConfig[]> {
  const rules: StoredRuleConfig[] = [];
  const rulesDir = path.join(dirPath, "rules");

  if (!(await fsExtra.pathExists(rulesDir))) {
    throw new Error(`Cursor rules directory not found: ${rulesDir}`);
  }

  const files = await fs.readdir(rulesDir);
  const mdcFiles = files.filter((file) => file.endsWith(".mdc"));

  for (const file of mdcFiles) {
    const filePath = path.join(rulesDir, file);
    const fileRules = await extractFromCursorFile(filePath);
    rules.push(...fileRules);
  }

  return rules;
}

/**
 * Extract rules from a single Cursor .mdc file
 */
async function extractFromCursorFile(filePath: string): Promise<StoredRuleConfig[]> {
  const content = await fs.readFile(filePath, "utf-8");
  const parsed = parseFrontmatter(content);

  const ruleName = path.basename(filePath, ".mdc");

  const metadata: RuleGeneratorOptions = {};
  if (parsed.frontmatter.description) metadata.description = parsed.frontmatter.description;
  if (parsed.frontmatter.alwaysApply !== undefined)
    metadata.alwaysApply = parsed.frontmatter.alwaysApply;
  if (parsed.frontmatter.globs) metadata.globs = parsed.frontmatter.globs;

  return [
    {
      name: ruleName,
      content: parsed.content,
      description: parsed.frontmatter.description,
      metadata,
    },
  ];
}

/**
 * Extract rules from Clinerules .md files in a directory
 */
async function extractFromClinerulesDireatory(dirPath: string): Promise<StoredRuleConfig[]> {
  const rules: StoredRuleConfig[] = [];

  if (!(await fsExtra.pathExists(dirPath))) {
    throw new Error(`Clinerules directory not found: ${dirPath}`);
  }

  const files = await fs.readdir(dirPath);
  const mdFiles = files.filter((file) => file.endsWith(".md"));

  for (const file of mdFiles) {
    const filePath = path.join(dirPath, file);
    const content = await fs.readFile(filePath, "utf-8");
    const ruleName = path.basename(file, ".md");

    // Parse metadata from content if it exists
    const metadata = parseMetadataFromContent(content);

    rules.push({
      name: ruleName,
      content: content,
      metadata,
    });
  }

  return rules;
}

/**
 * Extract rules from VSCode .instructions.md files in a directory
 */
async function extractFromVSCodeDirectory(dirPath: string): Promise<StoredRuleConfig[]> {
  const rules: StoredRuleConfig[] = [];

  if (!(await fsExtra.pathExists(dirPath))) {
    throw new Error(`VSCode instructions directory not found: ${dirPath}`);
  }

  const files = await fs.readdir(dirPath);
  const instructionFiles = files.filter((file) => file.endsWith(".instructions.md"));

  for (const file of instructionFiles) {
    const filePath = path.join(dirPath, file);
    const fileRules = await extractFromVSCodeFile(filePath);
    rules.push(...fileRules);
  }

  return rules;
}

/**
 * Extract rules from a single VSCode .instructions.md file
 */
async function extractFromVSCodeFile(filePath: string): Promise<StoredRuleConfig[]> {
  const content = await fs.readFile(filePath, "utf-8");
  const parsed = parseFrontmatter(content);

  const ruleName = path.basename(filePath, ".instructions.md");

  const metadata: RuleGeneratorOptions = {};
  if (parsed.frontmatter.applyTo) {
    // Convert VSCode applyTo to globs
    metadata.globs = parsed.frontmatter.applyTo;
  }

  return [
    {
      name: ruleName,
      content: parsed.content,
      metadata,
    },
  ];
}

/**
 * Extract rules from Windsurf .windsurfrules file using tagged blocks
 */
async function extractFromWindsurfFile(filePath: string): Promise<StoredRuleConfig[]> {
  return await extractFromTaggedFile(filePath);
}

/**
 * Extract rules from Claude Code CLAUDE.md file
 */
async function extractFromClaudeCodeFile(filePath: string): Promise<StoredRuleConfig[]> {
  return await extractFromTaggedFileWithWrapper(filePath, "<!-- vibe-rules Integration -->");
}

/**
 * Extract rules from Codex AGENTS.md file
 */
async function extractFromCodexFile(filePath: string): Promise<StoredRuleConfig[]> {
  return await extractFromTaggedFileWithWrapper(filePath, "<!-- vibe-rules Integration -->");
}

/**
 * Extract rules from Amp AGENT.md file
 */
async function extractFromAmpFile(filePath: string): Promise<StoredRuleConfig[]> {
  return await extractFromTaggedFile(filePath);
}

/**
 * Extract rules from files with XML-like tagged blocks (Windsurf, ZED, Unified, Amp)
 */
async function extractFromTaggedFile(filePath: string): Promise<StoredRuleConfig[]> {
  const content = await fs.readFile(filePath, "utf-8");
  const rules: StoredRuleConfig[] = [];

  // Regex to match tagged blocks: <rule-name>content</rule-name>
  const tagRegex = /<([^>]+)>([\s\S]*?)<\/\1>/g;
  let match;

  while ((match = tagRegex.exec(content)) !== null) {
    const ruleName = match[1];
    const ruleContent = match[2].trim();

    // Parse metadata from content if it exists
    const metadata = parseMetadataFromContent(ruleContent);
    const cleanContent = removeMetadataFromContent(ruleContent);

    rules.push({
      name: ruleName,
      content: cleanContent,
      metadata,
    });
  }

  return rules;
}

/**
 * Extract rules from files with XML-like tagged blocks within wrapper comments (Claude Code, Codex)
 */
async function extractFromTaggedFileWithWrapper(
  filePath: string,
  wrapperStart: string
): Promise<StoredRuleConfig[]> {
  const content = await fs.readFile(filePath, "utf-8");
  const rules: StoredRuleConfig[] = [];

  // Find the wrapper block
  const wrapperEnd = wrapperStart.replace("vibe-rules Integration", "/vibe-rules Integration");
  const wrapperRegex = new RegExp(
    `${escapeRegex(wrapperStart)}([\\s\\S]*?)${escapeRegex(wrapperEnd)}`
  );
  const wrapperMatch = content.match(wrapperRegex);

  if (!wrapperMatch) {
    debugLog(`No wrapper block found in ${filePath}`);
    return rules;
  }

  const wrapperContent = wrapperMatch[1];

  // Extract tagged blocks within the wrapper
  const tagRegex = /<([^>]+)>([\s\S]*?)<\/\1>/g;
  let match;

  while ((match = tagRegex.exec(wrapperContent)) !== null) {
    const ruleName = match[1];
    const ruleContent = match[2].trim();

    // Parse metadata from content if it exists
    const metadata = parseMetadataFromContent(ruleContent);
    const cleanContent = removeMetadataFromContent(ruleContent);

    rules.push({
      name: ruleName,
      content: cleanContent,
      metadata,
    });
  }

  return rules;
}

/**
 * Parse metadata from rule content (for formats that include metadata as text)
 */
function parseMetadataFromContent(content: string): RuleGeneratorOptions {
  const metadata: RuleGeneratorOptions = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("Always Apply:")) {
      metadata.alwaysApply = trimmed.includes("true");
    } else if (trimmed.startsWith("Globs:")) {
      const globsText = trimmed.replace("Globs:", "").trim();
      if (globsText && globsText !== "None") {
        // Handle both single glob and array format
        if (globsText.includes(",")) {
          metadata.globs = globsText.split(",").map((g) => g.trim());
        } else {
          metadata.globs = globsText;
        }
      }
    }
  }

  return metadata;
}

/**
 * Remove metadata lines from content
 */
function removeMetadataFromContent(content: string): string {
  const lines = content.split("\n");
  const cleanLines = lines.filter((line) => {
    const trimmed = line.trim();
    return !trimmed.startsWith("Always Apply:") && !trimmed.startsWith("Globs:");
  });

  return cleanLines.join("\n").trim();
}

/**
 * Validate and convert string format to RuleType enum
 */
function validateAndGetRuleType(format: string, type: "source" | "target"): RuleType | null {
  const normalizedFormat = format.toLowerCase();

  const formatMap: Record<string, RuleType> = {
    cursor: RuleType.CURSOR,
    windsurf: RuleType.WINDSURF,
    "claude-code": RuleType.CLAUDE_CODE,
    codex: RuleType.CODEX,
    amp: RuleType.AMP,
    clinerules: RuleType.CLINERULES,
    roo: RuleType.ROO,
    zed: RuleType.ZED,
    unified: RuleType.UNIFIED,
    vscode: RuleType.VSCODE,
  };

  const ruleType = formatMap[normalizedFormat];
  if (!ruleType) {
    const available = Object.keys(formatMap).join(", ");
    console.error(
      chalk.red(`❌ Invalid ${type} format: ${format}. Available formats: ${available}`)
    );
    return null;
  }

  return ruleType;
}

/**
 * Check if a rule type uses multiple files (vs single file)
 */
function isMultiFileProvider(ruleType: RuleType): boolean {
  switch (ruleType) {
    case RuleType.CURSOR:
    case RuleType.CLINERULES:
    case RuleType.ROO:
    case RuleType.VSCODE:
      return true;
    default:
      return false;
  }
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
