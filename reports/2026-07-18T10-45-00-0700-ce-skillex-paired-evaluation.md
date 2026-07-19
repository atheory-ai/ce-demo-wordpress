# CE + Skillex paired evaluation — 2026-07-18 10:45 -0700

## Decision summary

This evaluation did **not** demonstrate that the released Context Engine
improves completeness or accuracy for the WordPress/Gutenberg Task 04 flow.
The source-only control recovered a complete, evidence-backed path and a
bounded change/test proposal. CE mapped the WordPress REST-controller half,
but its persisted graph did not provide the Gutenberg store, resolver, cache,
or consumer anchors needed to complete the task. The CE-assisted agents
stopped rather than substituting broad source search, as the demo instructs.

That is the correct behavioural result for the benchmark: correctness and
honest evidence boundaries matter more than a superficially complete answer
or number of tool calls. Skillex did add value as a procedural guardrail, but
that must not be attributed to CE semantic mapping.

## Question and hypothesis

**Benchmark task:** `demo/tasks/04-rest-api-editor-data-flow.md` at
`3b782e5f85b420256066944e0d645d84efb35050`.

The task asks an agent to trace a changed REST response through WordPress and
Gutenberg: controller and response shape, request/store/resolver/cache, UI
consumer, cache invalidation, and the regression-test surface.

**Hypothesis:** after indexing the same corpus, a CE + Skillex agent should
recover a more complete and accurate causal chain than a source-only agent,
then use that map to propose a narrowly scoped implementation and test change.
The IIR/LMIR criterion is semantic, not textual: the proposal should identify
the operation, inputs, effects, failure behaviour, and cache-consistency
invariants before proposing code.

**Success criterion:** factual completeness and accurate relationships,
including a safe implementation boundary. We did not score turns, request
count, or one-time indexing cost as a proxy for value.

## Conditions and reproducibility

| Item | Value |
| --- | --- |
| Demo revision | `3b782e5f85b420256066944e0d645d84efb35050` |
| CE | public release `0.1.1` |
| Skillex | public release `0.7.2`; refreshed registry: 4 skills / 8 scenarios |
| PHP demo plugins | built locally with Zig `0.13.0`; plugin tests: 6 passed |
| CE data directory | `/private/tmp/ce-wordpress-eval-fixture-data` |
| Task | `04-rest-api-editor-data-flow.md` |
| Agents | source-only senior control; CE + Skillex senior; CE + Skillex novice |

The CE conditions followed `AGENTS.md`: Skillex was refreshed and queried
first; source text could only be read after a CE result cited a narrow anchor.
They were forbidden from replacing unavailable CE discovery with broad source
search. The control was explicitly forbidden from using CE or Skillex.
No agent edited source or ran a WordPress site.

## Preflight and corpus observations

The PHP/convention plugin path is real and usable:

- both WebAssembly plugins validated after build;
- the small PHP fixture indexed successfully: **1 file, 11 nodes, 10 edges**;
- WordPress core indexed successfully: **2,796 files, 39,891 nodes, 37,142
  edges** in about 7 minutes 34 seconds.

Two important limits were also observed before scoring the benchmark:

1. Indexing WooCommerce reported repeated write-buffer foreign-key warnings
   (`upsert_edge: constraint failed: FOREIGN KEY constraint failed (787)`). It
   completed with **843 files, 5,594 nodes, 4,758 edges**, 29 extraction errors
   and 1,232 skipped files. This report does **not** assign that defect to CE
   or the demo plugins yet: the PHP-only/convention-plugin boundary needs a
   fresh-data, controlled reproduction first.
2. Attempts to index Gutenberg produced no successful completion record, and
   deterministic CE search did not contain the expected Gutenberg symbols.
   The senior CE session reported 44,678 nodes / 44,747 edges but could not
   find `getEntityRecord`, `getEntityRecords`, `receiveEntityRecords`,
   `invalidateResolution`, or `useEntityRecord`. This is the material blocker
   for Task 04.

## Results

### Source-only senior control

The control selected a concrete attachment/featured-image path (the task does
not name a single entity) and recovered this source-backed chain:

```text
attachment metadata
  -> WP_REST_Attachments_Controller::prepare_item_for_response
  -> GET /wp/v2/media/:id
  -> core-data getEntityRecord / apiFetch
  -> receiveEntityRecords and queried-data cache
  -> featured-image selector
  -> editor UI
```

Evidence recovered by the control:

- `wordpress/src/wp-includes/post.php` registers the attachment post type with
  `show_in_rest`, REST base `media`, and `WP_REST_Attachments_Controller`.
- `wordpress/src/wp-includes/rest-api/endpoints/class-wp-rest-attachments-controller.php`
  supplies attachment response fields such as `alt_text`, `media_type`, and
  `media_details`.
- `gutenberg/packages/core-data/src/entities.js` configures the dynamic
  `postType/attachment` entity with base URL `/wp/v2/media`.
- `gutenberg/packages/core-data/src/resolvers.js`, `getEntityRecord`, fetches
  the entity and dispatches `receiveEntityRecords`.
- `gutenberg/packages/core-data/src/actions.js` and
  `gutenberg/packages/core-data/src/queried-data/reducer.js` receive and cache
  records by entity/query identity.
- `gutenberg/packages/editor/src/components/post-featured-image/index.js`
  selects `getEntityRecord( 'postType', 'attachment', id, { context: 'view' } )`.

It found the key stale-data detail: resolver invalidation is selector plus
**exact argument array**. The existing
`gutenberg/packages/editor/src/utils/media-upload/on-success.js` invalidates
both the `{ context: 'view' }` and unqualified attachment reads. Invalidating
only one query identity can leave the featured-image consumer stale.

