# 08 Studio Flow

Studio should make the CE advantage visible, not just available.

## Purpose

The Studio flow should show a person how CE represents and retrieves context
across the WordPress ecosystem source constellation.

## Required Flow

1. Open Studio connected to the local CE server.
2. Select the WordPress demo project.
3. Show index status for each source submodule.
4. Run a scripted query.
5. Inspect activated nodes.
6. Follow graph relationships across repos.
7. Open the query trace.
8. Compare the CE-assisted answer with the baseline run.

## Visual Moments

The flow should make these things obvious:

- the project is large
- context spans multiple repos
- CE can surface relationships that search output makes hard to see
- answers are grounded in source anchors
- trace inspection explains how the result was reached

## Candidate Studio Queries

- "Trace block registration from PHP metadata through editor UI and frontend rendering."
- "Find checkout field validation extension points and explain safe change boundaries."
- "Show the source relationships that affect product price display."
- "Identify REST API and editor data flow for block settings."

## Output Artifacts

The `ce` branch should eventually include:

- `demo/studio-flow.md`
- short screenshots or screen recording notes if useful
- expected activated source areas per query
- known limitations in current CE visualization

Do not require Studio for the baseline branch.
