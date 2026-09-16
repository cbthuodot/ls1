---
name: chinese-novel-style-extractor
description: Extract a reusable style bundle from Chinese long-form fiction for continuation or rewriting. Use for TXT, Markdown, DOCX, ZIP, or folders of Chinese novels when the goal is to measure chapter-level stylometry, separate prose from setting/outline notes, select scene-specific exemplars, synthesize evidence-backed global and scene writing rules, validate the result, or score later drafts against the extracted style.
---

# Chinese Novel Style Extractor

Build a reusable `style_bundle` from a Chinese fiction corpus. Combine deterministic chapter-level measurements with evidence-grounded literary analysis. Do not fine-tune a model and do not treat one corpus-wide average as the author's entire style.

## Workflow

### 1. Analyze the corpus

Run:

```bash
python scripts/analyze_corpus.py <source> --work-dir <work-dir>
```

Accept TXT, Markdown, DOCX, ZIP, or a directory. Keep automatic notes/outline exclusion enabled unless the user explicitly wants those sections included.

Inspect `<work-dir>/analysis.json` for corpus warnings and excluded tails. If automatic exclusion removed genuine fiction, rerun with `--no-auto-exclude-notes` or correct the source boundaries before continuing.

### 2. Synthesize deep style

Read:

- `<work-dir>/analysis.json`
- `<work-dir>/samples.json`
- `<work-dir>/deep-style.template.json`
- `references/deep-style-schema.md`

Do **not** read `<work-dir>/holdout.json` yet. It is reserved for verification.

Create `<work-dir>/deep-style.json` by following the template and the evidence rules in `references/deep-style-schema.md`. Cite sample IDs for inferred rules. Separate style from character names, lore, locations, plot facts, and other topic content.

If the user provides explicit writing preferences or correction rules, add them to `explicit_user_rules`; these outrank inferred rules.

### 3. Build the style bundle

Run:

```bash
python scripts/build_bundle.py \
  --analysis <work-dir>/analysis.json \
  --samples <work-dir>/samples.json \
  --deep-style <work-dir>/deep-style.json \
  --out <bundle-dir>
```

The bundle contains global rules, corrective rules, six scene profiles, scene exemplars, a loader contract, and the quantitative profile.

### 4. Validate

Run:

```bash
python scripts/validate_bundle.py <bundle-dir>
```

Do not deliver an invalid bundle. If the corpus is too short or has too few stable features, report the limitation instead of fabricating a strong profile.

### 5. Verify without contaminating synthesis

Only after the bundle exists, read `<work-dir>/holdout.json`. Compare holdout passages with the extracted rules and quantitative ranges. Use them to detect overfitting or scene-routing errors; do not retroactively turn one holdout anomaly into a global rule.

For a draft or continuation, run:

```bash
python scripts/score_draft.py <draft> --profile <bundle-dir>/style-profile.json --json
```

Treat the result as a drift diagnostic. A low distance does not prove authorship or literary quality. Short text has low confidence by design.

## Continuation integration

Normal continuation should load `global-style.md`, one matching `scenes/<scene>.md`, and the corresponding `exemplars/<scene>.md`. Load `avoid-style.md` for post-draft correction. Do not routinely inject the entire `style-profile.json` into the generation prompt.

Plot continuity, character state, and world facts outrank style rules when they conflict.

## Method and provenance

Read `references/methodology.md` when modifying measurements, culling, distances, exemplar selection, or validation. Read `references/upstream-provenance.md` before copying or replacing upstream-derived logic; preserve license boundaries. For ZCode placement, see `references/zcode-install.md`.

## Maintenance

Run the deterministic smoke test after any code change:

```bash
python scripts/selftest.py
```

Keep the base runtime standard-library only. Optional future dependencies must degrade gracefully and must not become mandatory for basic TXT/MD/DOCX extraction.
