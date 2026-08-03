# CE context-acquisition evaluation — 2026-07-28

## Question

Does the current CE build make an iterative code investigation more correct,
complete, and repeatable than the earlier WordPress demo evaluation? This is
not a first-search or latency benchmark. A result only counts when an agent
can recover the required source anchors, distinguish direct evidence from
inference, and make a bounded change/test proposal after several CE-guided
steps.

## Conditions

- CE: local `0.6.0-dev`, rebuilt after the reference-resolution projection
  scale fix.
- Corpus: WordPress core, Gutenberg, and WooCommerce at demo revision
  `cb49ba6`; generated/cache outputs excluded.
- Data: `demo/runs/ce-evaluation-20260728` (ignored and on `/Volumes`).
- Access method: deterministic CE MCP stdio tools. No broad source discovery.
- Required workflow: broad investigation may seed a hypothesis, but exact CE
  symbol search and CE-cited narrow source inspection determine the answer.

## Index precondition

The first full run correctly refused publication during reference projection:

```text
clear stale resolved edges: SQL logic error: too many SQL variables
```

The cause was a single `NOT IN` predicate containing every desired derived
edge ID. CE now removes stale `resolves_to` and derived `imports` edges with
set-based joins to the newly replaced `reference_resolutions` projection. This
retains stable edge IDs/weights and avoids SQLite's bound-parameter limit.

Regression coverage: 600 raw references / 1,200 derived edges, followed by a
projection that removes one reference, passes in
`internal/storage/writebuffer`.

After the fix, the same full index published successfully:

```text
34,112 files indexed
224,237 nodes
190,127 edges
30,447 resolved references
8,651 external references
19,215 unresolved references
0 ambiguous references
2,123 unsupported references
139 resolver definitions
12m54.361s
```

The one-file PHP fixture also remained correct: 11 nodes, 10 edges, and MCP
`ce_search` returned its file anchor.

## Experiment A — REST response to Gutenberg stale-data path

### Theory

The old paired evaluation failed because Gutenberg's client anchors were not
present in the persisted graph. The new TypeScript reference resolver and
full-corpus indexing should make the full server/client/cache/consumer path
available to an iterative CE investigation.

### Required anchor set

1. `WP_REST_Attachments_Controller` and its response preparation method.
2. Gutenberg `getEntityRecord` resolver.
3. `receiveEntityRecords` action.
4. `invalidateResolution` API.
5. Editor `PostFeaturedImage` consumer.

### Results

Exact deterministic CE searches returned all five, each with a source path and
line anchor:

| Required fact | CE result |
| --- | --- |
| Attachment controller | `wordpress/src/wp-includes/rest-api/endpoints/class-wp-rest-attachments-controller.php` |
| `getEntityRecord` | `gutenberg/packages/core-data/src/resolvers.js:69` |
| `receiveEntityRecords` | `gutenberg/packages/core-data/src/actions.js:94` |
| `invalidateResolution` | `gutenberg/packages/data/src/redux-store/metadata/actions.ts:125` |
| `PostFeaturedImage` | `gutenberg/packages/editor/src/components/post-featured-image/index.js:93` |

`ce_file_context` on the controller also returned its complete controller
method surface, including `register_routes` and `prepare_item_for_response`.

### Analysis

This clears the former hard blocker: a CE-guided agent can now locate the
essential Gutenberg symbols without substituting filesystem search. It does
not yet prove a complete causal answer: `ce_callgraph` returned no context for
the TypeScript `getEntityRecord` node, so CE currently cannot by itself trace
the resolver's callers/callees. The correct next step remains narrow source
inspection of the CE-cited files, not a claim that the graph proved the entire
runtime flow.

## Experiment B — Store API headless-cart merge

### Theory

The PHP reference projection should permit a CE-guided investigation to find
the Store API bootstrap/authentication/token/session boundary and its direct
test surface.

### Required anchor set

1. Store API bootstrap (`StoreApi::init`).
2. Store API authentication.
3. cart token utility and token-payload handling.
4. `wc_load_cart` lifecycle point.
5. Store API session/token tests.

### Results

Exact CE searches returned:

- `StoreApi` in `woocommerce/plugins/woocommerce/src/StoreApi/StoreApi.php`;
- `Authentication` and `Authentication.check_authentication` in
  `src/StoreApi/Authentication.php`;
- `CartTokenUtils` and `get_cart_token_payload` in
  `src/StoreApi/Utilities/CartTokenUtils.php`;
- `wc_load_cart` in `includes/wc-core-functions.php:2518`;
- direct tests including `SessionHandlerTest.php` and
  `CartTokenUtilsTests.php`.

### Analysis

The structural discovery and test targeting are now repeatable and materially
better than the former missing-Gutenberg corpus. As in Experiment A, the broad
`ce_investigate` seed was noisy; it found `StoreApi` and a relevant test but
also unrelated API/Gutenberg symbols. Exact symbol refinement is currently a
required iteration, not an optional optimization.

## Verdict

**Index correctness / cross-language anchor availability: passed.** The full
corpus publishes successfully, contains the previously absent Gutenberg
symbols, and exposes the PHP/WooCommerce anchors and tests required to begin
both investigations.

**Agent-level completeness claim: not yet passed.** The evidence supports a
meaningful improvement over the prior failure, but two defects prevent a
strong conclusion that CE consistently yields a complete final answer:

1. broad `ce_investigate` ranking is too noisy for these conceptual queries;
2. TypeScript callgraph context is absent for `getEntityRecord`.

The next experiment should use fresh independent agents under the documented
CE-only procedure, require CE-cited narrow reads after exact anchors, and
compare their final source-backed answers with a fresh source-only baseline on
the same revision. Score final causal-chain coverage and unsupported claims,
not the first CE response or number of tool calls.
