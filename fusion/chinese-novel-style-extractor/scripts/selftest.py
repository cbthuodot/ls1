#!/usr/bin/env python3
"""End-to-end deterministic smoke test for the fused extractor."""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "scripts"


def run(*args: str) -> None:
    proc = subprocess.run([sys.executable, *args], text=True, capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError(f"command failed: {' '.join(args)}\n{proc.stdout}\n{proc.stderr}")


def main() -> int:
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        novel = td / "novel.txt"
        chapter_template = (
            "第{n}章 风起\n\n"
            "林舟站在院门前，看着天边一点一点亮起来。风从竹林里穿过，带着细碎的响声。\n\n"
            "“你还真来了？”苏晚抬眼看他。\n\n"
            "“都走到这里了，总不能现在回去。”林舟笑了一下，手却已经按在剑柄上。\n\n"
            "下一瞬，墙外骤然传来一声闷响。他猛地转身，短促地吸了口气。事情不对。\n\n"
            "他没有立刻冲出去，只在心里把刚才听见的动静重新过了一遍。太近，也太安静。\n\n"
        )
        chapters = []
        for i in range(1, 9):
            body = chapter_template.format(n=i)
            if i % 2 == 0:
                body += "\n“先别动。”苏晚压低声音，目光越过他的肩头，“外面有人。”\n"
            if i % 3 == 0:
                body += "\n风忽然停了。院墙后的树影一动不动，连虫鸣都像被什么掐断。\n"
            if i % 4 == 0:
                body += "\n林舟皱眉。要么是巧合，要么就是有人故意等他们开门。\n"
            if i % 5 == 0:
                body += "\n“现在怎么办？”\n“等。”\n"
            chapters.append(body)
        novel.write_text("\n".join(chapters), encoding="utf-8")
        work = td / "work"
        run(str(SCRIPTS / "analyze_corpus.py"), str(novel), "--work-dir", str(work))
        template = json.loads((work / "deep-style.template.json").read_text(encoding="utf-8"))
        sample_ids = template["source_sample_ids"]
        template["global_rules"] = [{"rule": "第三人称近距离叙事，判断与感受紧跟当前人物。", "evidence": sample_ids[:2], "confidence": 0.8}]
        template["avoid_rules"] = [{"rule": "避免连续大段解释人物已经通过行动表达的情绪。", "evidence": sample_ids[:1], "confidence": 0.7}]
        for scene in template["scene_profiles"]:
            template["scene_profiles"][scene]["rules"] = [{"rule": f"保持{scene}场景的原有句段节奏。", "evidence": sample_ids[:1], "confidence": 0.6}]
        deep = work / "deep-style.json"
        deep.write_text(json.dumps(template, ensure_ascii=False, indent=2), encoding="utf-8")
        bundle = td / "bundle"
        run(
            str(SCRIPTS / "build_bundle.py"),
            "--analysis", str(work / "analysis.json"),
            "--samples", str(work / "samples.json"),
            "--deep-style", str(deep),
            "--out", str(bundle),
        )
        run(str(SCRIPTS / "validate_bundle.py"), str(bundle))
        run(str(SCRIPTS / "score_draft.py"), str(novel), "--profile", str(bundle / "style-profile.json"), "--json")
    print("SELFTEST_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
