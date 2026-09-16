# Methodology

This extractor combines deterministic Chinese stylometry with LLM literary synthesis. The deterministic layer measures what can be counted reliably; the agent layer turns repeated evidence into operational prose rules.

## Corpus unit

Use chapters as the primary statistical documents. When chapter headings are absent, create conservative virtual segments. This avoids collapsing a long novel into one average and makes within-author variability measurable.

Standalone setting notes, outlines, character sheets, and planning material after substantial prose are excluded conservatively and reported. They are not silently deleted.

## Feature families

The deterministic profile includes sentence and paragraph distributions, dialogue ratios, punctuation rates, Chinese function-word frequencies, marker families, character MATTR, and overlapping 2/3/4-character n-grams.

Character n-grams are useful for Chinese because they do not require perfect word segmentation. Function-word signals are kept separately so grammatical habits can be inspected without treating every frequent content phrase as style.

## Feature culling

N-gram candidates must recur across a meaningful share of chapters. Features dominated by one chapter are removed. This adapts the culling idea used in classical stylometry to reduce character-name, location-name, and one-scene topic leakage.

The profile stores only stable features and per-chapter distributions. Features with effectively zero variance are not used for standardized distance.

## Distance

Use a Burrows-Delta-style standardized distance: estimate mean and standard deviation from chapter documents, convert feature deviations to z-score distance, and average absolute deviations. A leave-one-chapter-out distribution establishes the author's normal internal spread.

An Eder-style reverse-rank variant is available in the feature library for experiments, but the default bundle uses the simpler standardized Delta because it is easier to audit.

A distance is a diagnostic, not an authorship probability. Short drafts receive lower confidence even when their distance is small.

## Exemplars and holdout

Candidate passages are first routed to dialogue, action, emotion, scenery, narration, and high-tension scenes with deterministic heuristics. Selection then balances scene strength, closeness to the chapter-level style center, chapter diversity, and textual diversity.

Exemplars are provided to the synthesis model. Separate holdout passages are hidden until after the style bundle is built so validation does not reuse its own examples.

## Qualitative synthesis

The agent reads measurements plus exemplars and writes `deep-style.json`. It must distinguish writing mechanisms from plot content, cite evidence IDs, record confidence, and produce global plus scene-specific rules.

Explicit author preferences outrank inferred rules. Low-confidence impressions remain limitations rather than becoming hard instructions.

## Bundle use

Normal continuation should load the global rules, one active scene profile, and a small matching exemplar set. The full quantitative profile is for diagnosis and scoring rather than routine prompt context.
