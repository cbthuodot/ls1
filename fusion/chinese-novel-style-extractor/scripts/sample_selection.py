#!/usr/bin/env python3
"""Scene routing, representative exemplar selection, and independent holdout selection."""
from __future__ import annotations

from dataclasses import dataclass

from corpus_io import Chapter, cjk_len
from metrics_core import CJK_RE, MARKERS, burrows_delta, paragraphs, percentile, quote_segments, sentences, vectorize


def scene_scores(text: str) -> dict[str, float]:
    chars = max(cjk_len(text), 1)
    ss = sentences(text)
    lens = [cjk_len(s) for s in ss] or [chars]
    short_rate = sum(1 for n in lens if n <= 10) / len(lens)
    quoted = sum(cjk_len(q) for q in quote_segments(text)) / chars
    burst = sum(text.count(ch) for ch in ("！", "？", "!", "?")) / chars * 1000.0

    def hits(group: str) -> float:
        return sum(text.count(w) for w in MARKERS[group]) / chars * 1000.0

    return {
        "dialogue": quoted * 10.0 + hits("speech") * 0.8,
        "action": hits("action") * 1.25 + short_rate * 2.0 + burst * 0.12,
        "emotion": hits("psychology") * 1.25 + hits("comparison") * 0.25,
        "scenery": hits("scenery") * 1.1 + hits("comparison") * 0.25,
        "narration": max(0.0, 2.5 - quoted * 4.0) + hits("transition") * 0.45,
        "high_tension": short_rate * 3.2 + burst * 0.28 + hits("action") * 0.55,
    }


def chunk_chapter(chapter: Chapter, min_chars: int = 260, max_chars: int = 720) -> list[str]:
    ps = paragraphs(chapter.text)
    chunks: list[str] = []
    buf: list[str] = []
    size = 0
    for p in ps:
        plen = cjk_len(p)
        if buf and size + plen > max_chars and size >= min_chars:
            chunks.append("\n\n".join(buf).strip())
            buf, size = [], 0
        if plen > max_chars:
            for s in sentences(p):
                slen = cjk_len(s)
                if buf and size + slen > max_chars and size >= min_chars:
                    chunks.append("\n\n".join(buf).strip())
                    buf, size = [], 0
                buf.append(s)
                size += slen
            continue
        buf.append(p)
        size += plen
    if buf and size >= max(100, min_chars // 2):
        chunks.append("\n\n".join(buf).strip())
    return chunks


def _char3_set(text: str) -> set[str]:
    chars = "".join(CJK_RE.findall(text))
    return {chars[i : i + 3] for i in range(max(0, len(chars) - 2))}


def jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / max(len(a | b), 1)


@dataclass
class SampleCandidate:
    sample_id: str
    category: str
    chapter_id: str
    chapter_title: str
    text: str
    scene_score: float
    typicality: float
    scalar_delta: float

    def as_dict(self) -> dict:
        return {
            "sample_id": self.sample_id,
            "category": self.category,
            "chapter_id": self.chapter_id,
            "chapter_title": self.chapter_title,
            "scene_score": round(self.scene_score, 5),
            "typicality": round(self.typicality, 5),
            "scalar_delta": round(self.scalar_delta, 5),
            "cjk_chars": cjk_len(self.text),
            "text": self.text,
        }


def select_samples(
    chapters: list[Chapter],
    scalar_stats: dict[str, dict[str, float]],
    per_category: int = 5,
    holdout_per_category: int = 1,
) -> tuple[list[dict], list[dict]]:
    categories = ("dialogue", "action", "emotion", "scenery", "narration", "high_tension")
    pools: dict[str, list[SampleCandidate]] = {c: [] for c in categories}
    counter = 0
    scalar_keys = [k for k in scalar_stats if not k.startswith("fw:") and not k.startswith("punct:")][:30]
    for ch in chapters:
        for chunk in chunk_chapter(ch):
            counter += 1
            vec = vectorize(chunk, None)
            d = burrows_delta(vec, scalar_stats, scalar_keys)
            typicality = 1.0 / (1.0 + d)
            scores = scene_scores(chunk)
            for category in categories:
                pools[category].append(SampleCandidate(
                    sample_id=f"s{counter:05d}-{category}",
                    category=category,
                    chapter_id=ch.chapter_id,
                    chapter_title=ch.title,
                    text=chunk,
                    scene_score=scores[category],
                    typicality=typicality,
                    scalar_delta=d,
                ))

    exemplars: list[dict] = []
    holdout: list[dict] = []
    used_texts: list[set[str]] = []
    used_ids: set[str] = set()
    for category in categories:
        rows = pools[category]
        if not rows:
            continue
        scene_values = [r.scene_score for r in rows]
        p60 = percentile(scene_values, 0.60)
        candidates = [r for r in rows if r.scene_score >= p60]
        candidates.sort(key=lambda r: (-(r.scene_score * 0.65 + r.typicality * 2.0), r.chapter_id, r.sample_id))
        selected: list[SampleCandidate] = []
        for row in candidates:
            grams = _char3_set(row.text)
            if row.sample_id in used_ids:
                continue
            if any(jaccard(grams, old) > 0.58 for old in used_texts):
                continue
            if sum(1 for s in selected if s.chapter_id == row.chapter_id) >= 1:
                continue
            selected.append(row)
            used_ids.add(row.sample_id)
            used_texts.append(grams)
            if len(selected) >= per_category:
                break
        exemplars.extend(r.as_dict() for r in selected)

        rest = [r for r in rows if r.sample_id not in used_ids]
        rest.sort(key=lambda r: (r.scalar_delta, -r.scene_score, r.chapter_id))
        held: list[SampleCandidate] = []
        held_chapters: set[str] = set()
        for row in rest:
            if row.chapter_id in held_chapters:
                continue
            grams = _char3_set(row.text)
            if any(jaccard(grams, old) > 0.58 for old in used_texts):
                continue
            held.append(row)
            held_chapters.add(row.chapter_id)
            used_ids.add(row.sample_id)
            used_texts.append(grams)
            if len(held) >= holdout_per_category:
                break
        holdout.extend(r.as_dict() for r in held)
    return exemplars, holdout
