#!/usr/bin/env python3
"""Portable corpus loading and Chinese-novel segmentation utilities."""
from __future__ import annotations

import io
import re
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET

SUPPORTED = {".txt", ".md", ".markdown", ".docx"}
CJK_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff]")
CHAPTER_RE = re.compile(
    r"^\s*(?:#{1,6}\s*)?(?:"
    r"第[零〇一二三四五六七八九十百千万两0-9０-９]+[章节卷回篇部]"
    r"(?:[\s　:：、.-].*)?|"
    r"(?:chapter|part)\sk[0-9ivxlcdm]+(?:\s*[:：.-].*)?"
    r")\s*$",
    re.IGNORECASE,
)
NOTE_HEADING_RE = re.compile(
    r"^\s*(?:#{1,6}\s*)?(?:"
    r"世界观(?:设定)?|背景设定|人物设定|角色设定|角色表|人物表|"
    r"大纲|剧情大纲|故事大纲|后续大纲|情节构想|剧情构想|随笔构想|"
    r"作者备注|写作备注|备注|资料|素材|灵感|废稿|设定集|补充设定|"
    r"下面是.*(?:构想|设定|大纲).*"
    r")[：:]?\s*$",
    re.IGNORECASE,
)


@dataclass
class Document:
    source: str
    text: str

    def metadata(self) -> dict:
        return {
            "source": self.source,
            "chars": len(self.text),
            "cjk_chars": cjk_len(self.text),
        }


@dataclass
class Chapter:
    chapter_id: str
    title: str
    source: str
    text: str
    ordinal: int
    virtual: bool = False

    def metadata(self) -> dict:
        return {
            "chapter_id": self.chapter_id,
            "title": self.title,
            "source": self.source,
            "ordinal": self.ordinal,
            "virtual": self.virtual,
            "cjk_chars": cjk_len(self.text),
        }


def cjk_len(text: str) -> int:
    return len(CJK_RE.findall(text or ""))


def decode_bytes(raw: bytes) -> str:
    for enc in ("utf-8-sig", "utf-8", "gb18030", "big5", "cp936"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            pass
    return raw.decode("utf-8", errors="replace")


def read_docx_bytes(raw: bytes) -> str:
    """Extract paragraph text from DOCX with stdlib only."""
    with zipfile.ZipFile(io.BytesIO(raw)) as zf:
        xml = zf.read("word/document.xml")
    root = ET.fromstring(xml)
    ns = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    out: list[str] = []
    for p in root.iter(ns + "p"):
        parts = [node.text or "" for node in p.iter(ns + "t")]
        text = "".join(parts).strip()
        if text:
            out.append(text)
    return "\n".join(out)


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\ufeff", "")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{4,}", "\n\n\n", text)
    return text.strip()


def read_path(path: Path) -> Document:
    raw = path.read_bytes()
    if path.suffix.lower() == ".docx":
        text = read_docx_bytes(raw)
    else:
        text = decode_bytes(raw)
    return Document(source=str(path), text=normalize_text(text))


def read_zip(path: Path) -> list[Document]:
    docs: list[Document] = []
    with zipfile.ZipFile(path) as zf:
        for name in sorted(zf.namelist()):
            if name.endswith("/"):
                continue
            suffix = Path(name).suffix.lower()
            if suffix not in SUPPORTED:
                continue
            raw = zf.read(name)
            try:
                text = read_docx_bytes(raw) if suffix == ".docx" else decode_bytes(raw)
            except Exception:
                continue
            text = normalize_text(text)
            if cjk_len(text) >= 100:
                docs.append(Document(source=f"{path}!{name}", text=text))
    return docs


def load_corpus(source: str | Path) -> list[Document]:
    path = Path(source).expanduser().resolve()
    if not path.exists():
        raise FileNotFoundError(path)
    if path.is_file() and path.suffix.lower() == ".zip":
        docs = read_zip(path)
    elif path.is_file():
        if path.suffix.lower() not in SUPPORTED:
            raise ValueError(f"Unsupported input type: {path.suffix}")
        docs = [read_path(path)]
    else:
        docs = []
        for p in sorted(path.rglob("*")):
            if p.is_file() and p.suffix.lower() in SUPPORTED:
                try:
                    doc = read_path(p)
                except Exception:
                    continue
                if cjk_len(doc.text) >= 100:
                    docs.append(doc)
    if not docs:
        raise ValueError("No readable TXT/MD/DOCX text found")
    return docs


