# Upstream audit plan

The fusion process must review implementation, not just README-level design.

## 1. Corpus ingestion and cleaning

For each upstream, inspect:
- supported file/archive formats;
- Markdown/HTML/code/quote/citation stripping;
- OCR and boilerplate normalization;
- chapter/document boundaries;
- large-corpus limits and chunking;
- proper-name/topic leakage controls.

Deliverable: `docs/audits/ingestion-cleaning.md`.

## 2. Feature extraction

Compare:
- sentence/paragraph distributions;
- punctuation and dialogue metrics;
- function words;
- character and word n-grams;
- lexical diversity;
- syntax/POS features;
- discourse/rhetorical markers;
- repetition and cadence;
- Chinese-specific tokenization.

Deliverable: `docs/audits/features.md` with KEEP / ADAPT / REJECT decisions.

## 3. Feature selection and normalization

Inspect:
- event culling / frequency thresholds;
- zero-variance removal;
- topic/NER filtering;
- per-document normalization;
- z-score or other standardization;
- document weighting and register separation.

Deliverable: `docs/audits/normalization-selection.md`.

## 4. Style synthesis and rule mining

Inspect:
- fingerprint/profile schema;
- evidence hierarchy;
- explicit user rules vs inferred rules;
- negative-space rules;
- confidence handling;
- generative vs corrective rule separation;
- prompt/JSON repair logic.

Deliverable: `docs/audits/rule-mining.md`.

## 5. Sampling and exemplars

Inspect:
- representative-sample selection;
- scene/register stratification;
- typicality vs extremeness;
- diversity controls;
- topic leakage avoidance;
- exemplar annotation;
- held-out sample discipline.

Deliverable: `docs/audits/sampling-exemplars.md`.

## 6. Scoring and verification

Inspect:
- local compliance scores;
- Burrows/Eder Delta and distance functions;
- calibration and confidence intervals;
- short-text reliability shrinkage;
- deterministic rule checks;
- BLOCK vs REVIEW severity;
- held-out generation tests;
- regression/golden tests;
- retry with deviation feedback.

Deliverable: `docs/audits/scoring-validation.md`.

## 7. Chinese-fiction adaptation

Design specifically for novels:
- narration/dialogue separation;
- POV and focalization stability;
- dialogue speaker/action-beat rhythm;
- humor/irony/inner-monologue patterns;
- action escalation and high-tension cadence;
- emotion externalization vs direct naming;
- scenery-character coupling;
- chapter hooks;
- character-voice profiles;
- lore/name/topic leakage removal;
- manuscript vs outline/worldbuilding-note detection.

Deliverable: `docs/v2-design.md`.

## 8. Acceptance tests

V2 is not accepted merely because it produces a bundle. It must beat the V1 baseline on:
- held-out chapter metric fit without overfitting to the mean;
- scene-specific style classification;
- exemplar representativeness;
- proper-name/topic leakage rate;
- continuation drift diagnostics;
- robustness on short and long drafts;
- reproducibility on the same corpus.

Use `baseline/v1-linshi` as the regression baseline.
