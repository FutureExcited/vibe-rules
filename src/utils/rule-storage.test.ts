import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { readFile, writeFile, rm, mkdir, readdir } from "fs/promises";
import * as fs from "fs-extra/esm";
import * as path from "path";

// Test data directory
const TEST_DATA_DIR = ".test-rule-storage";
const TEST_RULES_DIR = path.join(TEST_DATA_DIR, "rules");

// Import the functions dynamically to avoid CLI trigger
const { StoredRuleConfigSchema } = await import("../schemas.js");

describe("Rule Storage", () => {
  beforeEach(async () => {
    // Clean up and create test directories
    if (await fs.pathExists(TEST_DATA_DIR)) {
      await rm(TEST_DATA_DIR, { recursive: true });
    }
    await mkdir(TEST_DATA_DIR, { recursive: true });
    await mkdir(TEST_RULES_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test files
    if (await fs.pathExists(TEST_DATA_DIR)) {
      await rm(TEST_DATA_DIR, { recursive: true });
    }
  });

  describe("StoredRuleConfig schema validation", () => {
    test("should validate rule with metadata", () => {
      const testRule = {
        name: "test-rule",
        content: "Test content",
        description: "Test description",
        metadata: {
          alwaysApply: true,
          globs: ["src/**/*.ts"],
        },
      };

      const result = StoredRuleConfigSchema.safeParse(testRule);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.name).toBe("test-rule");
        expect(result.data.content).toBe("Test content");
        expect(result.data.metadata?.alwaysApply).toBe(true);
        expect(result.data.metadata?.globs).toEqual(["src/**/*.ts"]);
      }
    });

    test("should validate rule without metadata", () => {
      const testRule = {
        name: "simple-rule",
        content: "Simple content",
        description: "Simple description",
      };

      const result = StoredRuleConfigSchema.safeParse(testRule);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.name).toBe("simple-rule");
        expect(result.data.content).toBe("Simple content");
        expect(result.data.metadata).toBeUndefined();
      }
    });

    test("should reject invalid rule config", () => {
      const invalidRule = {
        name: "", // Empty name should fail
        content: "Some content",
      };

      const result = StoredRuleConfigSchema.safeParse(invalidRule);
      expect(result.success).toBe(false);
    });
  });

  describe("JSON storage format tests", () => {
    test("should save and load JSON rule with metadata", async () => {
      const testRule = {
        name: "test-api-rule",
        content: "# API Guidelines\nUse proper error handling",
        description: "Test rule for APIs",
        metadata: {
          description: "Test rule for APIs",
          alwaysApply: false,
          globs: ["src/api/**/*.ts"],
        },
      };

      // Save to JSON file
      const jsonPath = path.join(TEST_RULES_DIR, "test-api-rule.json");
      await writeFile(jsonPath, JSON.stringify(testRule, null, 2));

      // Verify file was created
      expect(await fs.pathExists(jsonPath)).toBe(true);

      // Load and verify content structure
      const savedContent = await readFile(jsonPath, "utf-8");
      const savedRule = JSON.parse(savedContent);

      expect(savedRule.name).toBe("test-api-rule");
      expect(savedRule.content).toBe("# API Guidelines\nUse proper error handling");
      expect(savedRule.description).toBe("Test rule for APIs");
      expect(savedRule.metadata.alwaysApply).toBe(false);
      expect(savedRule.metadata.globs).toEqual(["src/api/**/*.ts"]);
    });

    test("should save and load JSON rule without metadata", async () => {
      const testRule = {
        name: "plain-rule",
        content: "This is a plain rule without metadata",
        description: "A simple rule",
      };

      // Save to JSON file
      const jsonPath = path.join(TEST_RULES_DIR, "plain-rule.json");
      await writeFile(jsonPath, JSON.stringify(testRule, null, 2));

      // Load and verify
      const savedContent = await readFile(jsonPath, "utf-8");
      const savedRule = JSON.parse(savedContent);

      expect(savedRule.name).toBe("plain-rule");
      expect(savedRule.content).toBe("This is a plain rule without metadata");
      expect(savedRule.description).toBe("A simple rule");
      expect(savedRule.metadata).toBeUndefined();
    });

    test("should handle mixed JSON and .txt files", async () => {
      // Create JSON rule
      const jsonRule = {
        name: "json-rule",
        content: "JSON content",
      };
      const jsonPath = path.join(TEST_RULES_DIR, "json-rule.json");
      await writeFile(jsonPath, JSON.stringify(jsonRule, null, 2));

      // Create .txt rule
      const txtPath = path.join(TEST_RULES_DIR, "txt-rule.txt");
      await writeFile(txtPath, "TXT content");

      // List files manually (simulating listCommonRules behavior)
      const files = await readdir(TEST_RULES_DIR);
      const ruleNames = new Set<string>();

      for (const file of files) {
        if (file.endsWith(".json")) {
          ruleNames.add(file.replace(".json", ""));
        } else if (file.endsWith(".txt")) {
          ruleNames.add(file.replace(".txt", ""));
        }
      }

      const rules = Array.from(ruleNames);
      expect(rules).toContain("json-rule");
      expect(rules).toContain("txt-rule");
      expect(rules.length).toBe(2);
    });

    test("should deduplicate when both .json and .txt exist", async () => {
      // Create both formats for same rule name
      const jsonRule = {
        name: "dual-rule",
        content: "JSON content",
      };
      const jsonPath = path.join(TEST_RULES_DIR, "dual-rule.json");
      await writeFile(jsonPath, JSON.stringify(jsonRule, null, 2));

      const txtPath = path.join(TEST_RULES_DIR, "dual-rule.txt");
      await writeFile(txtPath, "TXT content");

      // List and deduplicate (simulating listCommonRules behavior)
      const files = await readdir(TEST_RULES_DIR);
      const ruleNames = new Set<string>();

      for (const file of files) {
        if (file.endsWith(".json")) {
          ruleNames.add(file.replace(".json", ""));
        } else if (file.endsWith(".txt")) {
          ruleNames.add(file.replace(".txt", ""));
        }
      }

      const rules = Array.from(ruleNames);
      expect(rules).toContain("dual-rule");
      expect(rules.length).toBe(1); // Should only appear once
    });
  });
});
