#!/usr/bin/env python3
"""Compile deterministic evidence + agent-authored deep-style JSON into a style_bundle."""
from __future__ import annotations

import argparse
import json
import shutil
from collections import defaultdict
from pathlib import Path
from typing import Any

SCENES = ("dialogue", "action", "emotion", "scenery", "narration", "high_tension")
SCENE_TITLES = {
    "dialogue": "对白场景",
    "action": "动作/战斗场景",
    "emotion": "情绪/心理场景",
    "scenery": "景物/空间场景",
    "narration": "普通叙事场景",
    "high_tension": "高压/高潮场景",
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def rule_text(rule: Any) -> str:
    if isinstance(rule, str):
        return rule.strip()
    if isinstance(rule, dict):
        return str(rule.get("rule") or rule.get("text") or "").strip()
    return ""


def format_rule(rule: Any) -> str:
    text = rule_text(rule)
    if not text:
        return ""
    if isinstance(rule, dict):
        confidence = rule.get("confidence")
        evidence = rule.get("evidence") or rule.get("evidence_ids")
        tail = []
        if confidence is not None:
            tail.append(f"置信度 {confidence}")
        if isinstance(evidence, list) and evidence:
            tail.append("证据 " + ", ".join(str(x) for x in evidence[:5]))
        if tail:
            return f"- {text}（{'；'.join(tail)}）"
    return f"- {text}"


def write_rule_doc(path: Path, title: str, rules: list, intro: str = "") -> None:
    lines = [f"# {title}", ""]
    if intro:
        lines.extend([intro, ""])
    rendered = [format_rule(r) for r in rules]
    rendered = [x for x in rendered if x]
    lines.extend(rendered or ["- 暂无可靠规则；续写时以全局规则和原文范例为准。"])
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")




def validate_deep_style_evidence(deep: dict, sample_ids: set[str]) -> None:
    errors: list[str] = []

    def check_rules(label: str, rules: object) -> None:
        if not isinstance(rules, list):
            return
        for idx, rule in enumerate(rules):
            if not isinstance(rule, dict):
                continue
            evidence = rule.get("evidence") or rule.get("evidence_ids") or []
            if not isinstance(evidence, list):
                errors.append(f"{label}[{idx}] evidence must be a list")
                continue
            for sample_id in evidence:
                if sample_id not in sample_ids:
                    errors.append(f"{label}[{idx}] references unavailable sample: {sample_id}")

    check_rules("global_rules", deep.get("global_rules", []))
    check_rules("avoid_rules", deep.get("avoid_rules", []))
    scenes = deep.get("scene_profiles", {})
    if isinstance(scenes, dict):
        for scene, payload in scenes.items():
            if isinstance(payload, dict):
                check_rules(f"scene_profiles.{scene}.rules", payload.get("rules", []))

    approved = deep.get("approved_exemplars", {})
    if isinstance(approved, dict):
        for scene, ids in approved.items():
            if not isinstance(ids, list):
                errors.append(f"approved_exemplars.{scene} must be a list")
                continue
            for sample_id in ids:
                if sample_id not in sample_ids:
                    errors.append(f"approved_exemplars.{scene} references unavailable sample: {sample_id}")

    if errors:
        raise ValueError("Invalid deep-style evidence:\n- " + "\n- ".join(errors))

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--analysis", required=True)
    ap.add_argument("--samples", required=True)
    ap.add_argument("--deep-style", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    analysis_path = Path(args.analysis)
    samples_path = Path(args.samples)
    deep_path = Path(args.deep_style)
    analysis = load_json(analysis_path)
    samples = load_json(samples_path)
    deep = load_json(deep_path)
    available_sample_ids = {item.get("sample_id") for item in samples if isinstance(item, dict) and item.get("sample_id")}
    validate_deep_style_evidence(deep, available_sample_ids)
    out = Path(args.out).expanduser().resolve()
    if out.exists():
        shutil.rmtree(out)
    (out / "scenes").mkdir(parents=True)
    (out / "exemplars").mkdir(parents=True)

    global_rules = deep.get("global_rules", []) if isinstance(deep, dict) else []
    avoid_rules = deep.get("avoid_rules", []) if isinstance(deep, dict) else []
    explicit = deep.get("explicit_user_rules", []) if isinstance(deep, dict) else []
    # Explicit author rules outrank inferred rules.
    combined_global = list(explicit) + list(global_rules)
    write_rule_doc(
        out / "global-style.md",
        "全局文风规则",
        combined_global,
        "续写时始终加载。显式作者规则优先于统计推断；有冲突时以显式规则为准。",
    )
    write_rule_doc(
        out / "avoid-style.md",
        "避免项与纠偏规则",
        avoid_rules,
        "生成后用于检查。不要为了命中统计值而牺牲剧情、人物一致性或自然语言。",
    )

    grouped: dict[str, list[dict]] = defaultdict(list)
    for sample in samples:
        if isinstance(sample, dict) and sample.get("category") in SCENES:
            grouped[sample["category"]].append(sample)

    scene_profiles = deep.get("scene_profiles", {}) if isinstance(deep, dict) else {}
    approved = deep.get("approved_exemplars", {}) if isinstance(deep, dict) else {}
    sample_by_id = {item.get("sample_id"): item for item in samples if isinstance(item, dict) and item.get("sample_id")}
    for scene in SCENES:
        profile = scene_profiles.get(scene, {}) if isinstance(scene_profiles, dict) else {}
        rules = profile.get("rules", []) if isinstance(profile, dict) else []
        write_rule_doc(
            out / "scenes" / f"{scene}.md",
            SCENE_TITLES[scene],
            rules,
            "只在当前续写主要属于该场景时加载。",
        )
        lines = [f"# {SCENE_TITLES[scene]}原文范例", "", "以下范例用于学习节奏与结构，不要续写或复述范例内容。", ""]
        selected_ids = approved.get(scene, []) if isinstance(approved, dict) else []
        selected = [sample_by_id[sid] for sid in selected_ids if sid in sample_by_id]
        if not selected:
            selected = grouped.get(scene, [])[:5]
        for item in selected[:5]:
            lines.extend([
                f"## {item.get('sample_id')} · {item.get('chapter_title','')}",
                "",
                item.get("text", "").strip(),
                "",
            ])
        (out / "exemplars" / f"{scene}.md").write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")

    distance_model = analysis.get("distance_model", {})
    profile = {
        "schema_version": "2.0",
        "corpus": analysis.get("corpus", {}),
        "metric_distributions": analysis.get("metric_distributions", {}),
        "stable_ngrams": analysis.get("stable_ngrams", {}),
        "distance_model": distance_model,
        "window_distance_model": analysis.get("window_distance_model", {}),
        "qualitative": deep,
    }
    (out / "style-profile.json").write_text(json.dumps(profile, ensure_ascii=False, indent=2), encoding="utf-8")

    manifest = {
        "schema_version": "2.0",
        "load_order": ["global-style.md", "scenes/<scene>.md", "exemplars/<scene>.md", "avoid-style.md"],
        "scenes": list(SCENES),
        "notes": [
            "Always load global-style.md.",
            "Load only the active scene rule file and 1 matching exemplar file during normal continuation.",
            "Use style-profile.json for scoring/diagnosis, not as routine prompt context.",
        ],
    }
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    (out / "loader-contract.md").write_text(
        "# 续写 Skill 加载约定\n\n"
        "1. 固定加载 `global-style.md`。\n"
        "2. 判断当前主要场景，只加载一个 `scenes/<scene>.md`。\n"
        "3. 同时加载对应 `exemplars/<scene>.md`，优先选 2–3 个范例。\n"
        "4. 完成草稿后加载 `avoid-style.md` 做纠偏。\n"
        "5. `style-profile.json` 仅用于诊断和定量评分，不要每次全文塞入提示词。\n"
        "6. 剧情事实、人物状态、世界观约束与文风规则冲突时，事实一致性优先。\n",
        encoding="utf-8",
    )
    print(f"built {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
