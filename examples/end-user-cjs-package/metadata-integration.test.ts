import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { $ } from "bun";
import { readFile, writeFile, rm, mkdir } from "fs/promises";
import * as fs from "fs-extra/esm";
import * as path from "path";

// Test data directory
const TEST_DATA_DIR = ".test-metadata";

describe("CLI Metadata Integration", () => {
  beforeEach(async () => {
    // Clean up test artifacts - SELECTIVE cleanup only
    await $`rm -f .windsurfrules CLAUDE.md AGENTS.md .rules ${TEST_DATA_DIR}`.quiet();
    // Selective .cursor cleanup - only remove test files
    await $`find .cursor/rules -name "test-api-rule.mdc" -delete 2>/dev/null || true`.quiet();
    await $`find .cursor/rules -name "dev-rule.mdc" -delete 2>/dev/null || true`.quiet();
    await $`find .cursor/rules -name "legacy-rule.mdc" -delete 2>/dev/null || true`.quiet();
    await $`find .cursor/rules -name "complex-api-rule.mdc" -delete 2>/dev/null || true`.quiet();
    // Selective .github cleanup - only remove test instructions
    await $`find .github/instructions -name "dev-rule.instructions.md" -delete 2>/dev/null || true`.quiet();

    // Create test directory
    if (await fs.pathExists(TEST_DATA_DIR)) {
      await rm(TEST_DATA_DIR, { recursive: true });
    }
    await mkdir(TEST_DATA_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test artifacts - SELECTIVE cleanup only
    await $`rm -f .windsurfrules CLAUDE.md AGENTS.md .rules`.quiet();
    await $`rm -rf ${TEST_DATA_DIR}`.quiet();
    // Selective .cursor cleanup - only remove test files
    await $`find .cursor/rules -name "test-api-rule.mdc" -delete 2>/dev/null || true`.quiet();
    await $`find .cursor/rules -name "dev-rule.mdc" -delete 2>/dev/null || true`.quiet();
    await $`find .cursor/rules -name "legacy-rule.mdc" -delete 2>/dev/null || true`.quiet();
    await $`find .cursor/rules -name "complex-api-rule.mdc" -delete 2>/dev/null || true`.quiet();
    // Selective .github cleanup - only remove test instructions
    await $`find .github/instructions -name "dev-rule.instructions.md" -delete 2>/dev/null || true`.quiet();
  });

  describe("save command with .mdc file metadata extraction", () => {
    test("should extract and save metadata from .mdc file", async () => {
      const mdcContent = `---
description: Test rule for API development
alwaysApply: false
globs: ["src/api/**/*.ts", "src/routes/**/*.tsx"]
---

# API Development Guidelines

- Use proper error handling
- Follow RESTful conventions
- Validate input parameters`;

      const mdcPath = path.join(TEST_DATA_DIR, "test-api-rule.mdc");
      await writeFile(mdcPath, mdcContent);

      // Save the rule with metadata extraction
      await $`bun run vibe-rules save test-api-rule -f ${mdcPath}`;

      // Test loading with metadata application
      const loadOutput = await $`bun run vibe-rules load test-api-rule cursor`.text();
      expect(loadOutput).toContain("Applied metadata");
      expect(loadOutput).toContain("Always Apply: false");
      expect(loadOutput).toContain("Globs:");
    });

    test("should save rule without metadata from plain content", async () => {
      const plainContent = `# Simple Rule

This is a rule without any metadata.`;

      const txtPath = path.join(TEST_DATA_DIR, "simple-rule.txt");
      await writeFile(txtPath, plainContent);

      // Save the rule without metadata
      await $`bun run vibe-rules save simple-rule -f ${txtPath}`;

      // Should not show metadata when loading
      const loadOutput = await $`bun run vibe-rules load simple-rule windsurf`.text();
      expect(loadOutput).not.toContain("Applied metadata");
    });
  });

  describe("load command with metadata application", () => {
    beforeEach(async () => {
      // Create a test rule with metadata first
      const mdcContent = `---
description: Test rule for development
alwaysApply: true
globs: ["src/**/*.ts", "tests/**/*.spec.ts"]
---

# Development Guidelines

Always follow coding standards.`;

      const mdcPath = path.join(TEST_DATA_DIR, "dev-rule.mdc");
      await writeFile(mdcPath, mdcContent);
      await $`bun run vibe-rules save dev-rule -f ${mdcPath}`;
    });

    test("should apply metadata to Cursor .mdc format", async () => {
      await $`bun run vibe-rules load dev-rule cursor`;

      // Check that .cursor/rules directory exists and file was created
      const cursorPath = path.join(process.cwd(), ".cursor", "rules", "dev-rule.mdc");
      expect(await fs.pathExists(cursorPath)).toBe(true);

      const content = await readFile(cursorPath, "utf-8");
      expect(content).toContain("---");
      expect(content).toContain("description: Test rule for development");
      expect(content).toContain("alwaysApply: true");
      expect(content).toContain("globs:");
      expect(content).toContain("src/**/*.ts,tests/**/*.spec.ts");
      expect(content).toContain("tests/**/*.spec.ts");
      expect(content).toContain("---");
      expect(content).toContain("# Development Guidelines");
      expect(content).toContain("Always follow coding standards.");
    });

    test("should apply metadata to Windsurf format", async () => {
      await $`bun run vibe-rules load dev-rule windsurf`;

      // Check that .windsurfrules file was created
      const windsurfPath = path.join(process.cwd(), ".windsurfrules");
      expect(await fs.pathExists(windsurfPath)).toBe(true);

      const content = await readFile(windsurfPath, "utf-8");
      expect(content).toContain("<dev-rule>");
      expect(content).toContain("Always Apply: true");
      expect(content).toContain("Always apply this rule in these files:");
      expect(content).toContain("src/**/*.ts");
      expect(content).toContain("tests/**/*.spec.ts");
      expect(content).toContain("# Development Guidelines");
      expect(content).toContain("</dev-rule>");
    });

    test("should apply metadata to VSCode format with universal glob", async () => {
      await $`bun run vibe-rules load dev-rule vscode`;

      // Check that .github/instructions directory and file were created
      const vscodeDir = path.join(process.cwd(), ".github", "instructions");
      expect(await fs.pathExists(vscodeDir)).toBe(true);

      const vscodePath = path.join(vscodeDir, "dev-rule.instructions.md");
      expect(await fs.pathExists(vscodePath)).toBe(true);

      const content = await readFile(vscodePath, "utf-8");
      expect(content).toContain("---");
      expect(content).toContain('applyTo: "**"'); // VSCode limitation workaround
      expect(content).toContain("---");
      expect(content).toContain("# dev-rule");
      expect(content).toContain("## Test rule for development");
      expect(content).toContain("# Development Guidelines");
    });
  });

  describe("backward compatibility with legacy .txt rules", () => {
    test("should load and apply legacy .txt rules without metadata", async () => {
      // Directly create a legacy .txt rule (simulating old format)
      const legacyContent = "This is a legacy rule saved as plain text.";

      // Save using content parameter (no file)
      await $`bun run vibe-rules save legacy-rule -c "${legacyContent}" -d "Legacy rule"`;

      // Should still be able to load and apply it
      await $`bun run vibe-rules load legacy-rule cursor`;

      const cursorPath = path.join(process.cwd(), ".cursor", "rules", "legacy-rule.mdc");
      expect(await fs.pathExists(cursorPath)).toBe(true);

      const content = await readFile(cursorPath, "utf-8");
      // Should have basic frontmatter without alwaysApply/globs
      expect(content).toContain("description: Legacy rule");
      expect(content).not.toContain("alwaysApply:");
      expect(content).not.toContain("globs:");
      expect(content).toContain("This is a legacy rule saved as plain text.");
    });
  });

  describe("end-to-end metadata preservation", () => {
    test("should preserve metadata through save/load cycle", async () => {
      // Step 1: Create .mdc file with complex metadata
      const complexMdcContent = `---
description: Complex API rule with multiple patterns
alwaysApply: false
globs: ["src/api/**/*.ts", "src/routes/**/*.tsx", "src/middleware/**/*.js"]
---

# Complex API Rule

## Error Handling
- Always use try-catch blocks
- Return consistent error formats

## Authentication
- Validate JWT tokens
- Check user permissions

## Database Operations
- Use transactions for multi-step operations
- Implement proper connection pooling`;

      const complexMdcPath = path.join(TEST_DATA_DIR, "complex-api-rule.mdc");
      await writeFile(complexMdcPath, complexMdcContent);

      // Step 2: Save with metadata extraction
      await $`bun run vibe-rules save complex-api-rule -f ${complexMdcPath}`;

      // Step 3: Apply to multiple editors and verify metadata is preserved correctly

      // Cursor
      await $`bun run vibe-rules load complex-api-rule cursor`;
      const cursorPath = path.join(process.cwd(), ".cursor", "rules", "complex-api-rule.mdc");
      const cursorContent = await readFile(cursorPath, "utf-8");

      expect(cursorContent).toContain("description: Complex API rule with multiple patterns");
      expect(cursorContent).toContain("alwaysApply: false");
      expect(cursorContent).toContain("src/api/**/*.ts,src/routes/**/*.tsx,src/middleware/**/*.js");
      expect(cursorContent).toContain("src/routes/**/*.tsx");
      expect(cursorContent).toContain("src/middleware/**/*.js");
      expect(cursorContent).toContain("## Error Handling");
      expect(cursorContent).toContain("## Authentication");
      expect(cursorContent).toContain("## Database Operations");

      // Windsurf
      await $`bun run vibe-rules load complex-api-rule windsurf`;
      const windsurfPath = path.join(process.cwd(), ".windsurfrules");
      const windsurfContent = await readFile(windsurfPath, "utf-8");

      expect(windsurfContent).toContain("Always Apply: false");
      expect(windsurfContent).toContain("Always apply this rule in these files:");
      expect(windsurfContent).toContain("src/api/**/*.ts");
      expect(windsurfContent).toContain("src/routes/**/*.tsx");
      expect(windsurfContent).toContain("src/middleware/**/*.js");
      expect(windsurfContent).toContain("## Error Handling");

      // Clean up test files between providers
      await $`rm -f .windsurfrules`.quiet();
      await $`find .cursor/rules -name "complex-api-rule.mdc" -delete 2>/dev/null || true`.quiet();
    });
  });
});
