/**
 * Shared Integration Test for vibe-rules Installation
 *
 * This test file is shared between both end-user-cjs-package and end-user-esm-package
 * via a symbolic link. The ESM package contains a symlink:
 * examples/end-user-esm-package/install.test.ts -> ../end-user-cjs-package/install.test.ts
 *
 * This approach ensures both packages run the EXACT same comprehensive test suite
 * without any code duplication, and changes are automatically synchronized.
 *
 * The tests validate the complete vibe-rules installation workflow for all supported editors:
 * - Cursor (.cursor/rules/*.mdc files)
 * - Windsurf (.windsurfrules file with tagged blocks)
 * - Clinerules (.clinerules/*.md files)
 * - Claude Code (CLAUDE.md file with tagged blocks)
 * - Codex (AGENTS.md file with tagged blocks)
 * - Amp (AGENT.md file with tagged blocks)
 * - ZED (.rules file with tagged blocks)
 */

import { test, expect } from "bun:test";
import { $ } from "bun";
import { readdir, stat, readFile } from "fs/promises";
import { join } from "path";
import { pathExists } from "fs-extra";

test("install should create 8 rules files in .cursor/rules", async () => {
  // Import the llms modules from our dependencies
  const cjsRules = require("cjs-package/llms");
  const esmRules = await import("esm-package/llms");

  // Clean up any existing .cursor directory
  await $`rm -rf .cursor`.quiet();

  // Run npm install
  console.log("Running npm install...");
  await $`npm install`;

  // Run vibe-rules install cursor command
  console.log("Running vibe-rules install cursor...");
  await $`npm run vibe-rules install cursor`;

  // Check that .cursor/rules directory exists
  const cursorRulesPath = join(process.cwd(), ".cursor", "rules");
  const cursorRulesStat = await stat(cursorRulesPath);
  expect(cursorRulesStat.isDirectory()).toBe(true);

  // Read the files in .cursor/rules directory
  const rulesFiles = await readdir(cursorRulesPath);

  // Filter only .mdc files (rules are stored as .mdc files)
  const mdcFiles = rulesFiles.filter((file) => file.endsWith(".mdc"));

  console.log(`Found ${mdcFiles.length} rules files:`, mdcFiles);

  // Expect 8 rules files (4 from cjs-package + 4 from esm-package)
  expect(mdcFiles.length).toBe(cjsRules.length + esmRules.default.length);

  // Get expected rule names from the imported modules
  const cjsRuleNames = cjsRules.map((r) => r.name);
  const esmRuleNames = esmRules.default.map((r) => r.name);
  const expectedRules = [...new Set([...cjsRuleNames, ...esmRuleNames])]; // Unique names

  // Check that we have rules from both packages
  for (const rule of expectedRules) {
    const cjsRuleExists = mdcFiles.some((file) => file.includes("cjs") && file.includes(rule));
    const esmRuleExists = mdcFiles.some((file) => file.includes("esm") && file.includes(rule));

    expect(cjsRuleExists).toBe(true);
    expect(esmRuleExists).toBe(true);
  }

  // Additional assertions based on imported llms modules
  console.log("Validating imported rules structure...");

  // Validate CJS rules structure
  expect(Array.isArray(cjsRules)).toBe(true);
  expect(cjsRules.length).toBe(4);

  // Validate ESM rules structure (should be default export)
  const esmRulesArray = esmRules.default;
  expect(Array.isArray(esmRulesArray)).toBe(true);
  expect(esmRulesArray.length).toBe(4);

  // Validate that each rule has the expected properties
  const allRules = [...cjsRules, ...esmRulesArray];
  for (const rule of allRules) {
    expect(rule).toHaveProperty("name");
    expect(rule).toHaveProperty("rule"); // Note: uses 'rule' not 'content'
    expect(rule).toHaveProperty("alwaysApply");

    expect(typeof rule.name).toBe("string");
    expect(typeof rule.rule).toBe("string");
    expect(typeof rule.alwaysApply).toBe("boolean");

    // description and globs are optional
    if (rule.description !== undefined) {
      expect(typeof rule.description).toBe("string");
    }
    if (rule.globs !== undefined) {
      expect(Array.isArray(rule.globs) || typeof rule.globs === "string").toBe(true);
    }
  }

  // Validate specific rule names exist in both packages
  for (const expectedRule of cjsRuleNames) {
    expect(cjsRuleNames).toContain(expectedRule);
  }

  for (const expectedRule of esmRuleNames) {
    expect(esmRuleNames).toContain(expectedRule);
  }

  // Read and validate actual file contents match the imported rules
  console.log("Validating file content matches imported rules...");

  for (const rule of cjsRules) {
    const fileName = `cjs-package_${rule.name}.mdc`;
    expect(mdcFiles).toContain(fileName);

    const filePath = join(cursorRulesPath, fileName);
    const fileContent = await readFile(filePath, "utf-8");

    // Check that the rule content appears in the file
    expect(fileContent).toContain(rule.rule);
    // Description appears in frontmatter for Cursor if it exists
    if (rule.description) {
      expect(fileContent).toContain(rule.description);
    }
  }

  for (const rule of esmRulesArray) {
    const fileName = `esm-package_${rule.name}.mdc`;
    expect(mdcFiles).toContain(fileName);

    const filePath = join(cursorRulesPath, fileName);
    const fileContent = await readFile(filePath, "utf-8");

    // Check that the rule content appears in the file
    expect(fileContent).toContain(rule.rule);
    // Description appears in frontmatter for Cursor if it exists
    if (rule.description) {
      expect(fileContent).toContain(rule.description);
    }
  }

  console.log("✅ All assertions passed! Rules properly installed and match source modules.");

  // Clean up .cursor directory at the end of the test
  await $`rm -rf .cursor`.quiet();
});

