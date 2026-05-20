# Task 04: REST API And Editor Data Flow

Trace how editor data moves between WordPress REST API endpoints and Gutenberg
client data stores.

## Scenario

A developer needs to debug stale editor data after a REST API response changes.
The task is to identify the endpoint, client data store, resolver, cache, and
consumer path.

## Expected Investigation

- Locate relevant REST controllers in WordPress core.
- Locate Gutenberg data stores and resolvers that consume REST responses.
- Identify cache or invalidation behavior.
- Explain how a UI component receives updated data.

## Evaluation Questions

- Which REST controller owns the response shape?
- Which Gutenberg package fetches and stores the data?
- Where is cache invalidation handled?
- What files should a regression test cover?
