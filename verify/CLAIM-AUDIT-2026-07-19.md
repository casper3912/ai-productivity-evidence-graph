# Claim audit — 2026-07-19 (post-publication)

Automated primary-source audit of all 26 study records (claim-verify,
personalAgentLoopTools): per study, the cited URL was fetched directly
(arXiv via export mirror; PDFs swapped for abstract pages — same primary)
and three layers were checked against the extracted text: publication year,
sample n, and the leading numeric stat of the finding.

**Result: zero contradictions.** No reachable primary states a number
different from this artifact's dataset. Layers the abstracts state were
confirmed (all years except JS-shell pages; n and stats for DellAcqua,
METR-2025, METR-2026, Yotzov, meta-analysis-2026, Faros, and others).
Values absent from abstract-level text are recorded as unverified-by-
automation, NOT as confirmations — per the rule this project's own
fact-check incident taught: never substitute secondary coverage.

Unreachable/gated primaries needing manual verification (in priority order):
Noy-Zhang (science.org 403), Otis & Cui (SSRN 403), NANDA n=800 (landing
page shows report scope only), PwC 4x (gated PDF), Stanford AI Index 14-15%
(hub URL; figures in report PDF), GDPval (openai.com 403), Anthropic
Economic Index (JS shell), Humlum n/stat (NBER abstract omits numbers).
SWE-Review resolve rates were verified during authoring by direct paper-HTML
fetch (see README, oracle-gap ledger).

Raw results: claim-audit-2026-07-19.json.