test("install should create rules in .windsurfrules file", async () => {
  // Import the llms modules from our dependencies
  const cjsRules = require("cjs-package/llms");
  const esmRules = await import("esm-package/llms");

  // Clean up any existing .windsurfrules file
  await $`rm -f .windsurfrules`.quiet();

  // Run npm install
  console.log("Running npm install...");
  await $`npm install`;

  // Run vibe-rules install windsurf command
  console.log("Running vibe-rules install windsurf...");
  await $`npm run vibe-rules install windsurf`;

  // Check that .windsurfrules file exists
  const windsurfRulesPath = join(process.cwd(), ".windsurfrules");
  const windsurfRulesStat = await stat(windsurfRulesPath);
  expect(windsurfRulesStat.isFile()).toBe(true);

  // Read the .windsurfrules file content
  const rulesFileContent = await readFile(windsurfRulesPath, "utf-8");

  console.log("Validating .windsurfrules file content...");

  // Get expected rule names from the imported modules
  const cjsRuleNames = cjsRules.map((r) => r.name);
  const esmRuleNames = esmRules.default.map((r) => r.name);
  const expectedRules = [...new Set([...cjsRuleNames, ...esmRuleNames])]; // Unique names

  // Count the number of rule blocks in the file
  // Each rule should be wrapped in XML-like tags: <packageName_ruleName>...</packageName_ruleName>
  const ruleBlockPattern = /<[^>]+>[\s\S]*?<\/[^>]+>/g;
  const ruleBlocks = rulesFileContent.match(ruleBlockPattern) || [];

  console.log(`Found ${ruleBlocks.length} rule blocks in .windsurfrules file`);

  // Expect 8 rule blocks (4 from cjs-package + 4 from esm-package)
  expect(ruleBlocks.length).toBe(cjsRules.length + esmRules.default.length);

  // Validate that rules from both packages are present
  for (const rule of expectedRules) {
    const cjsRuleTag = `<cjs-package_${rule}>`;
    const esmRuleTag = `<esm-package_${rule}>`;

    expect(rulesFileContent).toContain(cjsRuleTag);
    expect(rulesFileContent).toContain(esmRuleTag);
  }

  // Validate that the actual rule content from imported modules appears in the file
  console.log("Validating rule content matches imported modules...");

  const allRules = [...cjsRules, ...esmRules.default];
  for (const rule of allRules) {
    // Check that the rule content appears in the file
    expect(rulesFileContent).toContain(rule.rule);
    // Note: description is metadata and may not appear directly in the content
  }

  // Validate that metadata is included (alwaysApply and globs)
  for (const rule of allRules) {
    if (rule.alwaysApply) {
      expect(rulesFileContent).toContain("Always Apply: true");
    }
    if (rule.globs && rule.globs.length > 0) {
      expect(rulesFileContent).toContain("Always apply this rule in these files:");
    }
  }

  console.log(
    "✅ All Windsurf assertions passed! Rules properly installed in .windsurfrules file."
  );

  // Clean up .windsurfrules file at the end of the test
  await $`rm -f .windsurfrules`.quiet();
});

