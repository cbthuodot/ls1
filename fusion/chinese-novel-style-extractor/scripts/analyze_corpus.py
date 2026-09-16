#!/usr/bin/env python3
"""Analyze a Chinese novel corpus and emit deterministic style evidence for LLM synthesis."""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from corpus_io import load_corpus, prepare_chapters, cjk_len
from features import (
    base_metrics,
    distribution,
    feature_stats,
    leave_one_out_deltas,
    percentile,
    select_samples,
    select_stable_ngrams,
    vectorize,
    chunk_chapter,
)


def build_analysis(source: str, auto_exclude_notes: bool, min_doc_ratio: float, max_ngrams: int) -> tuple[dict, list[dict], list[dict]]:
    docs = load_corpus(source)
    chapters, exclusions = prepare_chapters(docs, auto_exclude_notes=auto_exclude_notes)
    usable = [ch for ch in chapters if cjk_len(ch.text) >= 120]
    if len(usable) < 2:
        raise ValueError("Need at least two usable chapters/virtual segments for a stable profile")

    texts = [ch.text for ch in usable]
    ngrams = select_stable_ngrams(
        texts,
        min_doc_ratio=min_doc_ratio,
        max_features_per_n=max_ngrams,
    )
    scalar_vectors = [vectorize(t, None) for t in texts]
    full_vectors = [vectorize(t, ngrams) for t in texts]
    scalar_stats = feature_stats(scalar_vectors)
    full_stats = feature_stats(full_vectors)
    loo = leave_one_out_deltas(full_vectors)

    # Calibrate short-draft scoring against corpus windows rather than whole chapters.
    windows = [chunk for chapter in usable for chunk in chunk_chapter(chapter)]
    window_vectors = [vectorize(chunk, ngrams) for chunk in windows]
    window_stats = feature_stats(window_vectors)
    window_loo = leave_one_out_deltas(window_vectors)

    exemplars, holdout = select_samples(usable, scalar_stats)

    chapter_metrics = []
    for chapter, vec in zip(usable, scalar_vectors):
        chapter_metrics.append({
            **chapter.metadata(),
            "metrics": {k: round(v, 6) for k, v in vec.items() if not k.startswith("fw:")},
        })

    metric_distributions: dict[str, dict] = {}
    if scalar_vectors:
        keys = sorted(set.intersection(*(set(v.keys()) for v in scalar_vectors)))
        for key in keys:
            metric_distributions[key] = distribution([v[key] for v in scalar_vectors])

    total_cjk = sum(cjk_len(t) for t in texts)
    profile_warning = []
    if len(usable) < 5:
        profile_warning.append("Fewer than 5 chapter-level documents; distribution estimates are weak.")
    if total_cjk < 20000:
        profile_warning.append("Corpus is below 20,000 CJK characters; treat rare lexical findings as low-confidence.")
    if loo and percentile(loo, 0.90) > 3.5:
        profile_warning.append("Large cross-chapter stylistic dispersion detected; scene/register-specific profiles are important.")

    analysis = {
        "schema_version": "2.0",
        "method": "chapter-distribution + culled char ngrams + standardized Delta + stratified exemplars",
        "corpus": {
            "input": str(Path(source).expanduser()),
            "documents": [d.metadata() for d in docs],
            "chapters_used": len(usable),
            "total_cjk_chars": total_cjk,
            "excluded_tails": exclusions,
            "warnings": profile_warning,
        },
        "chapters": chapter_metrics,
        "metric_distributions": metric_distributions,
        "stable_ngrams": ngrams,
        "distance_model": {
            "feature_stats": {
                k: {name: round(float(value), 8) for name, value in st.items() if name in {"mean", "std", "p10", "p25", "p50", "p75", "p90", "min", "max"}}
                for k, st in full_stats.items()
            },
            "leave_one_out_delta": distribution(loo),
            "recommended_review_ratio": 1.0,
            "recommended_outside_ratio": 1.35,
            "notes": [
                "Delta uses chapter-level z-score deviations over stable features.",
                "Character n-grams are culled by cross-chapter coverage and document concentration to reduce topic/name leakage.",
                "Distances are diagnostics, not authorship probabilities.",
            ],
        },
        "window_distance_model": {
            "window_cjk_chars": distribution([cjk_len(chunk) for chunk in windows]),
            "feature_stats": {
                k: {name: round(float(value), 8) for name, value in st.items() if name in {"mean", "std", "p10", "p25", "p50", "p75", "p90", "min", "max"}}
                for k, st in window_stats.items()
            },
            "leave_one_out_delta": distribution(window_loo),
            "notes": [
                "Use this model for short drafts/excerpts so they are compared with source passages of similar scale.",
                "Window calibration is separate from chapter calibration to reduce length-induced false alarms."
            ]
        },
        "sample_counts": {
            "exemplar_candidates": len(exemplars),
            "holdout_candidates": len(holdout),
        },
    }
    return analysis, exemplars, holdout


def deep_style_template(exemplars: list[dict]) -> dict:
    ids = [e["sample_id"] for e in exemplars]
    return {
        "schema_version": "2.0",
        "source_sample_ids": ids,
        "global_rules": [],
        "avoid_rules": [],
        "scene_profiles": {
            "dialogue": {"rules": []},
            "action": {"rules": []},
            "emotion": {"rules": []},
            "scenery": {"rules": []},
            "narration": {"rules": []},
            "high_tension": {"rules": []},
        },
        "approved_exemplars": {
            "dialogue": [],
            "action": [],
            "emotion": [],
            "scenery": [],
            "narration": [],
            "high_tension": [],
        },
        "signature_traits": [],
        "explicit_user_rules": [],
        "limitations": [],
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("source", help="TXT/MD/DOCX file, ZIP, or directory")
    ap.add_argument("--work-dir", default=".style-work")
    ap.add_argument("--no-auto-exclude-notes", action="store_true")
    ap.add_argument("--min-doc-ratio", type=float, default=0.35)
    ap.add_argument("--max-ngrams-per-n", type=int, default=70)
    args = ap.parse_args()

    out = Path(args.work_dir).expanduser().resolve()
    out.mkdir(parents=True, exist_ok=True)
    analysis, samples, holdout = build_analysis(
        args.source,
        auto_exclude_notes=not args.no_auto_exclude_notes,
        min_doc_ratio=max(0.05, min(1.0, args.min_doc_ratio)),
        max_ngrams=max(10, args.max_ngrams_per_n),
    )
    (out / "analysis.json").write_text(json.dumps(analysis, ensure_ascii=False, indent=2), encoding="utf-8")
    (out / "samples.json").write_text(json.dumps(samples, ensure_ascii=False, indent=2), encoding="utf-8")
    (out / "holdout.json").write_text(json.dumps(holdout, ensure_ascii=False, indent=2), encoding="utf-8")
    template = deep_style_template(samples)
    (out / "deep-style.template.json").write_text(json.dumps(template, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"chapters={analysis['corpus']['chapters_used']} cjk_chars={analysis['corpus']['total_cjk_chars']}")
    print(f"exemplars={len(samples)} holdout={len(holdout)}")
    print(f"wrote {out / 'analysis.json'}")
    print(f"wrote {out / 'samples.json'}")
    print(f"wrote {out / 'holdout.json'}")
    print(f"wrote {out / 'deep-style.template.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
