# Chinese novel style extractor fusion

This repository keeps the upstream projects used for source-level comparison under `projects/` and the fused implementation under `fusion/chinese-novel-style-extractor/`.

## Upstream projects

- `stylometric-transfer`: explicit style fingerprints, cleanup, variability baselines, deviation/retry ideas. PolyForm Noncommercial; studied and independently reimplemented where used.
- `write-like-me`: voice-profile workflow, rule mining, exemplars, holdout verification, deterministic checks. MIT.
- `mowen`: modular stylometry, Chinese support, feature culling, Burrows' Delta. MIT.
- `stylo`: mature classical stylometry methods including culling and Delta variants. GPL-3-or-later; studied and independently reimplemented where used.
- `writing-style-extractor`: qualitative style schema and replication-oriented analysis. MIT per upstream README.

Clone with submodules if you want the upstream source trees:

```bash
git clone --recurse-submodules https://github.com/cbthuodot/ls1.git
```

## Fused implementation

The actual usable extractor is `fusion/chinese-novel-style-extractor/`. It is written for Chinese long-form fiction and does not depend on the earlier V1 project.

Run its smoke test:

```bash
python fusion/chinese-novel-style-extractor/scripts/selftest.py
```

Analyze a novel:

```bash
python fusion/chinese-novel-style-extractor/scripts/analyze_corpus.py novel.txt --work-dir .style-work
```

Then follow `fusion/chinese-novel-style-extractor/SKILL.md` to synthesize `deep-style.json`, build `style_bundle`, validate it, and score later drafts.
