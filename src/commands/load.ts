import chalk from "chalk";
import * as fs from "fs-extra/esm";
import * as path from "path";
import { RuleConfig, RuleType, RuleGeneratorOptions } from "../types.js";
import { getRuleProvider } from "../providers/index.js";
import { getRulePath } from "../utils/path.js";
import { findSimilarRules } from "../utils/similarity.js";
import { loadCommonRule, listCommonRules } from "../utils/rule-storage.js";

/**
 * Display applied metadata information in console output.
 */
function displayAppliedMetadata(metadata: RuleGeneratorOptions): void {
  if (Object.keys(metadata).length === 0) return;

  console.log(chalk.gray("Applied metadata:"));
  if (metadata.alwaysApply !== undefined) {
    console.log(chalk.gray(`  - Always Apply: ${metadata.alwaysApply}`));
  }
  if (metadata.globs) {
    const globsStr = Array.isArray(metadata.globs) ? metadata.globs.join(", ") : metadata.globs;
    console.log(chalk.gray(`  - Globs: ${globsStr}`));
  }
}

/**
 * Action handler for the 'vibe-rules load' command.
 * Applies a saved rule to an editor configuration with metadata support.
 */
export async function loadCommandAction(
  name: string,
  editor: string,
  options: {
    global?: boolean;
    target?: string;
  }
): Promise<void> {
  try {
    const storedRule = await loadCommonRule(name);

    if (!storedRule) {
      console.error(chalk.red(`Rule "${name}" not found in the common store`));

      const availableRules = await listCommonRules();
      if (availableRules.length > 0) {
        const similarRules = findSimilarRules(name, availableRules);
        if (similarRules.length > 0) {
          console.log(chalk.yellow("\nDid you mean one of these rules?"));
          similarRules.forEach((rule) => console.log(`- ${rule}`));
        }
      }
      process.exit(1);
    }

    const ruleType = editor.toLowerCase() as RuleType;
    const provider = getRuleProvider(ruleType);

    const ruleConfig: RuleConfig = {
      name: storedRule.name,
      content: storedRule.content,
      description: storedRule.description,
    };

    let finalTargetPath: string;
    if (options.target) {
      finalTargetPath = options.target;
    } else {
      finalTargetPath = getRulePath(ruleType, name, options.global);
    }

    fs.ensureDirSync(path.dirname(finalTargetPath));

    // Prepare generator options, combining stored metadata with command options
    const generatorOptions: RuleGeneratorOptions = {
      description: ruleConfig.description,
      isGlobal: options.global,
      ...storedRule.metadata, // Apply any stored metadata
    };

    const success = await provider.appendFormattedRule(
      ruleConfig,
      finalTargetPath,
      options.global,
      generatorOptions
    );

    if (success) {
      console.log(
        chalk.green(`Rule "${name}" applied successfully for ${editor} at ${finalTargetPath}`)
      );

      // Show applied metadata if any
      if (storedRule.metadata) {
        displayAppliedMetadata(storedRule.metadata);
      }
    } else {
      console.error(chalk.red(`Failed to apply rule "${name}" for ${editor}.`));
      process.exit(1);
    }
  } catch (error) {
    console.error(
      chalk.red(`Error loading rule: ${error instanceof Error ? error.message : error}`)
    );
    process.exit(1);
  }
}
