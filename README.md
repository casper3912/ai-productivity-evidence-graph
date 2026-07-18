# The Evidence Graph: AI, Productivity & Agentic-Loop Economics, 2023–2026

A self-contained, self-verifying interactive literature review. One HTML file — no external dependencies, no network calls — mapping 26 studies on AI and productivity as a navigable evidence graph, with two economic appendices (the heavy tail of agentic session cost; the verification-bottleneck thesis), a practice framework, and a dated prediction ledger offered for falsification.

**Read it here: [the live page](https://casper3912.github.io/ai-productivity-evidence-graph/)** — or download `index.html` and open it from anywhere: `file://`, an email attachment, or an intranet share all work.

## What it is

Each node is a study, positioned by publication date, sized by sample (log), colored by headline direction, ringed by methodological quality. Edges mark where studies build on, corroborate, or contradict one another. Every claim in the prose carries a badge — MEASURED, INFERRED, or PREDICTED — and every badge opens its sources. The compilation's own epistemic status is stated in the provenance block at the top of the page; its predictions carry dates, confidences, and published grading commitments.

## Rebuild and verify

The artifact is deterministic: `index.html` is produced by splicing the pinned d3 (v7.9.x, vendored, ISC) into `src/template.html`.

```
python3 build.py            # rebuilds index.html byte-for-byte
npm install                 # jsdom + playwright (pinned 1.56.0)
npx playwright install chromium   # if no local chromium is configured
node verify/verify.js       # oracle L1: jsdom — embedded 64-test suite + structural assertions
node verify/verify-visual.js  # oracle L2: Playwright/Chromium — 23 behavioral tests + screenshots
```

Expected: `SUITE: 64/64`, `EXT` 5/5, `VERDICT: ALL GREEN`, then `PLAYWRIGHT: 23/23`. The page also runs its embedded suite on every load — the badge at the bottom of the document should read **64/64 PASS** in your browser right now.

## Methodology notes: the oracle-gap ledger

This project treats its own verification as part of the subject matter. The document argues that agentic-loop economics are governed by oracle cost — how cheaply correctness can be checked — and the project's authoring history is a live demonstration of the argument's central caveat: **each oracle certifies only what its environment can observe.**

During authoring, ten harness/oracle bugs were found and fixed before shipping; zero shipped. The recurring shape: a test that passed in one environment certified nothing about another. jsdom cannot see rendering; Chromium cannot see what a sandboxed viewer intercepts; a sandboxed viewer intercepts anchor activations at the document capture phase, *upstream* of `preventDefault` — which is why the embedded suite is forbidden from ever dispatching events on `<a>` elements (guarded by Playwright P18: zero anchor activations during the on-load run) and why the suite must restore every piece of state it touches (guarded by P12/P15).

The operating rule that fell out, and which this repo enforces: **every new interactive behavior gets a test at both layers** — a jsdom structural/behavioral test in the embedded suite, and a Playwright test in a real browser — plus screenshot review. Neither layer alone has caught every bug; the pair has.

One more entry, from pre-publication validation: an independent fact-check agent, working from secondary coverage because the primary source blocked automated fetches, reported the SWE-Review resolve rates as a discrepancy. A direct fetch of the paper's HTML reversed the finding — the artifact's numbers were correct and the secondary coverage was wrong. Verification chains are also subject to oracle gaps: check claims against the primary source before acting on them.

## Corrections policy

Open an issue. Accepted corrections are fixed in `src/template.html`, rebuilt via `build.py`, re-verified through both oracles (with a new anti-regression test where the fix is behavioral), logged in `CHANGELOG.md`, and version-bumped in the colophon. The prediction ledger (P1–P4, tracked as issues labeled `ledger`) is graded on schedule and the grades are published, right or wrong.

## Licenses

Split licensing, two files:

- **Content** (text, curation, ratings, predictions, figures): [CC BY 4.0](LICENSE-CONTENT) — cite freely, falsify enthusiastically.
- **Code** (`build.py`, `verify/`, template scaffolding): [MIT](LICENSE-CODE). The vendored `src/d3.min.js` is ISC (Mike Bostock and contributors).

## Attribution

Compiled by M. Martin ([github.com/casper3912](https://github.com/casper3912)) in collaboration with Claude (Anthropic). The experience and the position are the author's; the research aggregation, ratings, edge curation, visualization, and test code were drafted by Claude working under his direction — the full voice-separation statement is in the document's provenance block.
