import { test, expect } from "bun:test";
import { $ } from "bun";
import { readFile } from "fs/promises";
import { pathExists } from "fs-extra";

export function registerUninstallTests() {
  test("uninstall should remove a specific rule across editors", async () => {
    const cjsRules = require("cjs-package/llms");
    const esmRules = await import("esm-package/llms");

    expect(Array.isArray(cjsRules)).toBe(true);
    expect(Array.isArray(esmRules.default)).toBe(true);
    expect(cjsRules.length).toBeGreaterThan(0);

    const targetRule = cjsRules[0].name;
    const fullName = `cjs-package_${targetRule}`;

    // Cursor (multi-file)
    await $`rm -rf .cursor`.quiet();
    await $`npm install`;
    await $`npm run vibe-rules install cursor`;
    expect(await pathExists(`.cursor/rules/${fullName}.mdc`)).toBe(true);
    await $`npm run vibe-rules uninstall ${fullName} cursor`;
    expect(await pathExists(`.cursor/rules/${fullName}.mdc`)).toBe(false);
    await $`rm -rf .cursor`.quiet();

    // Windsurf (single file with tags)
    await $`rm -f .windsurfrules`.quiet();
    await $`npm install`;
    await $`npm run vibe-rules install windsurf`;
    let windsurfContent = await readFile(`.windsurfrules`, "utf-8");
    expect(windsurfContent).toContain(`<${fullName}>`);
    await $`npm run vibe-rules uninstall ${fullName} windsurf`;
    windsurfContent = await readFile(`.windsurfrules`, "utf-8");
    expect(windsurfContent).not.toContain(`<${fullName}>`);
    await $`rm -f .windsurfrules`.quiet();

    // Claude Code (single file with wrapper)
    await $`rm -f CLAUDE.md`.quiet();
    await $`npm install`;
    await $`npm run vibe-rules install claude-code`;
    let claudeContent = await readFile(`CLAUDE.md`, "utf-8");
    expect(claudeContent).toContain(`<${fullName}>`);
    await $`npm run vibe-rules uninstall ${fullName} claude-code`;
    claudeContent = await readFile(`CLAUDE.md`, "utf-8");
    expect(claudeContent).not.toContain(`<${fullName}>`);
    await $`rm -f CLAUDE.md`.quiet();

    // Codex (single file with wrapper)
    await $`rm -f AGENTS.md`.quiet();
    await $`npm install`;
    await $`npm run vibe-rules install codex`;
    let codexContent = await readFile(`AGENTS.md`, "utf-8");
    expect(codexContent).toContain(`<${fullName}>`);
    await $`npm run vibe-rules uninstall ${fullName} codex`;
    codexContent = await readFile(`AGENTS.md`, "utf-8");
    expect(codexContent).not.toContain(`<${fullName}>`);
    await $`rm -f AGENTS.md`.quiet();

    // Amp (single file)
    await $`rm -f AGENT.md`.quiet();
    await $`npm install`;
    await $`npm run vibe-rules install amp`;
    let ampContent = await readFile(`AGENT.md`, "utf-8");
    expect(ampContent).toContain(`<${fullName}>`);
    await $`npm run vibe-rules uninstall ${fullName} amp`;
    ampContent = await readFile(`AGENT.md`, "utf-8");
    expect(ampContent).not.toContain(`<${fullName}>`);
    await $`rm -f AGENT.md`.quiet();

    // ZED / Unified (.rules single file)
    await $`rm -f .rules`.quiet();
    await $`npm install`;
    await $`npm run vibe-rules install zed`;
    let rulesContent = await readFile(`.rules`, "utf-8");
    expect(rulesContent).toContain(`<${fullName}>`);
    await $`npm run vibe-rules uninstall ${fullName} zed`;
    rulesContent = await readFile(`.rules`, "utf-8");
    expect(rulesContent).not.toContain(`<${fullName}>`);
    await $`rm -f .rules`.quiet();

    // VSCode (multi-file .instructions.md)
    await $`rm -rf .github`.quiet();
    await $`npm install`;
    await $`npm run vibe-rules install vscode`;
    expect(await pathExists(`.github/instructions/${fullName}.instructions.md`)).toBe(true);
    await $`npm run vibe-rules uninstall ${fullName} vscode`;
    expect(await pathExists(`.github/instructions/${fullName}.instructions.md`)).toBe(false);
    await $`rm -rf .github`.quiet();

    // Clinerules (multi-file .md)
    await $`rm -rf .clinerules`.quiet();
    await $`npm install`;
    await $`npm run vibe-rules install clinerules`;
    expect(await pathExists(`.clinerules/${fullName}.md`)).toBe(true);
    await $`npm run vibe-rules uninstall ${fullName} clinerules`;
    expect(await pathExists(`.clinerules/${fullName}.md`)).toBe(false);
    await $`rm -rf .clinerules`.quiet();
  }, 60000);
}
