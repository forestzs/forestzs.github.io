#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from typing import List, Dict, Optional, Tuple

DEFAULT_GITHUB = "https://github.com/forestzs"
DEFAULT_SUBTITLE = "Software Engineer • USC MS Spatial Data Science • Los Angeles"


# -----------------------------
# Utils
# -----------------------------
def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def write_json(path: str, obj: Dict) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def normalize_text(text: str) -> str:
    if not text:
        return ""

    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Fix hyphenation across line breaks: "data-\nintensive" -> "data-intensive"
    text = re.sub(r"(\w)-\n(\w)", r"\1-\2", text)

    # Normalize bullets to ■
    for b in ["•", "◼", "◾", "▪", "●", "–", "—", "•"]:
        text = text.replace(b, "■")

    # Strip trailing spaces per line
    text = "\n".join([ln.rstrip() for ln in text.split("\n")])

    # Reduce multiple blank lines
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text


def collapse_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def lines_nonempty(text: str) -> List[str]:
    return [collapse_ws(ln) for ln in text.split("\n") if collapse_ws(ln)]


def norm_key(s: str) -> str:
    return re.sub(r"[^A-Z0-9]+", "", s.upper())


def unique_preserve(seq: List[str]) -> List[str]:
    seen = set()
    out = []
    for x in seq:
        t = x.strip()
        if not t:
            continue
        k = t.lower()
        if k in seen:
            continue
        seen.add(k)
        out.append(t)
    return out


# -----------------------------
# PDF extraction
# -----------------------------
def extract_text_pymupdf_words(pdf_path: str) -> str:
    """
    Most robust: use PyMuPDF words and rebuild lines with spaces.
    """
    import fitz  # PyMuPDF

    doc = fitz.open(pdf_path)
    all_lines: List[str] = []

    for page in doc:
        words = page.get_text("words")  # x0,y0,x1,y1,word,block,line,word_no
        if not words:
            all_lines.append(page.get_text("text") or "")
            continue

        # sort words top-to-bottom, left-to-right
        words.sort(key=lambda w: (w[5], w[6], w[1], w[0]))  # block,line,y,x

        cur_key: Optional[Tuple[int, int]] = None
        cur_line: List[str] = []

        def flush():
            nonlocal cur_line
            if cur_line:
                all_lines.append(" ".join(cur_line).strip())
                cur_line = []

        for w in words:
            word = str(w[4]).strip()
            block = int(w[5])
            line = int(w[6])
            key = (block, line)

            if cur_key is None:
                cur_key = key

            if key != cur_key:
                flush()
                cur_key = key

            if word:
                cur_line.append(word)

        flush()
        all_lines.append("")  # page sep

    return "\n".join(all_lines)


def extract_text_from_pdf(pdf_path: str) -> str:
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"Cannot find PDF: {pdf_path}")

    # 1) PyMuPDF words
    try:
        t = extract_text_pymupdf_words(pdf_path)
        if t and t.strip():
            return t
    except Exception:
        pass

    # 2) pdfplumber
    try:
        import pdfplumber
        chunks: List[str] = []
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                txt = page.extract_text(layout=True) or page.extract_text() or ""
                chunks.append(txt)
        t = "\n".join(chunks)
        if t and t.strip():
            return t
    except Exception:
        pass

    # 3) pypdf
    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        chunks = []
        for p in reader.pages:
            chunks.append(p.extract_text() or "")
        t = "\n".join(chunks)
        if t and t.strip():
            return t
    except Exception:
        pass

    return ""


# -----------------------------
# Preprocess lines (关键：拆标题/拆 bullets/清垃圾)
# -----------------------------
SECTION_HEADERS = [
    "SUMMARY",
    "EDUCATION",
    "EXPERIENCE",
    "PROJECTS",
    "TECHNICAL SKILLS",
    "SKILLS",
]
SECTION_KEYS = [norm_key(h) for h in SECTION_HEADERS]