test("install should create 8 rules files in .clinerules directory", async () => {
  // Import the llms modules from our dependencies
  const cjsRules = require("cjs-package/llms");
  const esmRules = await import("esm-package/llms");

  // Clean up any existing .clinerules directory
  await $`rm -rf .clinerules`.quiet();

  // Run npm install
  console.log("Running npm install...");
  await $`npm install`;

  // Run vibe-rules install clinerules command
  console.log("Running vibe-rules install clinerules...");
  await $`npm run vibe-rules install clinerules`;

  // Check that .clinerules directory exists
  const clinerulesPath = join(process.cwd(), ".clinerules");
  const clinerulesStat = await stat(clinerulesPath);
  expect(clinerulesStat.isDirectory()).toBe(true);

  // Read the files in .clinerules directory
  const rulesFiles = await readdir(clinerulesPath);

  // Filter only .md files (rules are stored as .md files)
  const mdFiles = rulesFiles.filter((file) => file.endsWith(".md"));

  console.log(`Found ${mdFiles.length} rules files:`, mdFiles);

  // Expect 8 rules files (4 from cjs-package + 4 from esm-package)
  expect(mdFiles.length).toBe(cjsRules.length + esmRules.default.length);

  // Get expected rule names from the imported modules
  const cjsRuleNames = cjsRules.map((r) => r.name);
  const esmRuleNames = esmRules.default.map((r) => r.name);
  const expectedRules = [...new Set([...cjsRuleNames, ...esmRuleNames])]; // Unique names

  // Check that we have rules from both packages
  for (const rule of expectedRules) {
    const cjsRuleExists = mdFiles.some((file) => file.includes("cjs") && file.includes(rule));
    const esmRuleExists = mdFiles.some((file) => file.includes("esm") && file.includes(rule));

    expect(cjsRuleExists).toBe(true);
    expect(esmRuleExists).toBe(true);
  }

  // Additional assertions based on imported llms modules
  console.log("Validating imported rules structure...");

  // Validate CJS rules structure
  expect(Array.isArray(cjsRules)).toBe(true);
  expect(cjsRules.length).toBe(4);

  // Validate ESM rules structure (should be default export)
  const esmRulesArray = esmRules.default;
  expect(Array.isArray(esmRulesArray)).toBe(true);
  expect(esmRulesArray.length).toBe(4);

  // Validate that each rule has the expected properties
  const allRules = [...cjsRules, ...esmRulesArray];
  for (const rule of allRules) {
    expect(rule).toHaveProperty("name");
    expect(rule).toHaveProperty("rule"); // Note: uses 'rule' not 'content'
    expect(rule).toHaveProperty("alwaysApply");

    expect(typeof rule.name).toBe("string");
    expect(typeof rule.rule).toBe("string");
    expect(typeof rule.alwaysApply).toBe("boolean");

    // description and globs are optional
    if (rule.description !== undefined) {
      expect(typeof rule.description).toBe("string");
    }
    if (rule.globs !== undefined) {
      expect(Array.isArray(rule.globs) || typeof rule.globs === "string").toBe(true);
    }
  }

  // Validate specific rule names exist in both packages
  for (const expectedRule of cjsRuleNames) {
    expect(cjsRuleNames).toContain(expectedRule);
  }

  for (const expectedRule of esmRuleNames) {
    expect(esmRuleNames).toContain(expectedRule);
  }

  // Read and validate actual file contents match the imported rules
  console.log("Validating file content matches imported rules...");

  for (const rule of cjsRules) {
    const fileName = `cjs-package_${rule.name}.md`;
    expect(mdFiles).toContain(fileName);

    const filePath = join(clinerulesPath, fileName);
    const fileContent = await readFile(filePath, "utf-8");

    // Check that the rule content appears in the file
    expect(fileContent).toContain(rule.rule);
    // Note: description format may vary, just check rule content

    // Validate metadata is included (formatted by formatRuleWithMetadata)
    if (rule.alwaysApply) {
      expect(fileContent).toContain("Always Apply: true");
    }
    if (rule.globs && rule.globs.length > 0) {
      expect(fileContent).toContain("Always apply this rule in these files:");
    }
  }

  for (const rule of esmRulesArray) {
    const fileName = `esm-package_${rule.name}.md`;
    expect(mdFiles).toContain(fileName);

    const filePath = join(clinerulesPath, fileName);
    const fileContent = await readFile(filePath, "utf-8");

    // Check that the rule content appears in the file
    expect(fileContent).toContain(rule.rule);
    // Note: description format may vary, just check rule content

    // Validate metadata is included (formatted by formatRuleWithMetadata)
    if (rule.alwaysApply) {
      expect(fileContent).toContain("Always Apply: true");
    }
    if (rule.globs && rule.globs.length > 0) {
      expect(fileContent).toContain("Always apply this rule in these files:");
    }
  }

  console.log(
    "✅ All Clinerules assertions passed! Rules properly installed and match source modules."
  );

  // Clean up .clinerules directory at the end of the test
  await $`rm -rf .clinerules`.quiet();
});

test("install should create rules in CLAUDE.md file", async () => {
  // Import the llms modules from our dependencies
  const cjsRules = require("cjs-package/llms");
  const esmRules = await import("esm-package/llms");

  // Clean up any existing CLAUDE.md file
  await $`rm -f CLAUDE.md`.quiet();

  // Run npm install
  console.log("Running npm install...");
  await $`npm install`;

  // Run vibe-rules install claude-code command
  console.log("Running vibe-rules install claude-code...");
  await $`npm run vibe-rules install claude-code`;

  // Check that CLAUDE.md file exists
  const claudeFilePath = join(process.cwd(), "CLAUDE.md");
  const claudeFileStat = await stat(claudeFilePath);
  expect(claudeFileStat.isFile()).toBe(true);

  // Read the CLAUDE.md file content
  const claudeFileContent = await readFile(claudeFilePath, "utf-8");

  console.log("Validating CLAUDE.md file content...");

  // Get expected rule names from the imported modules
  const cjsRuleNames = cjsRules.map((r) => r.name);
  const esmRuleNames = esmRules.default.map((r) => r.name);
  const expectedRules = [...new Set([...cjsRuleNames, ...esmRuleNames])]; // Unique names

  // Count the number of rule blocks in the file
  // Each rule should be wrapped in XML-like tags: <packageName_ruleName>...</packageName_ruleName>
  const ruleBlockPattern = /<[^>]+>[\s\S]*?<\/[^>]+>/g;
  const ruleBlocks = claudeFileContent.match(ruleBlockPattern) || [];

  console.log(`Found ${ruleBlocks.length} rule blocks in CLAUDE.md file`);

  // Expect 8 rule blocks (4 from cjs-package + 4 from esm-package)
  expect(ruleBlocks.length).toBe(cjsRules.length + esmRules.default.length);

  // Check for vibe-rules Integration block
  expect(claudeFileContent).toContain("<!-- vibe-rules Integration -->");
  expect(claudeFileContent).toContain("<!-- /vibe-rules Integration -->");

  // Validate that rules from both packages are present
  for (const rule of expectedRules) {
    const cjsRuleTag = `<cjs-package_${rule}>`;
    const esmRuleTag = `<esm-package_${rule}>`;

    expect(claudeFileContent).toContain(cjsRuleTag);
    expect(claudeFileContent).toContain(esmRuleTag);
  }

  // Validate that the actual rule content from imported modules appears in the file
  console.log("Validating rule content matches imported modules...");

  const allRules = [...cjsRules, ...esmRules.default];
  for (const rule of allRules) {
    // Check that the rule content appears in the file
    expect(claudeFileContent).toContain(rule.rule);
    // Note: description is metadata and may not appear directly in the content
  }

  // Validate that metadata is included (alwaysApply and globs)
  for (const rule of allRules) {
    if (rule.alwaysApply) {
      expect(claudeFileContent).toContain("Always Apply: true");
    }
    if (rule.globs && rule.globs.length > 0) {
      expect(claudeFileContent).toContain("Always apply this rule in these files:");
    }
  }

  console.log("✅ All Claude Code assertions passed! Rules properly installed in CLAUDE.md file.");

  // Clean up CLAUDE.md file at the end of the test
  await $`rm -f CLAUDE.md`.quiet();
});

