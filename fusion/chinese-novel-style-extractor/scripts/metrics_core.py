#!/usr/bin/env python3
"""Chinese-fiction stylometric features, stable-feature culling, and Delta diagnostics."""
from __future__ import annotations

import math
import re
import statistics
from collections import Counter, defaultdict
from dataclasses import dataclass
from typing import Iterable

from corpus_io import Chapter, cjk_len

CJK_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff]")
CJK_RUN_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff]+")
SENTENCE_RE = re.compile(r".*?(?:……+|……|[。！？!?]+[”’」』】]?|$)", re.S)
QUOTE_PATTERNS = [
    re.compile(r"“(.*?)”", re.S),
    re.compile(r"「(.*?)」", re.S),
    re.compile(r"『(.*?)』", re.S),
]
PUNCTUATION = ("，", "。", "！", "？", "；", "：", "、", "…", "—", "“", "”")

# Adapted from the MIT-licensed Chinese function-word list in jnoecker/mowen,
# with novel-oriented additions/removals. See references/upstream-provenance.md.
FUNCTION_WORDS = tuple(dict.fromkeys("""
的 了 在 是 有 和 就 不 都 也 而 到 要 你 他 她 它 会 着 没有 这 那 让 没 吧 去 又 把 能 吗 对 从 来 所
他们 她们 它们 如果 但是 因为 所以 虽然 可是 或者 那么 什么 怎么 为什么 这样 那样 已经 正在 将要 还是 而且
不过 然后 于是 因此 只是 只有 除了 关于 通过 根据 按照 由于 对于 至于 为了 以 被 比 跟 向 往 给 及 与 或 且
却 便 才 仍 并 并且 甚至 既然 即使 尽管 无论 只要 除非 直到 同时 随后 然而
""".split()))

MARKERS = {
    "psychology": ("心中", "心里", "心想", "暗想", "意识到", "不由得", "忍不住", "念头", "觉得", "感觉"),
    "speech": ("说道", "问道", "答道", "笑道", "冷声", "低声", "沉声", "喝道", "开口", "喃喃"),
    "action": ("猛地", "骤然", "倏地", "一把", "抬手", "转身", "后退", "冲", "扑", "掠", "斩", "砸", "撞", "闪"),
    "scenery": ("夜色", "月光", "阳光", "云", "天空", "风", "雨", "雪", "山", "河", "湖", "街", "殿", "院", "林"),
    "transition": ("片刻后", "半晌", "与此同时", "另一边", "次日", "翌日", "不久后", "就在这时", "然而", "随后"),
    "comparison": ("仿佛", "似乎", "宛如", "好像", "如同", "恍若", "犹如", "宛若"),
}


def percentile(values: list[float], q: float) -> float:
    if not values:
        return 0.0
    xs = sorted(float(x) for x in values)
    if len(xs) == 1:
        return xs[0]
    pos = (len(xs) - 1) * q
    lo = math.floor(pos)
    hi = math.ceil(pos)
    if lo == hi:
        return xs[lo]
    return xs[lo] * (hi - pos) + xs[hi] * (pos - lo)


def distribution(values: Iterable[float]) -> dict:
    xs = [float(x) for x in values]
    if not xs:
        return {"n": 0, "mean": 0.0, "std": 0.0, "p10": 0.0, "p25": 0.0, "p50": 0.0, "p75": 0.0, "p90": 0.0, "min": 0.0, "max": 0.0}
    return {
        "n": len(xs),
        "mean": round(statistics.mean(xs), 6),
        "std": round(statistics.pstdev(xs) if len(xs) > 1 else 0.0, 6),
        "p10": round(percentile(xs, 0.10), 6),
        "p25": round(percentile(xs, 0.25), 6),
        "p50": round(percentile(xs, 0.50), 6),
        "p75": round(percentile(xs, 0.75), 6),
        "p90": round(percentile(xs, 0.90), 6),
        "min": round(min(xs), 6),
        "max": round(max(xs), 6),
    }


def paragraphs(text: str) -> list[str]:
    return [p.strip() for p in re.split(r"\n\s*\n|\n", text) if p.strip() and cjk_len(p) >= 2]


def sentences(text: str) -> list[str]:
    out: list[str] = []
    for raw in SENTENCE_RE.findall(text):
        s = raw.strip()
        if cjk_len(s) >= 2:
            out.append(s)
    return out


