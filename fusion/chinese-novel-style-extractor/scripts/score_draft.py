#!/usr/bin/env python3
"""Diagnose a draft against a style bundle using standardized chapter-level features."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from corpus_io import load_corpus, cjk_len
from features import burrows_delta, top_deviations, vectorize


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("draft")
    ap.add_argument("--profile", required=True, help="style_bundle/style-profile.json")
    ap.add_argument("--json", action="store_true", dest="as_json")
    args = ap.parse_args()

    profile = json.loads(Path(args.profile).read_text(encoding="utf-8"))
    ngrams = profile.get("stable_ngrams", {})
    docs = load_corpus(args.draft)
    text = "\n\n".join(d.text for d in docs)
    chars = cjk_len(text)
    vec = vectorize(text, ngrams)
    model_name = "window" if chars <= 1500 and profile.get("window_distance_model", {}).get("feature_stats") else "chapter"
    model = profile.get("window_distance_model", {}) if model_name == "window" else profile.get("distance_model", {})
    stats = model.get("feature_stats", {})
    keys = sorted(stats, key=lambda k: (0 if not k.startswith("ng") else 1, -float(stats[k].get("mean", 0.0))))[:360]
    distance = burrows_delta(vec, stats, keys)
    baseline = model.get("leave_one_out_delta", {})
    p90 = float(baseline.get("p90", 0.0) or 0.0)
    ratio = distance / p90 if p90 > 1e-9 else None

    if chars < 500:
        confidence = "low"
    elif chars < 1500:
        confidence = "medium"
    else:
        confidence = "high"
    if ratio is None:
        verdict = "insufficient-baseline"
    elif confidence == "low":
        verdict = "insufficient-text"
    elif ratio <= 1.0:
        verdict = "within-corpus-range"
    elif ratio <= 1.35:
        verdict = "review"
    else:
        verdict = "outside-corpus-range"

    result = {
        "verdict": verdict,
        "confidence": confidence,
        "evidence_cjk_chars": chars,
        "calibration_level": model_name,
        "burrows_delta": round(distance, 6),
        "corpus_p90_delta": round(p90, 6),
        "distance_ratio_to_p90": round(ratio, 6) if ratio is not None else None,
        "largest_deviations": top_deviations(vec, stats, limit=12),
        "note": "Diagnostic similarity only; narrative stance, scene rules, and plot consistency still require literary review.",
    }
    if args.as_json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"verdict={verdict} confidence={confidence} chars={chars}")
        print(f"delta={distance:.4f} corpus_p90={p90:.4f} ratio={ratio if ratio is not None else 'n/a'}")
        for row in result["largest_deviations"]:
            print(f"- {row['feature']}: z={row['z']} ({row['direction']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
