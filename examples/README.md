# vibe-rules Examples

This directory contains examples demonstrating how to use `vibe-rules`, a CLI tool for managing AI prompts across different editors and IDEs like Cursor, Windsurf, Claude Code, and others.

## What is vibe-rules?

`vibe-rules` is a command-line utility that helps developers:
- **Install AI prompts** from npm packages into their preferred editor/IDE
- **Manage prompt rules** across different development environments 
- **Share prompt configurations** as part of library packages
- **Standardize AI assistance** across teams and projects

It supports multiple editors including Cursor (`.cursor/rules/*.mdc`), Windsurf (`.windsurfrules`), Claude Code (`CLAUDE.md`), Codex, Clinerules, Zed, and a unified `.rules` format.

## Example Structure

The examples are organized into two main categories:

### End-User Examples
These show how developers can install and use AI prompt rules from packages they depend on.

- **`end-user-cjs-package/`** - CommonJS project consuming rules from multiple packages
- **`end-user-esm-package/`** - ES Module project consuming rules from multiple packages

### Library Examples  
These demonstrate how library authors can add vibe-rules support to their packages.

- **`library-cjs-package/`** - CommonJS library that exports AI prompt rules
- **`library-esm-package/`** - ES Module library that exports AI prompt rules

## How It Works

### For Library Authors

1. **Add rules export** to your `package.json`:
   ```json
   {
     "exports": {
       "./llms": "./dist/llms.js"
     }
   }
   ```

2. **Create rule definitions** in `src/llms.ts`:
   ```typescript
   import type { PackageRuleObject } from "vibe-rules";
   
   const rules: PackageRuleObject[] = [
     {
       name: 'api',
       description: 'API development guidelines',
       rule: "When working with APIs, always...",
       alwaysApply: false,
       globs: ['src/**/*.ts', 'src/**/*.tsx'],
     }
   ];
   
   export default rules; // or module.exports = rules for CJS
   ```

### For End Users

1. **Install vibe-rules** globally:
   ```bash
   npm install -g vibe-rules
   ```

2. **Install rules** from all your dependencies:
   ```bash
   vibe-rules install cursor  # Install rules for Cursor editor
   vibe-rules install windsurf  # Install rules for Windsurf editor
   ```

3. **Install from specific package**:
   ```bash
   vibe-rules install cursor my-package-name
   ```

## Next Steps

- Explore the [main documentation](../README.md) for full CLI reference
- See [ARCHITECTURE.md](../ARCHITECTURE.md) for technical details
