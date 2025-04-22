// Export all types and utilities
export * from "./types";
export * from "./utils/path";
export * from "./utils/similarity";
export * from "./providers";

// Import providers
import { CursorRuleProvider } from "./providers/cursor-provider";
import { WindsurfRuleProvider } from "./providers/windsurf-provider";

// Export concrete implementations
export { CursorRuleProvider, WindsurfRuleProvider };
