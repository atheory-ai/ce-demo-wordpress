# 06 Demo Scenarios

Demo scenarios should be difficult enough that generic prior knowledge and grep
are insufficient, but concrete enough that results can be evaluated.

## Scenario Qualities

Good scenarios:

- cross at least two source repositories
- involve both static symbols and dynamic extension points
- have a user-facing behavior
- require PHP and JavaScript/TypeScript context where possible
- have a clear answer quality rubric
- can be answered without running WordPress

Avoid scenarios that are only:

- trivia lookup
- single-file questions
- generic WordPress architecture explanation
- too dependent on current production data or external services

## Candidate Scenarios

### Block Registration And Rendering

Prompt:

> Trace how a block is registered, represented in the editor, serialized, and
> rendered on the frontend. Identify the PHP and JavaScript source areas that
> matter and explain where a safe new attribute would need changes.

Why it works:

- crosses WordPress core and Gutenberg
- mixes PHP, React/TypeScript, metadata, REST, and serialization
- exposes prior-knowledge hallucination risk

### Checkout Field Validation

Prompt:

> Find where to add validation for a checkout field without breaking
> WooCommerce extension hooks. Explain the relevant lifecycle and propose a safe
> implementation plan.

Why it works:

- crosses WooCommerce and WordPress hooks/filters
- has many dynamic extension points
- requires domain lifecycle understanding

### Product Price Display

Prompt:

> Identify the code paths and extension points that can affect product price
> display from data model to rendered output. Include WooCommerce and WordPress
> integration points.

Why it works:

- has many filters and template layers
- grepping for "price" is noisy
- useful to compare lookup volume and missed relationships

### REST API And Editor Data Flow

Prompt:

> Explain how editor-side code obtains and updates server data for blocks or
> settings. Identify the REST API surfaces, client packages, and server handlers
> involved.

Why it works:

- crosses Gutenberg packages and WordPress REST controllers
- requires relationship tracing beyond a single repo

### Regression Investigation

Prompt:

> A change to block serialization caused frontend rendering differences. Build a
> source-grounded investigation plan that identifies likely files, tests, and
> extension points.

Why it works:

- evaluates planning, not just explanation
- forces uncertainty management and test targeting

## Scenario Output Requirements

Every scenario should ask the agent for:

- concise answer
- cited files/symbols
- relevant hooks/filters/APIs
- likely tests
- implementation or investigation plan
- known uncertainties
- commands/files inspected