HEADERS_SPLIT_RE = re.compile(
    r"\b(SUMMARY|EDUCATION|EXPERIENCE|PROJECTS|TECHNICAL\s+SKILLS|SKILLS)\b",
    re.IGNORECASE
)

PUNCT_ONLY_RE = re.compile(r"^[\)\(\]\[\{\}]+$")


def preprocess_lines(lines: List[str]) -> List[str]:
    out: List[str] = []
    for ln in lines:
        ln = collapse_ws(ln)
        if not ln:
            continue
        if PUNCT_ONLY_RE.match(ln):
            continue

        # 如果一行里出现多个 ■，拆开成多行（保留为 bullet 行）
        if "■" in ln and not ln.strip().upper() in SECTION_HEADERS:
            parts = [p.strip() for p in ln.split("■")]
            # 例： "abc ■ bullet1 ■ bullet2" -> "abc" + "■ bullet1" + "■ bullet2"
            if parts and parts[0]:
                out.append(parts[0])
            for p in parts[1:]:
                if p:
                    out.append("■ " + p)
            continue

        # 拆标题：比如 "SUMMARY xxx" -> "SUMMARY" + "xxx"
        m = HEADERS_SPLIT_RE.search(ln)
        if m and ln.strip().upper() not in SECTION_HEADERS:
            # 只在“标题不是整行”的情况下拆
            header = m.group(1)
            # 找到 header 的位置
            start = m.start(1)
            end = m.end(1)
            before = ln[:start].strip()
            after = ln[end:].strip()

            if before:
                out.append(before)
            out.append(header.upper().replace("  ", " "))
            if after:
                out.append(after)
            continue

        out.append(ln)

    # 再做一遍：去掉完全空 / 重复
    out2: List[str] = []
    prev = None
    for x in out:
        x = collapse_ws(x)
        if not x or PUNCT_ONLY_RE.match(x):
            continue
        if prev == x:
            continue
        out2.append(x)
        prev = x

    return out2


# -----------------------------
# Section slicing
# -----------------------------
def is_any_header_line(line: str) -> bool:
    k = norm_key(line)
    return k in SECTION_KEYS


def find_header_index(lines: List[str], header: str) -> int:
    target = norm_key(header)
    for idx, ln in enumerate(lines):
        if norm_key(ln) == target:
            return idx
    return -1


def slice_section(lines: List[str], header: str) -> List[str]:
    start = find_header_index(lines, header)
    if start < 0:
        return []
    end = len(lines)
    for j in range(start + 1, len(lines)):
        if is_any_header_line(lines[j]):
            end = j
            break
    return lines[start + 1: end]


# -----------------------------
# Parse basics
# -----------------------------
PHONE_RE = re.compile(r"(\+?\d[\d\-\s\(\)]{7,}\d)")
EMAIL_RE = re.compile(r"([A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,})", re.IGNORECASE)
URL_RE = re.compile(r"(https?://[^\s|]+)", re.IGNORECASE)

MONTH_RE = r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
DATE_RANGE_RE = re.compile(rf"({MONTH_RE}\s*\d{{4}}\s*[-–]\s*{MONTH_RE}\s*\d{{4}})", re.IGNORECASE)
MONTH_YEAR_RE = re.compile(rf"^{MONTH_RE}\s*\d{{4}}", re.IGNORECASE)


def parse_name(lines: List[str]) -> str:
    return lines[0].strip() if lines else ""


def parse_contact_line(lines: List[str]) -> Dict[str, str]:
    contact = {"phone": "", "email": "", "linkedin": "", "github": "", "location": ""}

    if len(lines) < 2:
        contact["github"] = DEFAULT_GITHUB
        return contact

    line = lines[1]
    parts = [p.strip() for p in line.split("|")]

    m = PHONE_RE.search(line)
    if m:
        contact["phone"] = m.group(1).strip()

    m = EMAIL_RE.search(line)
    if m:
        contact["email"] = m.group(1).strip()

    urls = URL_RE.findall(line)
    for u in urls:
        ul = u.lower()
        if "linkedin.com" in ul:
            contact["linkedin"] = u.strip()
        elif "github.com" in ul:
            contact["github"] = u.strip()

    # location: pick last part that isn't phone/email/url
    for p in reversed(parts):
        if not p:
            continue
        if EMAIL_RE.search(p):
            continue
        if URL_RE.search(p):
            continue
        if PHONE_RE.search(p) and len(p) <= 25:
            continue
        contact["location"] = p
        break

    if not contact["github"]:
        contact["github"] = DEFAULT_GITHUB

    return contact