test("install should create rules in AGENTS.md file", async () => {
  // Import the llms modules from our dependencies
  const cjsRules = require("cjs-package/llms");
  const esmRules = await import("esm-package/llms");

  // Clean up any existing AGENTS.md file
  await $`rm -f AGENTS.md`.quiet();

  // Run npm install
  console.log("Running npm install...");
  await $`npm install`;

  // Run vibe-rules install codex command
  console.log("Running vibe-rules install codex...");
  await $`npm run vibe-rules install codex`;

  // Check that AGENTS.md file exists
  const codexFilePath = join(process.cwd(), "AGENTS.md");
  const codexFileStat = await stat(codexFilePath);
  expect(codexFileStat.isFile()).toBe(true);

  // Read the AGENTS.md file content
  const codexFileContent = await readFile(codexFilePath, "utf-8");

  console.log("Validating AGENTS.md file content...");

  // Get expected rule names from the imported modules
  const cjsRuleNames = cjsRules.map((r) => r.name);
  const esmRuleNames = esmRules.default.map((r) => r.name);
  const expectedRules = [...new Set([...cjsRuleNames, ...esmRuleNames])]; // Unique names

  // Count the number of rule blocks in the file
  // Each rule should be wrapped in XML-like tags: <packageName_ruleName>...</packageName_ruleName>
  const ruleBlockPattern = /<[^>]+>[\s\S]*?<\/[^>]+>/g;
  const ruleBlocks = codexFileContent.match(ruleBlockPattern) || [];

  console.log(`Found ${ruleBlocks.length} rule blocks in AGENTS.md file`);

  // Expect 8 rule blocks (4 from cjs-package + 4 from esm-package)
  expect(ruleBlocks.length).toBe(cjsRules.length + esmRules.default.length);

  // Check for vibe-rules Integration block
  expect(codexFileContent).toContain("<!-- vibe-rules Integration -->");
  expect(codexFileContent).toContain("<!-- /vibe-rules Integration -->");

  // Validate that rules from both packages are present
  for (const rule of expectedRules) {
    const cjsRuleTag = `<cjs-package_${rule}>`;
    const esmRuleTag = `<esm-package_${rule}>`;

    expect(codexFileContent).toContain(cjsRuleTag);
    expect(codexFileContent).toContain(esmRuleTag);
  }

  // Validate that the actual rule content from imported modules appears in the file
  console.log("Validating rule content matches imported modules...");

  const allRules = [...cjsRules, ...esmRules.default];
  for (const rule of allRules) {
    // Check that the rule content appears in the file
    expect(codexFileContent).toContain(rule.rule);
    // Note: description is metadata and may not appear directly in the content
  }

  // Validate that metadata is included (alwaysApply and globs)
  for (const rule of allRules) {
    if (rule.alwaysApply) {
      expect(codexFileContent).toContain("Always Apply: true");
    }
    if (rule.globs && rule.globs.length > 0) {
      expect(codexFileContent).toContain("Always apply this rule in these files:");
    }
  }

  console.log("✅ All Codex assertions passed! Rules properly installed in AGENTS.md file.");

  // Clean up AGENTS.md file at the end of the test
  await $`rm -f AGENTS.md`.quiet();
});