def split_fiction_and_notes(text: str, auto_exclude_notes: bool = True) -> tuple[str, str | None]:
    """Cut standalone planning/setting notes after substantial fiction prose.

    The cut is intentionally conservative: the marker must occupy a short line and
    occur after at least 2,000 CJK characters. The excluded tail is returned so an
    agent can inspect it rather than silently losing data.
    """
    if not auto_exclude_notes:
        return text, None
    lines = text.splitlines()
    seen_cjk = 0
    offsets: list[int] = []
    cursor = 0
    for line in lines:
        offsets.append(cursor)
        cursor += len(line) + 1
    for idx, line in enumerate(lines):
        stripped = line.strip()
        if 0 < len(stripped) <= 36 and NOTE_HEADING_RE.match(stripped) and seen_cjk >= 2000:
            cut = offsets[idx]
            return text[:cut].rstrip(), text[cut:].lstrip()
        seen_cjk += cjk_len(line)
    return text, None


def _virtual_chunks(text: str, source: str, target_cjk: int = 5000) -> list[Chapter]:
    paras = [p.strip() for p in re.split(r"\n\s*\n|\n", text) if p.strip()]
    chunks: list[Chapter] = []
    buf: list[str] = []
    size = 0
    ordinal = 1
    for p in paras:
        plen = cjk_len(p)
        if buf and size + plen > target_cjk and size >= target_cjk * 0.65:
            body = "\n\n".join(buf).strip()
            chunks.append(Chapter(f"virtual-{ordinal:04d}", f"虚拟分段 {ordinal}", source, body, ordinal, True))
            ordinal += 1
            buf, size = [], 0
        buf.append(p)
        size += plen
    if buf:
        body = "\n\n".join(buf).strip()
        if cjk_len(body) >= 200:
            chunks.append(Chapter(f"virtual-{ordinal:04d}", f"虚拟分段 {ordinal}", source, body, ordinal, True))
    return chunks


def split_chapters(text: str, source: str = "corpus") -> list[Chapter]:
    lines = text.splitlines()
    starts: list[tuple[int, str]] = []
    for idx, line in enumerate(lines):
        stripped = line.strip()
        if stripped and len(stripped) <= 80 and CHAPTER_RE.match(stripped):
            starts.append((idx, re.sub(r"^#{1,6}\s*", "", stripped)))
    if not starts:
        return _virtual_chunks(text, source)
    chapters: list[Chapter] = []
    # Ignore a short preface before the first chapter; preserve a substantial one.
    if starts[0][0] > 0:
        pre = "\n".join(lines[: starts[0][0]]).strip()
        if cjk_len(pre) >= 600:
            chapters.append(Chapter "preface", "正文前段", source, pre, 0, False))
    for pos, (start, title) in enumerate(starts):
        end = starts[pos + 1][0] if pos + 1 < len(starts) else len(lines)
        body = "\n".join(lines[start:end]).strip()
        if cjk_len(body) < 80:
            continue
        ordinal = len(chapters) + 1
        chapters.append(Chapter(f"chapter-{ordinal:04d}", title, source, body, ordinal, False))
    return chapters or _virtual_chunks(text, source)


def prepare_chapters(docs: Iterable[Document], auto_exclude_notes: bool = True) -> tuple[list[Chapter], list[dict]]:
    chapters: list[Chapter] = []
    exclusions: list[dict] = []
    for doc in docs:
        fiction, notes = split_fiction_and_notes(doc.text, auto_exclude_notes=auto_exclude_notes)
        local = split_chapters(fiction, doc.source)
        # Make IDs globally unique across files.
        for ch in local:
            ch.chapter_id = f"doc{len(exclusions)+1}-{ch.chapter_id}"
            chapters.append(ch)
        if notes:
            exclusions.append({
                "source": doc.source,
                "reason": "standalone setting/outline/notes heading detected after fiction prose",
                "excluded_cjk_chars": cjk_len(notes),
                "preview": notes[:400],
            })
        else:
            exclusions.append({"source": doc.source, "reason": None, "excluded_cjk_chars": 0})
    # Reassign a stable global ordinal.
    for idx, ch in enumerate(chapters, 1):
        ch.ordinal = idx
    return chapters, exclusions
