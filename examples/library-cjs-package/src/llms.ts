import type { PackageRuleObject } from "vibe-rules";

const rules: PackageRuleObject[] = [
  {
    name: 'api',
    description: 'vibe-rules example cjs package API',
    rule: "vibe-rules example cjs package here are some rules for API ...",
    alwaysApply: false,
    globs: ['src/**/*.ts', 'src/**/*.tsx'],
  },
  {
    name: 'guide',
    description: 'vibe-rules example cjs package Guide',
    rule: "vibe-rules example cjs package here are some rules for Guide ...",
    alwaysApply: false,
    globs: ['src/**/*.ts', 'src/**/*.tsx'],
  },
  {
    name: 'routing',
    description: 'vibe-rules example cjs package Routing',
    rule: "vibe-rules example cjs package here are some rules for Routing ...",
    alwaysApply: false,
    globs: ['src/**/*.ts', 'src/**/*.tsx'],
  },
  {
    name: 'setup-and-architecture',
    description: 'vibe-rules example cjs package Setup and Architecture',
    rule: "vibe-rules example cjs package here are some rules for Setup and Architecture ...",
    alwaysApply: false,
    globs: ['package.json', 'vite.config.ts', 'tsconfig.json', 'src/**/*.ts', 'src/**/*.tsx'],
  }
]

module.exports = rules