test("install should create rules in AGENT.md file", async () => {
  // Import the llms modules from our dependencies
  const cjsRules = require("cjs-package/llms");
  const esmRules = await import("esm-package/llms");

  // Clean up any existing AGENT.md file
  await $`rm -f AGENT.md`.quiet();

  // Run npm install
  console.log("Running npm install...");
  await $`npm install`;

  // Run vibe-rules install amp command
  console.log("Running vibe-rules install amp...");
  await $`npm run vibe-rules install amp`;

  // Check that AGENT.md file exists
  const ampFilePath = join(process.cwd(), "AGENT.md");
  const ampFileStat = await stat(ampFilePath);
  expect(ampFileStat.isFile()).toBe(true);

  // Read the AGENT.md file content
  const ampFileContent = await readFile(ampFilePath, "utf-8");

  console.log("Validating AGENT.md file content...");

  // Get expected rule names from the imported modules
  const cjsRuleNames = cjsRules.map((r) => r.name);
  const esmRuleNames = esmRules.default.map((r) => r.name);
  const expectedRules = [...new Set([...cjsRuleNames, ...esmRuleNames])]; // Unique names

  // Count the number of rule blocks in the file
  // Each rule should be wrapped in XML-like tags: <packageName_ruleName>...</packageName_ruleName>
  const ruleBlockPattern = /<[^>]+>[\s\S]*?<\/[^>]+>/g;
  const ruleBlocks = ampFileContent.match(ruleBlockPattern) || [];

  console.log(`Found ${ruleBlocks.length} rule blocks in AGENT.md file`);

  // Expect 8 rule blocks (4 from cjs-package + 4 from esm-package)
  expect(ruleBlocks.length).toBe(cjsRules.length + esmRules.default.length);

  // Amp doesn't use wrapper blocks like Claude Code or Codex (simple like ZED)
  // Validate that rules from both packages are present
  for (const rule of expectedRules) {
    const cjsRuleTag = `<cjs-package_${rule}>`;
    const esmRuleTag = `<esm-package_${rule}>`;

    expect(ampFileContent).toContain(cjsRuleTag);
    expect(ampFileContent).toContain(esmRuleTag);
  }

  // Validate that the actual rule content from imported modules appears in the file
  console.log("Validating rule content matches imported modules...");

  const allRules = [...cjsRules, ...esmRules.default];
  for (const rule of allRules) {
    // Check that the rule content appears in the file
    expect(ampFileContent).toContain(rule.rule);
    // Note: description is metadata and may not appear directly in the content
  }

  // Validate that metadata is included (alwaysApply and globs)
  for (const rule of allRules) {
    if (rule.alwaysApply) {
      expect(ampFileContent).toContain("Always Apply: true");
    }
    if (rule.globs && rule.globs.length > 0) {
      expect(ampFileContent).toContain("Always apply this rule in these files:");
    }
  }

  console.log("✅ All Amp assertions passed! Rules properly installed in AGENT.md file.");

  // Clean up AGENT.md file at the end of the test
  await $`rm -f AGENT.md`.quiet();
});

test("install should create rules in .rules file", async () => {
  // Import the llms modules from our dependencies
  const cjsRules = require("cjs-package/llms");
  const esmRules = await import("esm-package/llms");

  // Clean up any existing .rules file
  await $`rm -f .rules`.quiet();

  // Run npm install
  console.log("Running npm install...");
  await $`npm install`;

  // Run vibe-rules install zed command
  console.log("Running vibe-rules install zed...");
  await $`npm run vibe-rules install zed`;

  // Check that .rules file exists
  const zedFilePath = join(process.cwd(), ".rules");
  const zedFileStat = await stat(zedFilePath);
  expect(zedFileStat.isFile()).toBe(true);

  // Read the .rules file content
  const zedFileContent = await readFile(zedFilePath, "utf-8");

  console.log("Validating .rules file content...");

  // Get expected rule names from the imported modules
  const cjsRuleNames = cjsRules.map((r) => r.name);
  const esmRuleNames = esmRules.default.map((r) => r.name);
  const expectedRules = [...new Set([...cjsRuleNames, ...esmRuleNames])]; // Unique names

  // Count the number of rule blocks in the file
  // Each rule should be wrapped in XML-like tags: <packageName_ruleName>...</packageName_ruleName>
  const ruleBlockPattern = /<[^>]+>[\s\S]*?<\/[^>]+>/g;
  const ruleBlocks = zedFileContent.match(ruleBlockPattern) || [];

  console.log(`Found ${ruleBlocks.length} rule blocks in .rules file`);

  // Expect 8 rule blocks (4 from cjs-package + 4 from esm-package)
  expect(ruleBlocks.length).toBe(cjsRules.length + esmRules.default.length);

  // ZED doesn't use wrapper blocks like Claude Code or Codex
  // Validate that rules from both packages are present
  for (const rule of expectedRules) {
    const cjsRuleTag = `<cjs-package_${rule}>`;
    const esmRuleTag = `<esm-package_${rule}>`;

    expect(zedFileContent).toContain(cjsRuleTag);
    expect(zedFileContent).toContain(esmRuleTag);
  }

  // Validate that the actual rule content from imported modules appears in the file
  console.log("Validating rule content matches imported modules...");

  const allRules = [...cjsRules, ...esmRules.default];
  for (const rule of allRules) {
    // Check that the rule content appears in the file
    expect(zedFileContent).toContain(rule.rule);
    // Note: description is metadata and may not appear directly in the content
  }

  // Validate that metadata is included (alwaysApply and globs)
  for (const rule of allRules) {
    if (rule.alwaysApply) {
      expect(zedFileContent).toContain("Always Apply: true");
    }
    if (rule.globs && rule.globs.length > 0) {
      expect(zedFileContent).toContain("Always apply this rule in these files:");
    }
  }

  console.log("✅ All ZED assertions passed! Rules properly installed in .rules file.");

  // Clean up .rules file at the end of the test
  await $`rm -f .rules`.quiet();
});

