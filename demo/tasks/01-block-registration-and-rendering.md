# Task 01: Block Registration And Rendering

Trace how a block moves from registration metadata to editor availability and
front-end rendering.

## Scenario

A developer needs to add a server-rendered block that appears in the Gutenberg
editor and renders correctly on the front end. The task is to identify the
relevant registration, metadata, REST, editor, and rendering paths across
WordPress core and Gutenberg.

## Expected Investigation

- Locate block metadata conventions and registration APIs.
- Identify how editor-side block availability is derived.
- Trace where server-rendered block output is produced.
- Distinguish WordPress core responsibilities from Gutenberg package
  responsibilities.

## Evaluation Questions

- Which files or packages define the registration contract?
- Which PHP and TypeScript paths participate in editor discovery?
- Where is dynamic rendering handled?
- Which hooks or extension points are relevant?
