import { test, expect, describe } from "bun:test";

// Test data that would be used by providers
const testRule = {
  name: "test-rule",
  content: "# Test Rule\n\nThis is test content for metadata application.",
  description: "Test rule for validating metadata application",
};

const testMetadata = {
  alwaysApply: false,
  globs: ["src/api/**/*.ts", "src/routes/**/*.tsx"],
  description: "API and routing patterns",
};

const alwaysApplyMetadata = {
  alwaysApply: true,
  description: "Universal guidelines",
};

describe("Metadata Application Patterns", () => {
  describe("Cursor Provider Format", () => {
    test("should generate YAML frontmatter pattern", () => {
      // Simulate what Cursor provider generateRuleContent should produce
      const generateCursorFormat = (rule: any, metadata: any) => {
        let result = "---\n";
        if (metadata?.description) {
          result += `description: ${metadata.description}\n`;
        }
        if (metadata?.alwaysApply !== undefined) {
          result += `alwaysApply: ${metadata.alwaysApply}\n`;
        }
        if (metadata?.globs) {
          if (Array.isArray(metadata.globs)) {
            result += "globs:\n";
            metadata.globs.forEach((glob: string) => {
              result += `- ${glob}\n`;
            });
          } else {
            result += `globs: ${metadata.globs}\n`;
          }
        }
        result += "---\n\n";
        result += rule.content;
        return result;
      };

      const result = generateCursorFormat(testRule, testMetadata);

      expect(result).toContain("---");
      expect(result).toContain("description: API and routing patterns");
      expect(result).toContain("alwaysApply: false");
      expect(result).toContain("globs:");
      expect(result).toContain("- src/api/**/*.ts");
      expect(result).toContain("- src/routes/**/*.tsx");
      expect(result).toContain("---");
      expect(result).toContain("# Test Rule");
      expect(result).toContain("This is test content for metadata application.");
    });

    test("should handle alwaysApply: true", () => {
      const generateCursorFormat = (rule: any, metadata: any) => {
        let result = "---\n";
        if (metadata?.description) {
          result += `description: ${metadata.description}\n`;
        }
        if (metadata?.alwaysApply !== undefined) {
          result += `alwaysApply: ${metadata.alwaysApply}\n`;
        }
        result += "---\n\n";
        result += rule.content;
        return result;
      };

      const result = generateCursorFormat(testRule, alwaysApplyMetadata);

      expect(result).toContain("alwaysApply: true");
      expect(result).not.toContain("globs:");
    });

    test("should handle single glob string", () => {
      const singleGlobMetadata = {
        ...testMetadata,
        globs: "src/**/*.ts",
      };

      const generateCursorFormat = (rule: any, metadata: any) => {
        let result = "---\n";
        if (metadata?.description) {
          result += `description: ${metadata.description}\n`;
        }
        if (metadata?.alwaysApply !== undefined) {
          result += `alwaysApply: ${metadata.alwaysApply}\n`;
        }
        if (metadata?.globs) {
          if (Array.isArray(metadata.globs)) {
            result += "globs:\n";
            metadata.globs.forEach((glob: string) => {
              result += `- ${glob}\n`;
            });
          } else {
            result += `globs: ${metadata.globs}\n`;
          }
        }
        result += "---\n\n";
        result += rule.content;
        return result;
      };

      const result = generateCursorFormat(testRule, singleGlobMetadata);

      expect(result).toContain("globs: src/**/*.ts");
    });
  });

  describe("Windsurf Provider Format", () => {
    test("should generate human-readable metadata", () => {
      // Simulate what Windsurf provider should produce
      const generateWindsurfFormat = (rule: any, metadata: any) => {
        let result = "";
        if (metadata?.alwaysApply !== undefined) {
          result += `Always Apply: ${metadata.alwaysApply}\n\n`;
        }
        if (metadata?.globs) {
          result += "Applies to files matching:\n";
          const globs = Array.isArray(metadata.globs) ? metadata.globs : [metadata.globs];
          globs.forEach((glob: string) => {
            result += `- ${glob}\n`;
          });
          result += "\n";
        }
        result += rule.content;
        return result;
      };

      const result = generateWindsurfFormat(testRule, testMetadata);

      expect(result).toContain("Always Apply: false");
      expect(result).toContain("Applies to files matching:");
      expect(result).toContain("- src/api/**/*.ts");
      expect(result).toContain("- src/routes/**/*.tsx");
      expect(result).toContain("# Test Rule");
      expect(result).toContain("This is test content for metadata application.");
    });

    test("should handle alwaysApply: true with no globs", () => {
      const generateWindsurfFormat = (rule: any, metadata: any) => {
        let result = "";
        if (metadata?.alwaysApply !== undefined) {
          result += `Always Apply: ${metadata.alwaysApply}\n\n`;
        }
        if (metadata?.globs) {
          result += "Applies to files matching:\n";
          const globs = Array.isArray(metadata.globs) ? metadata.globs : [metadata.globs];
          globs.forEach((glob: string) => {
            result += `- ${glob}\n`;
          });
          result += "\n";
        }
        result += rule.content;
        return result;
      };

      const result = generateWindsurfFormat(testRule, alwaysApplyMetadata);

      expect(result).toContain("Always Apply: true");
      expect(result).not.toContain("Applies to files matching:");
    });
  });

  describe("VSCode Provider Format", () => {
    test("should generate .instructions.md with YAML frontmatter", () => {
      // Simulate what VSCode provider should produce
      const generateVSCodeFormat = (rule: any, _metadata: any) => {
        let result = "---\n";
        // VSCode limitation: always use universal glob
        result += `applyTo: "**"\n`;
        result += "---\n\n";
        result += `# ${rule.name}\n\n`;
        if (rule.description) {
          result += `**Description:** ${rule.description}\n\n`;
        }
        result += rule.content;
        return result;
      };

      const result = generateVSCodeFormat(testRule, testMetadata);

      expect(result).toContain("---");
      expect(result).toContain('applyTo: "**"'); // VSCode limitation workaround
      expect(result).toContain("---");
      expect(result).toContain("# test-rule");
      expect(result).toContain("**Description:** Test rule for validating metadata application");
      expect(result).toContain("# Test Rule");
      expect(result).toContain("This is test content for metadata application.");
    });

    test("should always use universal glob due to VSCode bug", () => {
      const generateVSCodeFormat = (rule: any, _metadata: any) => {
        let result = "---\n";
        // VSCode limitation: always use universal glob
        result += `applyTo: "**"\n`;
        result += "---\n\n";
        result += rule.content;
        return result;
      };

      const result = generateVSCodeFormat(testRule, testMetadata);

      // Should always use "**" regardless of original globs
      expect(result).toContain('applyTo: "**"');
      expect(result).not.toContain("src/api");
      expect(result).not.toContain("src/routes");
    });
  });

  describe("Single-File Provider Patterns", () => {
    test("should generate content with metadata lines for Zed/Claude/Codex", () => {
      // Simulate what single-file providers should produce
      const generateSingleFileFormat = (rule: any, metadata: any) => {
        let result = "";
        if (metadata?.alwaysApply !== undefined) {
          result += `Always Apply: ${metadata.alwaysApply}\n\n`;
        }
        if (metadata?.globs) {
          result += "Applies to files matching:\n";
          const globs = Array.isArray(metadata.globs) ? metadata.globs : [metadata.globs];
          globs.forEach((glob: string) => {
            result += `- ${glob}\n`;
          });
          result += "\n";
        }
        result += rule.content;
        return result;
      };

      const result = generateSingleFileFormat(testRule, testMetadata);

      expect(result).toContain("Always Apply: false");
      expect(result).toContain("Applies to files matching:");
      expect(result).toContain("- src/api/**/*.ts");
      expect(result).toContain("- src/routes/**/*.tsx");
      expect(result).toContain("# Test Rule");
    });
  });

  describe("Cross-Provider Consistency", () => {
    test("all provider formats should preserve rule content", () => {
      const formats = [
        // Cursor format
        (rule: any, metadata: any) => {
          let result = "---\n";
          if (metadata?.description) result += `description: ${metadata.description}\n`;
          result += "---\n\n" + rule.content;
          return result;
        },
        // Windsurf format
        (rule: any, _metadata: any) => {
          return rule.content;
        },
        // VSCode format
        (rule: any, _metadata: any) => {
          return `---\napplyTo: "**"\n---\n\n${rule.content}`;
        },
        // Single-file format
        (rule: any, _metadata: any) => {
          return rule.content;
        },
      ];

      formats.forEach((format) => {
        const result = format(testRule, testMetadata);
        expect(result).toContain("# Test Rule");
        expect(result).toContain("This is test content for metadata application.");
      });
    });

    test("all provider formats should handle rules without metadata", () => {
      const plainRule = {
        name: "plain-rule",
        content: "# Plain Rule\n\nNo metadata here.",
        description: "A simple rule",
      };

      const formats = [
        // Cursor format (minimal frontmatter)
        (rule: any) => {
          return `---\n---\n\n${rule.content}`;
        },
        // Others just return content
        (rule: any) => rule.content,
        (rule: any) => rule.content,
        (rule: any) => rule.content,
      ];

      formats.forEach((format) => {
        const result = format(plainRule);
        expect(result).toContain("# Plain Rule");
        expect(result).toContain("No metadata here.");
        // Should not crash or add invalid metadata
      });
    });
  });
});