test("install should create 8 rules files in .github/instructions", async () => {
  // Import the llms modules from our dependencies
  const cjsRules = require("cjs-package/llms");
  const esmRules = await import("esm-package/llms");

  // Clean up any existing .github directory (not just instructions subdirectory)
  await $`rm -rf .github`.quiet();

  // Run npm install
  console.log("Running npm install...");
  await $`npm install`;

  // Run vibe-rules install vscode command
  console.log("Running vibe-rules install vscode...");
  await $`npm run vibe-rules install vscode`;

  // Check that .github/instructions directory exists
  const vscodeInstructionsPath = join(process.cwd(), ".github", "instructions");
  const vscodeInstructionsStat = await stat(vscodeInstructionsPath);
  expect(vscodeInstructionsStat.isDirectory()).toBe(true);

  // Read the files in .github/instructions directory
  const instructionFiles = await readdir(vscodeInstructionsPath);

  // Filter only .instructions.md files
  const instructionMdFiles = instructionFiles.filter((file) => file.endsWith(".instructions.md"));

  console.log(`Found ${instructionMdFiles.length} instruction files:`, instructionMdFiles);

  // Expect 8 instruction files (4 from cjs-package + 4 from esm-package)
  expect(instructionMdFiles.length).toBe(cjsRules.length + esmRules.default.length);

  // Get expected rule names from the imported modules
  const cjsRuleNames = cjsRules.map((r) => r.name);
  const esmRuleNames = esmRules.default.map((r) => r.name);
  const expectedRules = [...new Set([...cjsRuleNames, ...esmRuleNames])]; // Unique names

  // Check that we have rules from both packages
  for (const rule of expectedRules) {
    const cjsRuleExists = instructionMdFiles.some(
      (file) => file.includes("cjs") && file.includes(rule)
    );
    const esmRuleExists = instructionMdFiles.some(
      (file) => file.includes("esm") && file.includes(rule)
    );

    expect(cjsRuleExists).toBe(true);
    expect(esmRuleExists).toBe(true);
  }

  // Validate imported rules structure (same as other tests)
  console.log("Validating imported rules structure...");

  expect(Array.isArray(cjsRules)).toBe(true);
  expect(cjsRules.length).toBe(4);

  const esmRulesArray = esmRules.default;
  expect(Array.isArray(esmRulesArray)).toBe(true);
  expect(esmRulesArray.length).toBe(4);

  // Validate that each rule has the expected properties
  const allRules = [...cjsRules, ...esmRulesArray];
  for (const rule of allRules) {
    expect(rule).toHaveProperty("name");
    expect(rule).toHaveProperty("rule");
    expect(rule).toHaveProperty("alwaysApply");

    expect(typeof rule.name).toBe("string");
    expect(typeof rule.rule).toBe("string");
    expect(typeof rule.alwaysApply).toBe("boolean");

    if (rule.description !== undefined) {
      expect(typeof rule.description).toBe("string");
    }
    if (rule.globs !== undefined) {
      expect(Array.isArray(rule.globs) || typeof rule.globs === "string").toBe(true);
    }
  }

  // Read and validate actual file contents match the imported rules
  console.log("Validating file content matches imported rules...");

  for (const rule of cjsRules) {
    const fileName = `cjs-package_${rule.name}.instructions.md`;
    expect(instructionMdFiles).toContain(fileName);

    const filePath = join(vscodeInstructionsPath, fileName);
    const fileContent = await readFile(filePath, "utf-8");

    // Check that the rule content appears in the file
    expect(fileContent).toContain(rule.rule);

    // Check for description in VSCode comment format if it exists
    if (rule.description) {
      expect(fileContent).toContain(rule.description);
    }

    // Check for VSCode-specific frontmatter (always ** due to VSCode glob limitations)
    expect(fileContent).toContain('applyTo: "**"');
  }

  for (const rule of esmRulesArray) {
    const fileName = `esm-package_${rule.name}.instructions.md`;
    expect(instructionMdFiles).toContain(fileName);

    const filePath = join(vscodeInstructionsPath, fileName);
    const fileContent = await readFile(filePath, "utf-8");

    // Check that the rule content appears in the file
    expect(fileContent).toContain(rule.rule);

    // Check for description in VSCode comment format if it exists
    if (rule.description) {
      expect(fileContent).toContain(rule.description);
    }

    // Check for VSCode-specific frontmatter (always ** due to VSCode glob limitations)
    expect(fileContent).toContain('applyTo: "**"');
  }

  console.log(
    "✅ All VSCode assertions passed! Rules properly installed and match source modules."
  );

  // Clean up .github directory at the end of the test
  await $`rm -rf .github`.quiet();
});

