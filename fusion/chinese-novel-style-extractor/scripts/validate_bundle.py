#!/usr/bin/env python3
"""Validate the structure and minimum evidence of a generated style_bundle."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

SCENES = ("dialogue", "action", "emotion", "scenery", "narration", "high_tension")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("bundle")
    args = ap.parse_args()
    root = Path(args.bundle)
    errors: list[str] = []
    required = ["manifest.json", "style-profile.json", "global-style.md", "avoid-style.md", "loader-contract.md"]
    for name in required:
        if not (root / name).is_file():
            errors.append(f"missing {name}")
    for scene in SCENES:
        if not (root / "scenes" / f"{scene}.md").is_file():
            errors.append(f"missing scenes/{scene}.md")
        if not (root / "exemplars" / f"{scene}.md").is_file():
            errors.append(f"missing exemplars/{scene}.md")
    try:
        profile = json.loads((root / "style-profile.json").read_text(encoding="utf-8"))
        if profile.get("schema_version") != "2.0":
            errors.append("unexpected style-profile schema_version")
        dm = profile.get("distance_model", {})
        if len(dm.get("feature_stats", {})) < 20:
            errors.append("too few stable features for quantitative diagnostics")
        chapters = int(profile.get("corpus", {}).get("chapters_used", 0))
        if chapters < 2:
            errors.append("fewer than two chapter documents")
    except Exception as exc:
        errors.append(f"invalid style-profile.json: {exc}")
    if errors:
        print("BUNDLE_INVALID")
        for error in errors:
            print(f"- {error}")
        return 1
    print("BUNDLE_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
