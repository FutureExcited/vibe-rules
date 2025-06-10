import { test, expect, describe } from "bun:test";
import { parseFrontmatter } from "./frontmatter.js";

describe("Frontmatter Parser", () => {
  test("should parse Cursor .mdc frontmatter correctly", () => {
    const mdcContent = `---
description: Test API rule
globs: ["src/api/**/*.ts", "src/routes/**/*.tsx"]
alwaysApply: false
---

# API Development Guidelines

- Use proper error handling
- Follow RESTful conventions`;

    const { frontmatter, content } = parseFrontmatter(mdcContent);

    expect(frontmatter.description).toBe("Test API rule");
    expect(frontmatter.globs).toEqual(["src/api/**/*.ts", "src/routes/**/*.tsx"]);
    expect(frontmatter.alwaysApply).toBe(false);
    expect(content.trim()).toBe(`# API Development Guidelines

- Use proper error handling
- Follow RESTful conventions`);
  });

  test("should parse alwaysApply: true correctly", () => {
    const mdcContent = `---
description: Always applied rule
alwaysApply: true
---

This rule is always active.`;

    const { frontmatter } = parseFrontmatter(mdcContent);
    expect(frontmatter.alwaysApply).toBe(true);
  });

  test("should parse single glob string", () => {
    const mdcContent = `---
globs: "src/**/*.ts"
---

Content here.`;

    const { frontmatter } = parseFrontmatter(mdcContent);
    expect(frontmatter.globs).toBe("src/**/*.ts");
  });

  test("should handle content without frontmatter", () => {
    const plainContent = "Just plain content without frontmatter";
    const { frontmatter, content } = parseFrontmatter(plainContent);

    expect(Object.keys(frontmatter)).toHaveLength(0);
    expect(content).toBe(plainContent);
  });

  test("should skip empty/null values", () => {
    const mdcContent = `---
description: Valid description
globs: 
alwaysApply: false
emptyField: 
---

Content`;

    const { frontmatter } = parseFrontmatter(mdcContent);
    expect(frontmatter.description).toBe("Valid description");
    expect(frontmatter.alwaysApply).toBe(false);
    expect(frontmatter.globs).toBeUndefined();
    expect(frontmatter.emptyField).toBeUndefined();
  });

  test("should handle complex globs array", () => {
    const mdcContent = `---
globs: ["src/api/**/*.ts", "src/routes/**/*.tsx", "src/components/**/*.vue"]
---

Multi-file rule content`;

    const { frontmatter } = parseFrontmatter(mdcContent);
    expect(frontmatter.globs).toEqual([
      "src/api/**/*.ts",
      "src/routes/**/*.tsx",
      "src/components/**/*.vue",
    ]);
  });

  test("should handle malformed frontmatter gracefully", () => {
    const malformedContent = `---
invalid: yaml: content[
not-closed: "quote
---

Content should still be parsed`;

    const { frontmatter, content } = parseFrontmatter(malformedContent);

    // Should not crash and should extract content
    expect(content).toContain("Content should still be parsed");
    expect(typeof frontmatter).toBe("object");
  });
});