def quote_segments(text: str) -> list[str]:
    spans: list[tuple[int, int, str]] = []
    for pat in QUOTE_PATTERNS:
        for m in pat.finditer(text):
            spans.append((m.start(), m.end(), m.group(1)))
    spans.sort(key=lambda x: x[0])
    out: list[str] = []
    last = -1
    for start, end, inner in spans:
        if start < last:
            continue
        out.append(inner)
        last = end
    return out


def per10k(count: float, chars: int) -> float:
    return (float(count) / max(chars, 1)) * 10000.0


def mattr_chars(text: str, window: int = 200) -> float:
    chars = CJK_RE.findall(text)
    if not chars:
        return 0.0
    if len(chars) <= window:
        return len(set(chars)) / len(chars)
    # Use a stride to keep very long corpora cheap while preserving a stable estimate.
    stride = max(1, window // 5)
    vals = []
    for start in range(0, len(chars) - window + 1, stride):
        chunk = chars[start : start + window]
        vals.append(len(set(chunk)) / window)
    return statistics.mean(vals) if vals else 0.0


def _count_word(text: str, word: str) -> int:
    return text.count(word)


def base_metrics(text: str) -> dict[str, float]:
    chars = cjk_len(text)
    ps = paragraphs(text)
    ss = sentences(text)
    s_lens = [cjk_len(s) for s in ss]
    p_lens = [cjk_len(p) for p in ps]
    quote_chars = sum(cjk_len(q) for q in quote_segments(text))
    dialogue_ps = sum(1 for p in ps if quote_segments(p))
    sentence_counts = [len(sentences(p)) for p in ps]

    out: dict[str, float] = {
        "cjk_chars": float(chars),
        "sentence_len_mean": statistics.mean(s_lens) if s_lens else 0.0,
        "sentence_len_median": statistics.median(s_lens) if s_lens else 0.0,
        "sentence_len_std": statistics.pstdev(s_lens) if len(s_lens) > 1 else 0.0,
        "short_sentence_rate": (sum(1 for n in s_lens if n <= 8) / len(s_lens)) if s_lens else 0.0,
        "long_sentence_rate": (sum(1 for n in s_lens if n >= 30) / len(s_lens)) if s_lens else 0.0,
        "paragraph_len_mean": statistics.mean(p_lens) if p_lens else 0.0,
        "paragraph_len_median": statistics.median(p_lens) if p_lens else 0.0,
        "one_sentence_paragraph_rate": (sum(1 for n in sentence_counts if n == 1) / len(ps)) if ps else 0.0,
        "very_short_paragraph_rate": (sum(1 for n in p_lens if n <= 20) / len(ps)) if ps else 0.0,
        "dialogue_char_ratio": quote_chars / max(chars, 1),
        "dialogue_paragraph_ratio": dialogue_ps / max(len(ps), 1),
        "char_mattr_200": mattr_chars(text),
    }
    for mark in PUNCTUATION:
        out[f"punct:{mark}"] = per10k(text.count(mark), chars)
    for word in FUNCTION_WORDS:
        out[f"fw:{word}"] = per10k(_count_word(text, word), chars)
    for group, terms in MARKERS.items():
        out[f"marker:{group}"] = per10k(sum(text.count(t) for t in terms), chars)
    return out


def char_ngram_counts(text: str, n: int) -> Counter[str]:
    counter: Counter[str] = Counter()
    for run in CJK_RUN_RE.findall(text):
        if len(run) < n:
            continue
        counter.update(run[i : i + n] for i in range(len(run) - n + 1))
    return counter


def _ngram_rates(text: str, grams: Iterable[str]) -> dict[str, float]:
    chars = cjk_len(text)
    by_n: dict[int, list[str]] = defaultdict(list)
    for gram in grams:
        by_n[len(gram)].append(gram)
    out: dict[str, float] = {}
    for n, wanted in by_n.items():
        counts = char_ngram_counts(text, n)
        for gram in wanted:
            out[f"ng{n}:{gram}"] = per10k(counts.get(gram, 0), chars)
    return out


def select_stable_ngrams(
    texts: list[str],
    n_values: tuple[int, ...] = (2, 3, 4),
    min_doc_ratio: float = 0.35,
    max_features_per_n: int = 70,
    max_doc_share: float = 0.58,
) -> dict[str, list[str]]:
    """Select frequent, cross-document n-grams while suppressing topic leakage.

    A feature must occur across a meaningful share of chapters. Features dominated by
    one chapter are removed. This follows the culling principle used by stylo/Mowen,
    adapted for a single-author long novel.
    """
    doc_counts = len(texts)
    result: dict[str, list[str]] = {}
    if doc_counts == 0:
        return result
    for n in n_values:
        counts_by_doc = [char_ngram_counts(t, n) for t in texts]
        total: Counter[str] = Counter()
        presence: Counter[str] = Counter()
        for c in counts_by_doc:
            total.update(c)
            presence.update(c.keys())
        candidates: list[tuple[float, str]] = []
        for gram, total_count in total.items():
            coverage = presence[gram] / doc_counts
            if coverage < min_doc_ratio or total_count < max(3, doc_counts // 2):
                continue
            vals = [c.get(gram, 0) for c in counts_by_doc]
            top_share = max(vals) / max(sum(vals), 1)
            if doc_counts >= 5 and top_share > max_doc_share:
                continue
            mean = statistics.mean(vals)
            std = statistics.pstdev(vals) if len(vals) > 1 else 0.0
            cv = std / mean if mean > 0 else 99.0
            # Favor high coverage and frequency, penalize extreme document concentration.
            score = (coverage * math.log1p(total_count)) / (1.0 + min(cv, 4.0) * 0.25)
            candidates.append((score, gram))
        candidates.sort(key=lambda x: (-x[0], x[1]))
        result[str(n)] = [gram for _, gram in candidates[:max_features_per_n]]
    return result


def vectorize(text: str, ngrams: dict[str, list[str]] | None = None) -> dict[str, float]:
    vec = base_metrics(text)
    if ngrams:
        grams = [g for values in ngrams.values() for g in values]
        vec.update(_ngram_rates(text, grams))
    # cjk_chars is evidence, not a style dimension.
    vec.pop("cjk_chars", None)
    return vec


def feature_stats(vectors: list[dict[str, float]], min_std: float = 1e-9) -> dict[str, dict[str, float]]:
    if not vectors:
        return {}
    keys = sorted(set.intersection(*(set(v.keys()) for v in vectors))) if vectors else []
    out: dict[str, dict[str, float]] = {}
    for key in keys:
        vals = [float(v[key]) for v in vectors]
        mean = statistics.mean(vals)
        std = statistics.pstdev(vals) if len(vals) > 1 else 0.0
        if std <= min_std:
            continue
        out[key] = {"mean": mean, "std": std, **distribution(vals)}
    return out


def burrows_delta(vector: dict[str, float], stats: dict[str, dict[str, float]], keys: Iterable[str] | None = None) -> float:
    use = list(keys) if keys is not None else list(stats.keys())
    vals: list[float] = []
    for key in use:
        st = stats.get(key)
        if not st or st.get("std", 0.0) <= 0:
            continue
        actual = float(vector.get(key, 0.0))
        vals.append(abs((actual - st["mean"]) / st["std"]))
    return statistics.mean(vals) if vals else 0.0


def eder_delta(vector: dict[str, float], stats: dict[str, dict[str, float]], feature_order: list[str]) -> float:
    """Eder-style reverse-rank weighting over standardized absolute differences."""
    n = len(feature_order)
    if n == 0:
        return 0.0
    weighted = []
    weights = []
    for idx, key in enumerate(feature_order):
        st = stats.get(key)
        if not st or st.get("std", 0.0) <= 0:
            continue
        z = abs((float(vector.get(key, 0.0)) - st["mean"]) / st["std"])
        weight = (1.0 + (n - idx)) / n
        weighted.append(z * weight)
        weights.append(weight)
    return sum(weighted) / max(sum(weights), 1e-9)


def leave_one_out_deltas(vectors: list[dict[str, float]], max_features: int = 360) -> list[float]:
    if len(vectors) < 3:
        return []
    results: list[float] = []
    for i, vec in enumerate(vectors):
        train = vectors[:i] + vectors[i + 1 :]
        stats = feature_stats(train)
        # Stable scalar + selected n-gram features; limit huge sparse tails.
        keys = sorted(stats, key=lambda k: (0 if not k.startswith("ng") else 1, -stats[k]["mean"]))[:max_features]
        results.append(burrows_delta(vec, stats, keys))
    return results


def top_deviations(vector: dict[str, float], stats: dict[str, dict[str, float]], limit: int = 12) -> list[dict]:
    rows: list[dict] = []
    for key, st in stats.items():
        if st.get("std", 0.0) <= 0:
            continue
        actual = float(vector.get(key, 0.0))
        z = (actual - st["mean"]) / st["std"]
        rows.append({
            "feature": key,
            "actual": round(actual, 6),
            "target_mean": round(st["mean"], 6),
            "z": round(z, 4),
            "direction": "high" if z > 0 else "low",
        })
    rows.sort(key=lambda r: abs(r["z"]), reverse=True)
    return rows[:limit]