The control's safe proposal was correspondingly narrow: after a completed
server-side media mutation, invalidate the affected attachment IDs for the
exact read variants that consumers use, rather than clearing `core-data`.
It proposed focused tests for the invalidation helper, resolver refetch and
replacement, query-identity isolation, and (only if the schema changes) the
WordPress attachment-controller response tests.

Its semantic plan was complete:

- **operation:** refresh an attachment entity after successful server mutation;
- **inputs:** attachment IDs, completed mutation, known consumer query variants;
- **effect:** invalidate matching resolver entries so the next read refetches;
- **invariants:** unrelated entities remain cached; query identity matches
  exactly; the featured-image consumer eventually sees the current response;
- **failure behaviour:** preserve existing error/loading semantics and do not
  discard cached data prematurely.

### CE + Skillex senior treatment

Skillex supplied the relevant guided-investigation procedure and its stop
condition. Through deterministic CE MCP stdio, the agent was able to search
and cite the WordPress server side:

- `WP_REST_Posts_Controller.register_routes` at
  `wordpress/src/wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php:72`;
- `get_item` at `:662`;
- `prepare_item_for_response` at `:1884`.

That is useful structural mapping. A CE-cited narrow read established:

```text
/wp/v2/<rest_base>/:id -> get_item -> prepare_item_for_response -> REST response
```

However, all core Gutenberg anchors required to continue the causal chain
returned no nodes. `core-data` resolved only to an unlocated namespace;
summary/investigation gave no usable core-data source anchor. CE source ranges
also returned `src/...` paths without the required `wordpress/` submodule
prefix, and references/callgraph for the concrete controller method had no
context.

The agent therefore did **not** name a specific Gutenberg code change or test
file. It could only declare the intended semantic target: update or invalidate
the precise entity/query cache identity after a response change, preserve
unrelated cache entries, and ensure a failed refresh cannot mark stale data as
current. That is a sound restraint, not a complete solution to the task.

### CE + Skillex novice treatment

The novice successfully obtained the same process guidance from Skillex:
`skillex doctor` reported 4 skills and no errors, and the AGENTS/IIR skills
clearly distinguished source evidence from inference and bounded IIR from
whole-program verification.

It could not obtain a deterministic CE discovery channel in a fresh terminal
workflow:

- `ce query` correctly refused because it is experimental and disabled;
- `ce server start` printed a running endpoint, but an immediate status check
  reported a stale PID file and another session could not connect;
- no documented terminal invocation connected the required deterministic MCP
  tools.

The process lifecycle may be partly evaluation-sandbox-specific, but the
demo's user-facing instructions still lack a reproducible terminal/MCP
attachment path. The novice stopped, did not source-search around CE, and
therefore made no unsupported code proposal.

## IIR check: bounded evidence, not a whole-program claim

`scripts/iir-smoke.sh` passed against CE `0.1.1`. The declared fixture says:

```text
entityKey === "" -> invalid_entity_key; effect: cache.invalidate
```

The generated TypeScript contained that structured condition and the observed
report recorded the same normalized `whenExpr`, the failure mode, and the
cache effect. This demonstrates the small declared-intent → generated-source
→ observed-intent loop for the teaching fixture.

It does **not** map or verify Gutenberg's real resolver/cache flow, WordPress
REST behaviour, PHP hooks, or WooCommerce. The report also warns that the
fixture throws a failure rather than using a `Result` type. Additionally, the
verification's explicit behaviour match message is currently only “behavior
clause count matches (1)”; even though this fixture's generated condition was
manually aligned, condition-level comparator coverage should be made explicit
before treating this as strong semantic-proof evidence.

## Comparative conclusion

| Criterion | Source-only senior | CE + Skillex senior | CE + Skillex novice |
| --- | --- | --- | --- |
| REST controller/response boundary | Complete | Complete for generic post flow | Not completed |
| Gutenberg request/store/resolver/cache/consumer | Complete attachment path | Not discoverable in CE graph | Not discoverable |
| Exact stale-cache cause | Recovered query-identity distinction | Could not establish | Could not establish |
| Named code and test plan | Evidence-backed and bounded | Only generic semantic direction | None; correctly stopped |
| IIR/LMIR claim | Semantic plan derived from code | Bounded fixture only | Bounded fixture only |
| Appropriate uncertainty handling | States representative-path limit | Correctly refused unsupported claims | Correctly refused unsupported claims |

The paired comparison therefore rejects the original hypothesis **for this
release/task**. CE's PHP mapping and Skillex's discipline are promising, but
they did not yield a more complete or more accurate agentic-development result
than the control. A user should not be told otherwise.

## Next validation gates

1. Make the released CE index and expose Gutenberg TypeScript symbols in the
   same persisted project that indexes WordPress. Add an end-to-end regression
   that asserts the Task 04 anchor set is queryable.
2. Document and test one reproducible, fresh-agent deterministic MCP setup
   (including server lifecycle) or provide a supported non-experimental CLI
   discovery path. The agent guide should be executable without hidden harness
   infrastructure.
3. Fix CE source-range paths so submodule-relative graph anchors can be read
   from the demo root; add reference/callgraph coverage for controller methods.
4. Reproduce WooCommerce's foreign-key warnings with fresh data and one plugin
   at a time. Classify and fix in CE or the demo plugin based on that result,
   then add the appropriate regression test.
5. Strengthen IIR verification reporting/tests to show condition-level semantic
   comparison, not only behaviour-clause cardinality, and add negative and
   inconclusive fixtures before presenting semantic verification as a broader
   capability.
6. Rerun this exact paired Task 04 evaluation after the gates pass. Only then
   make a claim about CE improving completeness, accuracy, or safe change
   design.
