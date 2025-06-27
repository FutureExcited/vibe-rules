# OpenCode Configuration

## Build/Test Commands
- `bun run build` - Compile TypeScript to dist/
- `bun run test` - Run all tests (builds examples first)
- `bun run test:examples` - Run example package tests
- `bun run build:examples` - Build example packages
- `bun run lint` - Run oxlint
- `bun run format` - Format with prettier
- `bun run dev` - Run CLI in development mode

## Single Test Commands
- Run specific test: `cd examples/end-user-cjs-package && npm test`
- Test single file: Use bun test with file path

## Code Style Guidelines
- **Imports**: Use .js extensions for local imports, ESM format
- **Types**: Strict TypeScript, export interfaces from types.ts
- **Naming**: camelCase for variables/functions, PascalCase for classes/interfaces
- **Error Handling**: Use try/catch, return meaningful error messages with chalk
- **Async**: Prefer async/await over promises
- **File Structure**: Commands in src/commands/, providers in src/providers/, utils in src/utils/
- **Testing**: Add tests to examples/end-user-cjs-package/install.test.ts for install command changes
- **Debug**: Use debugLog() function for debug output
- **Minimal Changes**: Only modify necessary code, keep changes simple and clean
