#!/usr/bin/env bun

import { $ } from "bun";
import { readdir, stat, readFile } from "fs/promises";
import { join } from "path";

interface ExampleProject {
  name: string;
  path: string;
  testScript: string;
  packageJson: any;
}

interface TestResult {
  project: ExampleProject;
  success: boolean;
  output: string;
  error?: string;
  duration: number;
}

async function discoverTestableProjects(): Promise<ExampleProject[]> {
  const examplesDir = join(process.cwd(), "examples");

  try {
    const entries = await readdir(examplesDir);
    const projects: ExampleProject[] = [];

    for (const entry of entries) {
      const entryPath = join(examplesDir, entry);
      const entryStat = await stat(entryPath);

      // Skip files, only process directories
      if (!entryStat.isDirectory()) {
        continue;
      }

      // Check if directory has package.json
      const packageJsonPath = join(entryPath, "package.json");
      try {
        await stat(packageJsonPath);
        const packageJsonContent = await readFile(packageJsonPath, "utf-8");
        const packageJson = JSON.parse(packageJsonContent);

        // Check if project has a test script
        const testScript = packageJson.scripts?.test;
        if (testScript && testScript !== 'echo "Error: no test specified" && exit 1') {
          projects.push({
            name: entry,
            path: entryPath,
            testScript,
            packageJson,
          });

          console.log(`🧪 Found testable project: ${entry} (${testScript})`);
        } else {
          console.log(`⏭️  Skipping ${entry} (no test script or placeholder)`);
        }
      } catch {
        // Skip directories without package.json
        console.log(`⚠️  Skipping ${entry} (no package.json)`);
      }
    }

    return projects;
  } catch (error) {
    console.error("❌ Failed to read examples directory:", error);
    process.exit(1);
  }
}

