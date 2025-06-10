import chalk from "chalk";
import { readFile } from "fs/promises";
import { RuleConfig, StoredRuleConfig, RuleGeneratorOptions } from "../types.js";
import { saveCommonRule } from "../utils/rule-storage.js";
import { parseFrontmatter } from "../utils/frontmatter.js";

/**
 * Action handler for the 'vibe-rules save' command.
 * Saves a rule to the local store with metadata support.
 */
export async function saveCommandAction(
  name: string,
  options: {
    content?: string;
    file?: string;
    description?: string;
  }
): Promise<void> {
  try {
    let content: string;
    let originalFileContent: string | undefined;

    if (options.file) {
      originalFileContent = await readFile(options.file, "utf-8");
      content = originalFileContent;
    } else if (options.content) {
      content = options.content;
    } else {
      console.error(chalk.red("Error: Either --content or --file must be specified"));
      process.exit(1);
    }

    const ruleConfig: RuleConfig = {
      name,
      content,
      description: options.description,
    };

    await saveRule(ruleConfig, originalFileContent);
  } catch (error) {
    console.error(
      chalk.red(`Error during save command: ${error instanceof Error ? error.message : error}`)
    );
    process.exit(1);
  }
}

/**
 * Extract metadata from frontmatter if available.
 */
function extractMetadata(
  fileContent: string,
  ruleConfig: RuleConfig
): {
  metadata: RuleGeneratorOptions;
  content: string;
} {
  const { frontmatter, content } = parseFrontmatter(fileContent);
  const metadata: RuleGeneratorOptions = {};

  if (frontmatter.description) {
    metadata.description = frontmatter.description;
    if (!ruleConfig.description) {
      ruleConfig.description = frontmatter.description;
    }
  }
  if (frontmatter.alwaysApply !== undefined) {
    metadata.alwaysApply = frontmatter.alwaysApply;
  }
  if (frontmatter.globs !== undefined) {
    metadata.globs = frontmatter.globs;
  }

  return { metadata, content };
}

/**
 * Display metadata information in console output.
 */
function displayMetadata(metadata: RuleGeneratorOptions): void {
  if (metadata.alwaysApply !== undefined) {
    console.log(chalk.gray(`  - Always Apply: ${metadata.alwaysApply}`));
  }
  if (metadata.globs) {
    const globsStr = Array.isArray(metadata.globs) ? metadata.globs.join(", ") : metadata.globs;
    console.log(chalk.gray(`  - Globs: ${globsStr}`));
  }
}

/**
 * Helper function to save a rule with metadata support.
 * Extracts metadata from frontmatter if file content is provided.
 */
async function saveRule(ruleConfig: RuleConfig, fileContent?: string): Promise<void> {
  try {
    let metadata: RuleGeneratorOptions = {};

    // Extract metadata from frontmatter if file content is provided
    if (fileContent) {
      const extracted = extractMetadata(fileContent, ruleConfig);
      metadata = extracted.metadata;
      ruleConfig.content = extracted.content;
    }

    const storedConfig: StoredRuleConfig = {
      name: ruleConfig.name,
      content: ruleConfig.content,
      description: ruleConfig.description,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };

    const savedPath = await saveCommonRule(storedConfig);

    if (Object.keys(metadata).length > 0) {
      console.log(chalk.green(`Rule "${ruleConfig.name}" saved with metadata to ${savedPath}`));
      displayMetadata(metadata);
    } else {
      console.log(chalk.green(`Rule "${ruleConfig.name}" saved to ${savedPath}`));
    }
  } catch (error) {
    console.error(
      chalk.red(
        `Error saving rule "${ruleConfig.name}": ${error instanceof Error ? error.message : error}`
      )
    );
  }
}
