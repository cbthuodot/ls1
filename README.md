# Chinese Novel Style Fusion Lab

This repository is a research-and-reimplementation workspace for building a stronger Chinese-fiction style extractor for ZCode/Skill workflows.

## Purpose

The goal is not to paste several projects together. The workflow is:

1. Pin upstream projects at exact commits under `upstreams/`.
2. Audit their real implementation paths: corpus cleaning, segmentation, features, sampling, rule mining, scoring, verification, retry loops, and packaging.
3. Record reusable mechanisms and license constraints in `docs/`.
4. Reimplement the useful ideas in our own Chinese-fiction-oriented code under `src/` and `skill/`.
5. Compare the new implementation against `baseline/v1-linshi` on held-out chapters and generated continuations.

## Pinned references

- `upstreams/stylometric-transfer` — explicit fingerprints, measurement-to-target mapping, local compliance scoring, deviation feedback, retry/calibration. Reference-only for implementation because its license is PolyForm Noncommercial 1.0.0.
- `upstreams/write-like-me` — rule mining, exemplar selection, held-out verification, deterministic voice checks. MIT.
- `upstreams/mowen` — modular stylometry pipeline, Chinese tokenization, event drivers/cullers, distance functions, Burrows/Eder-style methods, evaluation. MIT.
- `upstreams/writing-style-extractor` — LLM-oriented literary/style-DNA schema and Skill organization. Treat as reference-only unless licensing is clarified.
- `baseline/v1-linshi` — our current V1 extractor for regression comparison.

## Target V2 architecture

`ingest -> clean/canonicize -> document/chapter segmentation -> feature extraction -> feature culling -> distributional profile -> scene stratification -> exemplar/holdout split -> LLM literary synthesis -> bundle compiler -> draft validator -> deviation feedback`

The final deliverable remains a portable `style_bundle` that a separate continuation Skill can load progressively.

## License rule

Do not copy code from a source whose license does not permit the intended use. Prefer independent reimplementation of algorithms and patterns, with attribution in audit notes. Keep all upstreams as pinned submodules so provenance remains visible.