async function runProjectTests(project: ExampleProject): Promise<TestResult> {
  const startTime = Date.now();
  console.log(`🧪 Running tests for ${project.name}...`);

  try {
    // Run the test command and capture output
    const result = await $`cd ${project.path} && npm test`.quiet();
    const duration = Date.now() - startTime;

    console.log(`✅ Tests passed for ${project.name} (${duration}ms)`);

    return {
      project,
      success: true,
      output: result.stdout.toString(),
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.log(`❌ Tests failed for ${project.name} (${duration}ms)`);

    return {
      project,
      success: false,
      output: error.stdout?.toString() || "",
      error: error.stderr?.toString() || error.message || "Unknown error",
      duration,
    };
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function printTestResults(results: TestResult[]): void {
  const passed = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log("\n" + "=".repeat(80));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(80));

  if (passed.length > 0) {
    console.log(`\n✅ PASSED (${passed.length}/${results.length}):`);
    for (const result of passed) {
      console.log(`   ${result.project.name} - ${formatDuration(result.duration)}`);
    }
  }

  if (failed.length > 0) {
    console.log(`\n❌ FAILED (${failed.length}/${results.length}):`);
    for (const result of failed) {
      console.log(`   ${result.project.name} - ${formatDuration(result.duration)}`);
    }
  }

  console.log(`\n⏱️  Total test time: ${formatDuration(totalDuration)}`);
  console.log(`📈 Success rate: ${Math.round((passed.length / results.length) * 100)}%`);

  // Show detailed output for failed tests
  if (failed.length > 0) {
    console.log("\n" + "=".repeat(80));
    console.log("🔍 DETAILED FAILURE OUTPUT");
    console.log("=".repeat(80));

    for (const result of failed) {
      console.log(`\n📦 ${result.project.name}:`);
      console.log("-".repeat(40));

      if (result.output) {
        console.log("📄 Test Output:");
        console.log(result.output);
      }

      if (result.error) {
        console.log("🚨 Error Details:");
        console.log(result.error);
      }
    }
  }

  // Show detailed output for passed tests (less verbose)
  if (passed.length > 0) {
    console.log("\n" + "=".repeat(80));
    console.log("✅ PASSED TESTS OUTPUT");
    console.log("=".repeat(80));

    for (const result of passed) {
      console.log(`\n📦 ${result.project.name}:`);
      console.log("-".repeat(40));

      // Show last few lines of output for context
      const lines = result.output.trim().split("\n");
      const lastLines = lines.slice(-10); // Show last 10 lines
      if (lines.length > 10) {
        console.log("... (showing last 10 lines)");
      }
      console.log(lastLines.join("\n"));
    }
  }
}

async function testRuleChangeDetector(): Promise<void> {
  console.log("🧪 Testing rule-change-detector...");

  try {
    const { areAllRulesUnchanged } = await import("../src/utils/rule-change-detector.js");
    const { getRulePath, slugifyRuleName } = await import("../src/utils/path.js");
    const { writeFile, mkdir, rm } = await import("fs/promises");
    const { join } = await import("path");
    const { tmpdir } = await import("os");

    // Create a temporary test directory
    const testDir = join(tmpdir(), `vibe-rules-test-${Date.now()}`);
    const rulesDir = join(testDir, ".cursor", "rules");
    await mkdir(rulesDir, { recursive: true });

    // Mock process.cwd to point to our test directory
    const originalCwd = process.cwd;
    process.cwd = () => testDir;

    const mockProvider = {
      generateRuleContent: (config: any, options: any) => {
        return `# ${config.name}\n\n${config.content}\n\n<!-- Generated rule -->`;
      },
    };

    try {
      // Test 1: No existing file - should detect change
      console.log("🔍 Test 1: New rule (no existing file)");
      let result = await areAllRulesUnchanged(
        "This is a test rule content",
        "test-pkg",
        "cursor",
        mockProvider as any,
        { global: false, debug: false }
      );
      if (result !== false) throw new Error("Should detect change when file doesn't exist");
      console.log("✅ Correctly detected new rule as changed");

      // Test 2: Create existing file with same content - should be unchanged
      console.log("🔍 Test 2: Existing rule with same content");
      // The rule-change-detector creates rule names like pkgName_slugifiedName for strings
      let ruleName = slugifyRuleName("test-pkg");
      if (!ruleName.startsWith("test-pkg_")) {
        ruleName = `test-pkg_${ruleName}`;
      }
      const actualRulePath = getRulePath("cursor", ruleName, false, testDir);
      console.log(`📍 Expected rule path: ${actualRulePath}`);
      console.log(`📍 Rule name: ${ruleName}`);

      const expectedContent = mockProvider.generateRuleContent(
        {
          name: ruleName,
          content: "This is a test rule content",
          description: "Rule from test-pkg",
        },
        { description: "Rule from test-pkg", isGlobal: false, debug: false }
      );
      console.log(`📄 Writing content: ${expectedContent}`);
      await writeFile(actualRulePath, expectedContent);

      result = await areAllRulesUnchanged(
        "This is a test rule content",
        "test-pkg",
        "cursor",
        mockProvider as any,
        { global: false, debug: true } // Enable debug
      );
      console.log(`🔍 areAllRulesUnchanged returned: ${result}`);
      if (result !== true) throw new Error("Should detect no change when content is same");
      console.log("✅ Correctly detected unchanged rule");

      // Test 3: Change content - should detect change
      console.log("🔍 Test 3: Existing rule with different content");
      result = await areAllRulesUnchanged(
        "This is DIFFERENT test rule content",
        "test-pkg",
        "cursor",
        mockProvider as any,
        { global: false, debug: false }
      );
      if (result !== false) throw new Error("Should detect change when content differs");
      console.log("✅ Correctly detected changed rule content");

      // Test 4: Multiple rules with mixed changes
      console.log("🔍 Test 4: Multiple rules - one unchanged, one changed");
      const multiRules = [
        { name: "rule1", rule: "This is a test rule content", description: "First rule" },
        { name: "rule2", rule: "This is a different rule", description: "Second rule" },
      ];

      // Create first rule file to match
      const rule1Name = `test-pkg_rule1`;
      const rule1Path = getRulePath("cursor", rule1Name, false, testDir);
      const rule1Content = mockProvider.generateRuleContent(
        { name: rule1Name, content: "This is a test rule content", description: "First rule" },
        { description: "First rule", isGlobal: false, debug: false }
      );
      await writeFile(rule1Path, rule1Content);

      result = await areAllRulesUnchanged(multiRules, "test-pkg", "cursor", mockProvider as any, {
        global: false,
        debug: false,
      });
      if (result !== false) throw new Error("Should detect change when any rule changes");
      console.log("✅ Correctly detected mixed rule changes");

      console.log("✅ All rule-change-detector tests passed!");
    } finally {
      // Restore original cwd
      process.cwd = originalCwd;
    }

    // Cleanup
    await rm(testDir, { recursive: true, force: true });
  } catch (error) {
    console.error("❌ rule-change-detector test failed:", error);
    throw error;
  }
}

async function main() {
  console.log("🧪 Running tests for example projects...\n");

  // Test core utilities first
  await testRuleChangeDetector();

  const projects = await discoverTestableProjects();

  if (projects.length === 0) {
    console.log("📭 No testable projects found");
    return;
  }

  console.log(`\n🔄 Running tests for ${projects.length} projects in parallel...\n`);

  // Use Promise.allSettled to run all tests even if some fail
  const results = await Promise.allSettled(projects.map(runProjectTests));

  // Extract results from settled promises
  const testResults: TestResult[] = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      // Handle unexpected promise rejection
      return {
        project: projects[index],
        success: false,
        output: "",
        error: `Promise rejected: ${result.reason}`,
        duration: 0,
      };
    }
  });

  // Print comprehensive results
  printTestResults(testResults);

  // Exit with appropriate code
  const hasFailures = testResults.some((r) => !r.success);
  if (hasFailures) {
    console.log("\n💥 Some tests failed!");
    process.exit(1);
  } else {
    console.log("\n🎉 All tests passed!");
    process.exit(0);
  }
}

// Run the main function
main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
