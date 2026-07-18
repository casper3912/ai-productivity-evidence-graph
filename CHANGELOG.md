# Changelog

## v1.0 — 2026-07-18

Initial public release. Built and verified in collaboration with Claude (Anthropic); see README for methodology.

This release incorporates pre-publication corrections and additions made during independent validation in a fresh environment, before anything was published:

**Content corrections (from a 26/26-study fact-check against the public record):**
- metaprog2026: corrected to 23 studies / 27 effect sizes (was "~40"); finding rewritten to the paper's actual result — productivity g=0.33 (I²=99%), learning effect not significant, and *study setting* as the dominant moderator (lab ≈0.73 vs enterprise ≈0.19 vs open-source ≈0).
- swereview2026: numbers confirmed against the paper (27.5%→56.9%, 50.9%→68.8%); model names made precise (Qwen3-30B-A3B, Qwen3-Coder-30B) and the diminishing-gain caveat added (GLM-5: 72.2%→75.4%).
- canaries2025: noted the Nov 2025 revision raising the headline decline from ~13% to ~16%.
- pwc2025: 2026-edition figure restated correctly as *40% higher growth at most-exposed vs least-exposed firms (34% vs 24% since 2018)*, not "+40% growth"; 2026 wage premium 62%.
- dora2025: removed the "~50% better delivery for fast-review teams" stat from the 2025 node (it originates in the 2023 DORA report; the Appendix B prose now attributes it to the 2023 report explicitly).
- bick2025: dated to original issuance (Sept 2024); productivity figure restated as the paper's ≈1.4% of work hours / ≈1.1% aggregate contribution bounds (was "up to ~1.3%").
- cfo2026: corrected to the paper's actual title ("Artificial Intelligence, Productivity, and the Workforce: Evidence from Corporate Executives").
- faros2025: corrected date (Jul 2025) and source URL; caveat notes the larger 2026 follow-up.
- yotzov2026: "~nine-in-ten" per the paper's abstract (was "80–90%" / "roughly 85%").
- anthropic_econ: caveat notes the Sept 2025 Index found automation overtaking augmentation (node remains dated to the Feb 2025 release).
- peng2023: caveat now carries the wide CI (~21–89%) and completion attrition.
- Toner-Rodgers: language aligned with MIT's actual statement (disavowal — "no confidence in provenance, reliability or validity" — and withdrawal request) rather than "proved fabricated".

**Claim-tag calibration:**
- "Effect size falls as realism rises" retagged MEASURED → INFERRED (the ordering is the compilation's synthesis; the underlying effects are measured).
- The 90th-percentile budget-cap implication in the executive summary now carries its own INFERRED badge, separated from the MEASURED tail statistics.

**Features (each with tests at both oracle layers):**
- B1 Keyboard navigation for graph nodes (Tab focuses, Enter/Space selects, Escape clears; visible focus ring; aria-labels). Tests T60 / P19.
- B2 Print/PDF stylesheet + beforeprint/afterprint section handling for handout use. Tests T61 / P20.
- B3 Per-node edge profile (corroborating / in-tension / building counts) in the metadata panel. Tests T62 / P21.
- B4 CSV and BibTeX export of the study table (client-side blob download; zero external dependencies preserved). Tests T63 / P22.
- B5 Computed quality score with declared weights, shown beside the editorial rating with an expandable formula. Tests T64 / P23.

Embedded suite: 59 → 64 tests. Playwright harness: 18 → 23 tests. All green at release: 64/64 embedded, 5/5 external structural, 23/23 behavioral.