def parse_summary(lines: List[str]) -> str:
    sec = slice_section(lines, "SUMMARY")
    if not sec:
        return ""
    txt = collapse_ws(" ".join(sec))

    # 防止 summary 混入教育/项目（兜底）
    txt = re.split(r"\b(University of|EDUCATION|PROJECTS|TECHNICAL SKILLS|SKILLS)\b", txt, flags=re.IGNORECASE)[0].strip()
    return txt


# -----------------------------
# Education (合并 location 行)
# -----------------------------
LOC_RE = re.compile(r".+,\s*[A-Z]{2}\b")  # Los Angeles, CA
def looks_like_location_line(s: str) -> bool:
    if LOC_RE.match(s):
        return True
    # 例如 Ya’an, SiChuan
    if "," in s and len(s) <= 28 and not DATE_RANGE_RE.search(s):
        return True
    return False


def parse_education(lines: List[str]) -> List[Dict[str, str]]:
    sec = slice_section(lines, "EDUCATION")
    if not sec:
        return []

    # 先把 “学校 + location” 拼成一行
    merged: List[str] = []
    for ln in sec:
        if not merged:
            merged.append(ln)
            continue
        if looks_like_location_line(ln) and not merged[-1].endswith(","):
            merged[-1] = merged[-1] + " " + ln
        else:
            merged.append(ln)

    items: List[Dict[str, str]] = []
    i = 0
    while i < len(merged):
        school = merged[i].strip()
        degree = merged[i + 1].strip() if i + 1 < len(merged) else ""
        # 跳过明显垃圾
        if PUNCT_ONLY_RE.match(school) or school in [")", "("]:
            i += 1
            continue
        if school:
            items.append({"school": school, "degree": degree})
        i += 2

    return items


# -----------------------------
# Projects (支持 title/time 分行 + bullets 拆分)
# -----------------------------
BULLET_RE = re.compile(r"^[■\-\*]\s*(.+)$")


def extract_time_and_title(line: str) -> Optional[Tuple[str, str]]:
    """
    Return (title, time) if line contains a date range and has some title text before it.
    """
    m = DATE_RANGE_RE.search(line)
    if not m:
        return None
    time = m.group(1).strip()
    title = line[:m.start(1)].strip(" -–—|")
    return (title, time)


def is_time_only_line(line: str) -> bool:
    line = line.strip()
    if DATE_RANGE_RE.fullmatch(line):
        return True
    # 有些 PDF 会变成 "May 2025-June 2025" 没空格，这里放宽
    if MONTH_YEAR_RE.match(line) and re.search(r"\d{4}.*[-–].*\d{4}", line):
        return True
    return False


