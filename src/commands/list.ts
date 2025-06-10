import chalk from "chalk";
import { listCommonRules } from "../utils/rule-storage.js";

/**
 * Action handler for the 'vibe-rules list' command.
 * Lists all saved rules from the common store.
 */
export async function listCommandAction(): Promise<void> {
  try {
    const rules = await listCommonRules();

    if (rules.length === 0) {
      console.log(chalk.yellow("No rules found"));
      return;
    }

    console.log(chalk.blue("Available rules:"));
    rules.forEach((rule) => console.log(`- ${rule}`));
  } catch (error) {
    console.error(
      chalk.red(`Error listing rules: ${error instanceof Error ? error.message : error}`)
    );
    process.exit(1);
  }
}