test("should convert rules from cursor to claude-code format", async () => {
  // First, install cursor rules to have something to convert
  await $`rm -rf .cursor CLAUDE.md`;
  await $`npm install`;
  await $`npm run vibe-rules install cursor`;

  // Verify cursor rules were installed
  expect(await pathExists(".cursor/rules")).toBe(true);
  const cursorFiles = await readdir(".cursor/rules");
  const mdcFiles = cursorFiles.filter((file) => file.endsWith(".mdc"));
  expect(mdcFiles.length).toBe(8);

  // Convert cursor directory to claude-code format
  await $`npm run vibe-rules convert cursor claude-code .cursor`;

  // Verify claude-code file was created
  expect(await pathExists("CLAUDE.md")).toBe(true);
  const claudeContent = await readFile("CLAUDE.md", "utf-8");

  // Check for integration wrapper block
  expect(claudeContent).toContain("<!-- vibe-rules Integration -->");
  expect(claudeContent).toContain("<!-- /vibe-rules Integration -->");

  // Count tagged blocks in claude content
  const taggedBlocks = [...claudeContent.matchAll(/<([^>]+)>([\s\S]*?)<\/\1>/g)];
  expect(taggedBlocks.length).toBe(8);

  // Verify rule names are preserved
  const ruleNames = taggedBlocks.map((match) => match[1]);
  expect(ruleNames).toContain("cjs-package_usage");
  expect(ruleNames).toContain("esm-package_api");

  // Cleanup
  await $`rm -rf .cursor CLAUDE.md`;
});

test("should convert individual rule file from windsurf to cursor format", async () => {
  // First, install windsurf rules to have something to convert
  await $`rm -rf .cursor .windsurfrules`;
  await $`npm install`;
  await $`npm run vibe-rules install windsurf`;

  // Verify windsurf file was created
  expect(await pathExists(".windsurfrules")).toBe(true);
  const windsurfContent = await readFile(".windsurfrules", "utf-8");
  const taggedBlocks = [...windsurfContent.matchAll(/<([^>]+)>([\s\S]*?)<\/\1>/g)];
  expect(taggedBlocks.length).toBe(8);

  // Convert windsurf file to cursor format
  await $`npm run vibe-rules convert windsurf cursor .windsurfrules`;

  // Verify cursor directory was created
  expect(await pathExists(".cursor/rules")).toBe(true);
  const cursorFiles = await readdir(".cursor/rules");
  const mdcFiles = cursorFiles.filter((file) => file.endsWith(".mdc"));
  expect(mdcFiles.length).toBe(8);

  // Verify specific rule files exist
  expect(cursorFiles).toContain("cjs-package_usage.mdc");
  expect(cursorFiles).toContain("esm-package_api.mdc");

  // Check one specific file has correct format
  const sampleRuleContent = await readFile(".cursor/rules/cjs-package_usage.mdc", "utf-8");
  expect(sampleRuleContent).toContain("---"); // frontmatter
  expect(sampleRuleContent).toContain("alwaysApply: true"); // metadata preserved

  // Cleanup
  await $`rm -rf .cursor .windsurfrules`;
});

test("should convert VSCode directory to unified format", async () => {
  // First, install VSCode rules to have something to convert
  await $`rm -rf .github/instructions .rules`;
  await $`npm install`;
  await $`npm run vibe-rules install vscode`;

  // Verify VSCode directory was created
  expect(await pathExists(".github/instructions")).toBe(true);
  const vscodeFiles = await readdir(".github/instructions");
  const instructionFiles = vscodeFiles.filter((file) => file.endsWith(".instructions.md"));
  expect(instructionFiles.length).toBe(8);

  // Convert VSCode directory to unified format
  await $`npm run vibe-rules convert vscode unified .github/instructions`;

  // Verify unified .rules file was created
  expect(await pathExists(".rules")).toBe(true);
  const unifiedContent = await readFile(".rules", "utf-8");

  // Count tagged blocks in unified content
  const taggedBlocks = [...unifiedContent.matchAll(/<([^>]+)>([\s\S]*?)<\/\1>/g)];
  expect(taggedBlocks.length).toBe(8);

  // Verify rule names are preserved
  const ruleNames = taggedBlocks.map((match) => match[1]);
  expect(ruleNames).toContain("cjs-package_usage");
  expect(ruleNames).toContain("esm-package_api");

  // Cleanup
  await $`rm -rf .github/instructions .rules`;
});

test("should handle custom target path in convert command", async () => {
  // First, install cursor rules
  await $`rm -rf .cursor custom-claude.md`;
  await $`npm install`;
  await $`npm run vibe-rules install cursor`;

  // Convert cursor to claude-code with custom target (use -- to separate npm args from our args)
  await $`npm run vibe-rules -- convert cursor claude-code .cursor --target custom-claude.md`;

  // Verify custom target file was created
  expect(await pathExists("custom-claude.md")).toBe(true);
  const claudeContent = await readFile("custom-claude.md", "utf-8");

  // Verify content structure
  expect(claudeContent).toContain("<!-- vibe-rules Integration -->");
  const taggedBlocks = [...claudeContent.matchAll(/<([^>]+)>([\s\S]*?)<\/\1>/g)];
  expect(taggedBlocks.length).toBe(8);

  // Cleanup
  await $`rm -rf .cursor custom-claude.md`;
});

