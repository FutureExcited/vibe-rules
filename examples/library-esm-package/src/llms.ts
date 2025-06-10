import type { PackageRuleObject } from "vibe-rules";

const rules: PackageRuleObject[] = [
  {
    name: "usage",
    // Use globs to specify when the rule should be applied
    alwaysApply: true,
    rule: `# Usage Rules
    
Use the client to fetch data from the API.
        `,
  },
  {
    name: "api",
    // Use globs to specify when the rule should be applied
    alwaysApply: false,
    globs: ["src/routes/**/*.tsx", "src/api/**/*.ts"],
    rule: `# API Rules

Ensure that the API is designed according to the RESTful principles.
    `,
  },
  {
    name: "architecture",
    // Use a description to explain when the rule should be applied
    alwaysApply: false,
    description: "Use this rule when working on architecture or state management",
    rule: `# Architecture Guide

## Principles
- Use composition over inheritance
- Implement proper prop types
`,
  },
  {
    name: "routing",
    // Add a rule with no configuration for when the rule should be applied
    alwaysApply: false,
    rule: `# Routing Instructions

## Navigation Best Practices
- Use type-safe navigation methods
- Implement proper route validation
- Handle dynamic route parameters
- Support browser back/forward
`,
  },
];
export default rules;
