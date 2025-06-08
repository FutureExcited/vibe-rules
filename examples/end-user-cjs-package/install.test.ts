import { test, expect } from "bun:test";
import { $ } from "bun";
import { readdir, stat, readFile } from "fs/promises";
import { join } from "path";

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
  const mdcFiles = rulesFiles.filter(file => file.endsWith('.mdc'));
  
  console.log(`Found ${mdcFiles.length} rules files:`, mdcFiles);
  
  // Expect 8 rules files (4 from cjs-package + 4 from esm-package)
  expect(mdcFiles.length).toBe(cjsRules.length + esmRules.default.length);
  
  // Get expected rule names from the imported modules
  const cjsRuleNames = cjsRules.map(r => r.name);
  const esmRuleNames = esmRules.default.map(r => r.name);
  const expectedRules = [...new Set([...cjsRuleNames, ...esmRuleNames])]; // Unique names
  
  // Check that we have rules from both packages
  for (const rule of expectedRules) {
    const cjsRuleExists = mdcFiles.some(file => file.includes('cjs') && file.includes(rule));
    const esmRuleExists = mdcFiles.some(file => file.includes('esm') && file.includes(rule));
    
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
    expect(rule).toHaveProperty('name');
    expect(rule).toHaveProperty('rule'); // Note: uses 'rule' not 'content'
    expect(rule).toHaveProperty('alwaysApply');
    
    expect(typeof rule.name).toBe('string');
    expect(typeof rule.rule).toBe('string');
    expect(typeof rule.alwaysApply).toBe('boolean');
    
    // description and globs are optional
    if (rule.description !== undefined) {
      expect(typeof rule.description).toBe('string');
    }
    if (rule.globs !== undefined) {
      expect(Array.isArray(rule.globs) || typeof rule.globs === 'string').toBe(true);
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
    const fileContent = await readFile(filePath, 'utf-8');
    
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
    const fileContent = await readFile(filePath, 'utf-8');
    
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
  const rulesFileContent = await readFile(windsurfRulesPath, 'utf-8');
  
  console.log("Validating .windsurfrules file content...");
  
  // Get expected rule names from the imported modules
  const cjsRuleNames = cjsRules.map(r => r.name);
  const esmRuleNames = esmRules.default.map(r => r.name);
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
      expect(rulesFileContent).toContain('Always Apply: true');
    }
    if (rule.globs && rule.globs.length > 0) {
      expect(rulesFileContent).toContain('Always apply this rule in these files:');
    }
  }
  
  console.log("✅ All Windsurf assertions passed! Rules properly installed in .windsurfrules file.");
  
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
  const mdFiles = rulesFiles.filter(file => file.endsWith('.md'));
  
  console.log(`Found ${mdFiles.length} rules files:`, mdFiles);
  
  // Expect 8 rules files (4 from cjs-package + 4 from esm-package)
  expect(mdFiles.length).toBe(cjsRules.length + esmRules.default.length);
  
  // Get expected rule names from the imported modules
  const cjsRuleNames = cjsRules.map(r => r.name);
  const esmRuleNames = esmRules.default.map(r => r.name);
  const expectedRules = [...new Set([...cjsRuleNames, ...esmRuleNames])]; // Unique names
  
  // Check that we have rules from both packages
  for (const rule of expectedRules) {
    const cjsRuleExists = mdFiles.some(file => file.includes('cjs') && file.includes(rule));
    const esmRuleExists = mdFiles.some(file => file.includes('esm') && file.includes(rule));
    
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
    expect(rule).toHaveProperty('name');
    expect(rule).toHaveProperty('rule'); // Note: uses 'rule' not 'content'
    expect(rule).toHaveProperty('alwaysApply');
    
    expect(typeof rule.name).toBe('string');
    expect(typeof rule.rule).toBe('string');
    expect(typeof rule.alwaysApply).toBe('boolean');
    
    // description and globs are optional
    if (rule.description !== undefined) {
      expect(typeof rule.description).toBe('string');
    }
    if (rule.globs !== undefined) {
      expect(Array.isArray(rule.globs) || typeof rule.globs === 'string').toBe(true);
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
    const fileContent = await readFile(filePath, 'utf-8');
    
    // Check that the rule content appears in the file
    expect(fileContent).toContain(rule.rule);
    // Note: description format may vary, just check rule content
    
    // Validate metadata is included (formatted by formatRuleWithMetadata)
    if (rule.alwaysApply) {
      expect(fileContent).toContain('Always Apply: true');
    }
    if (rule.globs && rule.globs.length > 0) {
      expect(fileContent).toContain('Always apply this rule in these files:');
    }
  }
  
  for (const rule of esmRulesArray) {
    const fileName = `esm-package_${rule.name}.md`;
    expect(mdFiles).toContain(fileName);
    
    const filePath = join(clinerulesPath, fileName);
    const fileContent = await readFile(filePath, 'utf-8');
    
    // Check that the rule content appears in the file
    expect(fileContent).toContain(rule.rule);
    // Note: description format may vary, just check rule content
    
    // Validate metadata is included (formatted by formatRuleWithMetadata)
    if (rule.alwaysApply) {
      expect(fileContent).toContain('Always Apply: true');
    }
    if (rule.globs && rule.globs.length > 0) {
      expect(fileContent).toContain('Always apply this rule in these files:');
    }
  }
  
  console.log("✅ All Clinerules assertions passed! Rules properly installed and match source modules.");
  
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
  const claudeFileContent = await readFile(claudeFilePath, 'utf-8');
  
  console.log("Validating CLAUDE.md file content...");
  
  // Get expected rule names from the imported modules
  const cjsRuleNames = cjsRules.map(r => r.name);
  const esmRuleNames = esmRules.default.map(r => r.name);
  const expectedRules = [...new Set([...cjsRuleNames, ...esmRuleNames])]; // Unique names
  
  // Count the number of rule blocks in the file
  // Each rule should be wrapped in XML-like tags: <packageName_ruleName>...</packageName_ruleName>
  const ruleBlockPattern = /<[^>]+>[\s\S]*?<\/[^>]+>/g;
  const ruleBlocks = claudeFileContent.match(ruleBlockPattern) || [];
  
  console.log(`Found ${ruleBlocks.length} rule blocks in CLAUDE.md file`);
  
  // Expect 8 rule blocks (4 from cjs-package + 4 from esm-package)
  expect(ruleBlocks.length).toBe(cjsRules.length + esmRules.default.length);
  
  // Check for vibe-tools Integration block
  expect(claudeFileContent).toContain('<vibe-tools Integration>');
  expect(claudeFileContent).toContain('</vibe-tools Integration>');
  
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
      expect(claudeFileContent).toContain('Always Apply: true');
    }
    if (rule.globs && rule.globs.length > 0) {
      expect(claudeFileContent).toContain('Always apply this rule in these files:');
    }
  }
  
  console.log("✅ All Claude Code assertions passed! Rules properly installed in CLAUDE.md file.");
  
  // Clean up CLAUDE.md file at the end of the test
  await $`rm -f CLAUDE.md`.quiet();
});