test("should show error for invalid source format", async () => {
  const result = await $`npm run vibe-rules convert invalid-format cursor .cursor`.nothrow();

  expect(result.exitCode).not.toBe(0);
  expect(result.stderr.toString()).toContain("Invalid source format");
});

test("should show error for same source and target formats", async () => {
  const result = await $`npm run vibe-rules convert cursor cursor .cursor`.nothrow();

  expect(result.exitCode).not.toBe(0);
  expect(result.stderr.toString()).toContain("Source and target formats cannot be the same");
});

test("should show error for non-existent source path", async () => {
  const result =
    await $`npm run vibe-rules convert cursor claude-code ./non-existent-path`.nothrow();

  expect(result.exitCode).not.toBe(0);
  expect(result.stderr.toString()).toContain("Source path not found");
});

test("should handle complete convert workflow with metadata preservation", async () => {
  // Step 1: Clean environment and install cursor rules
  await $`rm -rf .cursor CLAUDE.md .windsurfrules custom-output.md`;
  await $`npm install`;
  await $`npm run vibe-rules install cursor`;

  // Verify cursor installation
  expect(await pathExists(".cursor/rules")).toBe(true);
  const originalCursorFiles = await readdir(".cursor/rules");
  expect(originalCursorFiles.filter((f) => f.endsWith(".mdc")).length).toBe(8);

  // Step 2: Convert cursor → claude-code
  await $`npm run vibe-rules convert cursor claude-code .cursor`;
  expect(await pathExists("CLAUDE.md")).toBe(true);

  const claudeContent = await readFile("CLAUDE.md", "utf-8");
  expect(claudeContent).toContain("<!-- vibe-rules Integration -->");
  expect(claudeContent).toContain("<!-- /vibe-rules Integration -->");

  // Verify all rules are present in claude format
  const claudeBlocks = [...claudeContent.matchAll(/<([^>]+)>([\s\S]*?)<\/\1>/g)];
  expect(claudeBlocks.length).toBe(8);

  // Step 3: Convert claude-code → cursor (roundtrip)
  await $`rm -rf .cursor`;
  await $`npm run vibe-rules convert claude-code cursor CLAUDE.md`;

  expect(await pathExists(".cursor/rules")).toBe(true);
  const roundtripCursorFiles = await readdir(".cursor/rules");
  expect(roundtripCursorFiles.filter((f) => f.endsWith(".mdc")).length).toBe(8);

  // Step 4: Verify metadata preservation in roundtrip
  const apiRuleContent = await readFile(".cursor/rules/cjs-package_api.mdc", "utf-8");
  expect(apiRuleContent).toContain("---"); // frontmatter
  expect(apiRuleContent).toContain("alwaysApply: false");
  expect(apiRuleContent).toContain("# API Rules");

  // Step 5: Test custom target conversion
  await $`npm run vibe-rules -- convert cursor claude-code .cursor/rules/cjs-package_api.mdc --target custom-output.md`;

  expect(await pathExists("custom-output.md")).toBe(true);
  const customContent = await readFile("custom-output.md", "utf-8");
  expect(customContent).toContain("<cjs-package_api>");
  expect(customContent).toContain("# API Rules");
  expect(customContent).toContain("<!-- vibe-rules Integration -->");

  console.log("✅ Complete convert workflow test passed!");

  // Cleanup
  await $`rm -rf .cursor CLAUDE.md .windsurfrules custom-output.md`;
});

test("should convert between different single-file formats correctly", async () => {
  // Setup windsurf rules first
  await $`rm -rf .windsurfrules .rules AGENT.md`;
  await $`npm install`;
  await $`npm run vibe-rules install windsurf`;

  expect(await pathExists(".windsurfrules")).toBe(true);
  const windsurfContent = await readFile(".windsurfrules", "utf-8");
  const windsurfBlocks = [...windsurfContent.matchAll(/<([^>]+)>([\s\S]*?)<\/\1>/g)];
  expect(windsurfBlocks.length).toBe(8);

  // Convert windsurf → zed (unified .rules format)
  await $`npm run vibe-rules convert windsurf unified .windsurfrules`;

  expect(await pathExists(".rules")).toBe(true);
  const rulesContent = await readFile(".rules", "utf-8");
  const rulesBlocks = [...rulesContent.matchAll(/<([^>]+)>([\s\S]*?)<\/\1>/g)];
  expect(rulesBlocks.length).toBe(8);

  // Convert unified → amp format
  await $`npm run vibe-rules convert unified amp .rules`;

  expect(await pathExists("AGENT.md")).toBe(true);
  const ampContent = await readFile("AGENT.md", "utf-8");
  const ampBlocks = [...ampContent.matchAll(/<([^>]+)>([\s\S]*?)<\/\1>/g)];
  expect(ampBlocks.length).toBe(8);

  // Verify a specific rule exists with metadata
  expect(ampContent).toContain("<cjs-package_api>");
  expect(ampContent).toContain("Always Apply: false");
  expect(ampContent).toContain("# API Rules");

  console.log("✅ Single-file format conversion test passed!");

  // Cleanup
  await $`rm -rf .windsurfrules .rules AGENT.md`;
});
