// Export all types and utilities
export * from "./types.js";
export * from "./utils/path.js";
export * from "./utils/similarity.js";
export * from "./providers/index.js";

// Import providers
import { CursorRuleProvider } from "./providers/cursor-provider.js";
import { WindsurfRuleProvider } from "./providers/windsurf-provider.js";

// Export concrete implementations
export { CursorRuleProvider, WindsurfRuleProvider };