def parse_projects(lines: List[str]) -> List[Dict[str, object]]:
    sec = slice_section(lines, "PROJECTS")
    if not sec:
        return []

    projects: List[Dict[str, object]] = []
    cur: Optional[Dict[str, object]] = None
    pending_title: Optional[str] = None

    def push():
        nonlocal cur
        if not cur:
            return
        bullets = cur.get("bullets", [])
        if isinstance(bullets, list):
            cur["bullets"] = [collapse_ws(b) for b in bullets if collapse_ws(str(b))]
        # 丢掉 title/time 都空的垃圾
        if cur.get("title") or cur.get("time") or cur.get("bullets"):
            projects.append(cur)
        cur = None

    for ln in sec:
        ln = ln.strip()

        # 可能是 "Food ... July 2024-Aug 2024" 在同一行
        tt = extract_time_and_title(ln)
        if tt:
            push()
            title, time = tt
            cur = {"title": title, "time": time, "bullets": []}
            pending_title = None
            continue

        # 可能是 “标题一行，时间下一行”
        if cur is None and not ln.startswith("■") and not is_time_only_line(ln):
            # 暂存可能的 title
            pending_title = ln
            continue

        if cur is None and pending_title and is_time_only_line(ln):
            push()
            cur = {"title": pending_title, "time": ln, "bullets": []}
            pending_title = None
            continue

        # bullets
        bm = BULLET_RE.match(ln)
        if bm and cur is not None:
            cur["bullets"].append(bm.group(1).strip())
            continue

        # 如果 pending_title 存着，但又遇到不是时间的行，说明 pending_title 不是项目名，落回去
        if cur is None and pending_title and not is_time_only_line(ln):
            # 把 pending_title 丢弃（一般是两栏错位导致的）
            pending_title = None

        # continuation lines (wrap)
        if cur is not None:
            if cur["bullets"]:
                cur["bullets"][-1] = (cur["bullets"][-1] + " " + ln).strip()
            else:
                # 允许没有 bullet 的第一行补充
                cur["bullets"].append(ln)

    push()
    return projects


# -----------------------------
# Skills
# -----------------------------
def split_csvish(s: str) -> List[str]:
    parts = re.split(r"[;,]", s)
    return [p.strip() for p in parts if p.strip()]


def parse_skills(lines: List[str]) -> Dict[str, List[str]]:
    sec = slice_section(lines, "TECHNICAL SKILLS")
    if not sec:
        sec = slice_section(lines, "SKILLS")
    if not sec:
        return {"languages": [], "frameworks": [], "tools": []}

    text = "\n".join(sec)

    def grab(label_pattern: str) -> List[str]:
        pat = rf"(?:^|\n)\s*[■\-\*]?\s*(?:{label_pattern})\s*:\s*([^\n]+)"
        m = re.search(pat, text, flags=re.IGNORECASE)
        if not m:
            return []
        val = (m.group(1) or "").strip()
        return split_csvish(val) if val else []

    languages = grab(r"Languages?")
    frameworks = grab(r"Frameworks\s*&\s*Libraries|Frameworks\s*/\s*Libraries|Frameworks|Libraries")
    db = grab(r"Databases\s*&\s*Cach(?:e|ing)|Databases|Database")
    cloud = grab(r"Cloud\s*&\s*DevOps|Cloud|DevOps")
    tools_testing = grab(r"Tools\s*&\s*Testing|Tools|Testing")

    tools = unique_preserve(db + cloud + tools_testing)

    return {
        "languages": unique_preserve(languages),
        "frameworks": unique_preserve(frameworks),
        "tools": tools,
    }


# -----------------------------
# Build output
# -----------------------------
def build_structured(raw_text: str) -> Dict[str, object]:
    ln = preprocess_lines(lines_nonempty(raw_text))

    name = parse_name(ln) or "Zhengshu Zhang"
    contact = parse_contact_line(ln)
    summary = parse_summary(ln)
    education = parse_education(ln)
    projects = parse_projects(ln)
    skills = parse_skills(ln)

    return {
        "generated_at": iso_now(),
        "source": "resume.pdf",
        "name": name,
        "subtitle": DEFAULT_SUBTITLE,
        "summary": summary,
        "resumeUrl": "./resume.pdf",
        "contact": contact,
        "education": education,
        "projects": projects,
        "skills": skills,
    }


def main() -> None:
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    pdf_path = os.path.join(repo_root, "resume.pdf")

    raw = extract_text_from_pdf(pdf_path)
    raw = normalize_text(raw)

    raw_out = {"generated_at": iso_now(), "source": "resume.pdf", "text": raw}
    structured = build_structured(raw)

    write_json(os.path.join(repo_root, "resume_raw.json"), raw_out)
    write_json(os.path.join(repo_root, "resume.json"), structured)

    print("✅ Generated resume_raw.json and resume.json")


if __name__ == "__main__":
    main()
