# Amp Agent Configuration

This file demonstrates how `vibe-rules` formats and manages rules for the Amp AI coding assistant. Rules are stored as XML-like tagged blocks directly within the `AGENT.md` file.

## Amp File Structure

Amp uses a simple, local-only approach:

- **Project rules**: Stored in a single `AGENT.md` file at the project root (local only)
- **Global rules**: Not supported by Amp
- **Subdirectory rules**: Not yet supported by Amp

## Custom Project Rules

Add your custom Amp rules here...

## Rule Examples

<react-component-patterns>
Always Apply: true - This rule should ALWAYS be applied by the AI
Always apply this rule in these files: src/components/**/*.tsx, src/components/**/*.jsx

# React Component Development Guidelines

When creating React components:

1. Use functional components with hooks instead of class components
2. Implement proper TypeScript interfaces for props
3. Use descriptive component and prop names
4. Extract complex logic into custom hooks
5. Add proper JSDoc comments for complex components
6. Use React.memo() for performance optimization when appropriate
7. Implement proper error boundaries for critical components
   </react-component-patterns>

<api-design-patterns>
Always Apply: false - This rule should only be applied when relevant files are open
Always apply this rule in these files: src/api/**/*.ts, src/routes/**/*.ts

# API Development Best Practices

For API development:

1. Use consistent REST conventions (GET, POST, PUT, DELETE)
2. Implement proper error handling with meaningful HTTP status codes
3. Use middleware for authentication and validation
4. Document APIs with OpenAPI/Swagger specifications
5. Implement rate limiting and request validation
6. Use proper TypeScript types for request/response objects
7. Add comprehensive logging for debugging
   </api-design-patterns>

<testing-guidelines>
Always Apply: true - This rule should ALWAYS be applied by the AI

# Testing and Quality Assurance

Testing best practices:

1. Write unit tests for all business logic functions
2. Use integration tests for API endpoints
3. Implement end-to-end tests for critical user flows
4. Maintain at least 80% code coverage
5. Use descriptive test names that explain the scenario
6. Mock external dependencies appropriately
7. Test both success and error cases
8. Use factories or fixtures for test data setup
   </testing-guidelines>

<architecture-patterns>
Always Apply: false - This rule should only be applied when relevant files are open
Always apply this rule in these files: src/models/**/*.ts, src/services/**/*.ts, src/utils/**/*.ts

# Software Architecture Guidelines

Architecture principles:

1. Follow SOLID principles in class design
2. Use dependency injection for better testability
3. Implement proper separation of concerns
4. Use design patterns appropriately (Factory, Strategy, Observer)
5. Keep functions small and focused on single responsibility
6. Implement proper error handling and logging
7. Use TypeScript interfaces to define contracts
8. Follow consistent naming conventions
   </architecture-patterns>

## Additional Notes

The Amp AI coding assistant reads agent instructions from `AGENT.md` files in the project root. Unlike other editors, Amp currently only supports local project configurations.

Key characteristics of Amp's rule system:

- **Simple Structure**: Uses XML-like tagged blocks directly in `AGENT.md`
- **Local Only**: No global configuration support
- **No Wrapper Blocks**: Rules are stored directly without additional integration comments
- **Metadata Support**: Includes human-readable metadata for `Always Apply` settings and file globs

Rules can include metadata such as:

- **Always Apply**: Whether the rule should be automatically applied to all relevant contexts
- **Globs**: File patterns that determine when the rule should be active

Use `vibe-rules` commands to manage these rules:

- `vibe-rules save my-rule -f ./my-rule.md` - Save a rule to local storage
- `vibe-rules load my-rule amp` - Apply a saved rule to this file
- `vibe-rules install amp` - Install rules from NPM packages with `llms` exports
- `vibe-rules install amp my-package` - Install rules from a specific package

Note: Global (`--global`) and target (`--target`) options are not supported for Amp, as it only works with local project `AGENT.md` files.
