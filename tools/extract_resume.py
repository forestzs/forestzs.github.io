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

SECTION_HEADERS = [
    "SUMMARY",
    "EDUCATION",
    "EXPERIENCE",
    "PROJECTS",
    "TECHNICAL SKILLS",
    "SKILLS",
]

MONTH_RE = r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
DASH_RE = r"(?:-|\u2013|\u2014)"  # -, – , —
DATE_RANGE_RE = re.compile(rf"\b({MONTH_RE}\s*\d{{4}}\s*{DASH_RE}\s*{MONTH_RE}\s*\d{{4}})\b", re.IGNORECASE)

PHONE_RE = re.compile(r"(\+?\d[\d\-\s\(\)]{7,}\d)")
EMAIL_RE = re.compile(r"([A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,})", re.IGNORECASE)
URL_RE = re.compile(r"(https?://[^\s|]+)", re.IGNORECASE)

BULLET_RE = re.compile(r"^[■\-\*]\s*(.+)$")


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def write_json(path: str, obj: Dict) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def collapse_ws(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip()


def norm_key(s: str) -> str:
    return re.sub(r"[^A-Z0-9]+", "", (s or "").upper())


def normalize_bullets(s: str) -> str:
    if not s:
        return ""
    # normalize a bunch of bullet chars into ■
    for b in ["•", "◼", "◾", "▪", "●", "–", "—"]:
        s = s.replace(b, "■")
    return s


def unique_preserve(seq: List[str]) -> List[str]:
    seen = set()
    out = []
    for x in seq:
        t = collapse_ws(x)
        if not t:
            continue
        k = t.lower()
        if k in seen:
            continue
        seen.add(k)
        out.append(t)
    return out


# -----------------------------
# Extract text from DOCX (preferred)
# -----------------------------
def extract_lines_from_docx(docx_path: str) -> List[str]:
    """
    Returns a list of "lines" where bullet/list paragraphs become:
      '■ <text>'
    """
    from docx import Document  # python-docx

    doc = Document(docx_path)
    out: List[str] = []

    def para_is_list(p) -> bool:
        # most list paragraphs have numPr in pPr
        ppr = p._p.pPr
        if ppr is not None and ppr.numPr is not None:
            return True
        # fallback: style name contains List
        try:
            if p.style and p.style.name and "List" in p.style.name:
                return True
        except Exception:
            pass
        return False

    for p in doc.paragraphs:
        t = collapse_ws(normalize_bullets(p.text))
        if not t:
            continue

        # If it's already starting with bullet symbol, keep it as bullet line
        if t.startswith("■"):
            out.append(t if t.startswith("■ ") else ("■ " + t.lstrip("■").strip()))
            continue

        if para_is_list(p):
            out.append("■ " + t)
        else:
            out.append(t)

    return out


# -----------------------------
# Extract text from PDF (fallback)
# -----------------------------
def extract_text_pymupdf_words(pdf_path: str) -> str:
    import fitz  # PyMuPDF

    doc = fitz.open(pdf_path)
    all_lines: List[str] = []
    for page in doc:
        words = page.get_text("words")
        if not words:
            all_lines.append(page.get_text("text") or "")
            continue
        words.sort(key=lambda w: (w[5], w[6], w[1], w[0]))
        cur_key: Optional[Tuple[int, int]] = None
        cur_line: List[str] = []

        def flush():
            nonlocal cur_line
            if cur_line:
                all_lines.append(" ".join(cur_line).strip())
                cur_line = []

        for w in words:
            word = str(w[4]).strip()
            key = (int(w[5]), int(w[6]))
            if cur_key is None:
                cur_key = key
            if key != cur_key:
                flush()
                cur_key = key
            if word:
                cur_line.append(word)

        flush()
        all_lines.append("")
    return "\n".join(all_lines)


def extract_lines_from_pdf(pdf_path: str) -> List[str]:
    t = extract_text_pymupdf_words(pdf_path)
    t = normalize_bullets(t)
    # keep real newlines, then flatten later
    raw_lines = [collapse_ws(x) for x in t.split("\n")]
    return [x for x in raw_lines if x]


# -----------------------------
# Preprocess lines
# -----------------------------
SECTION_KEYS = set(norm_key(h) for h in SECTION_HEADERS)

HEADERS_SPLIT_RE = re.compile(
    r"\b(SUMMARY|EDUCATION|EXPERIENCE|PROJECTS|TECHNICAL\s+SKILLS|SKILLS)\b",
    re.IGNORECASE
)


def preprocess_lines(lines: List[str]) -> List[str]:
    out: List[str] = []
    for ln in lines:
        ln = collapse_ws(normalize_bullets(ln))
        if not ln:
            continue

        # split header when header + content in same line
        m = HEADERS_SPLIT_RE.search(ln)
        if m and norm_key(ln) not in SECTION_KEYS:
            header = m.group(1).upper().replace("  ", " ")
            before = ln[:m.start(1)].strip()
            after = ln[m.end(1):].strip()
            if before:
                out.append(before)
            out.append(header)
            if after:
                out.append(after)
            continue

        # If line contains multiple bullets in one line (mainly PDF), split them
        if "■" in ln and norm_key(ln) not in SECTION_KEYS and not ln.startswith("■"):
            parts = [p.strip() for p in ln.split("■")]
            if parts and parts[0]:
                out.append(parts[0])
            for p in parts[1:]:
                if p:
                    out.append("■ " + p)
            continue

        out.append(ln)

    # de-dup identical consecutive
    out2: List[str] = []
    prev = None
    for x in out:
        if x == prev:
            continue
        out2.append(x)
        prev = x
    return out2


# -----------------------------
# Section slicing
# -----------------------------
def is_header_line(line: str) -> bool:
    return norm_key(line) in SECTION_KEYS


def find_header_index(lines: List[str], header: str) -> int:
    target = norm_key(header)
    for i, ln in enumerate(lines):
        if norm_key(ln) == target:
            return i
    return -1


def slice_section(lines: List[str], header: str) -> List[str]:
    start = find_header_index(lines, header)
    if start < 0:
        return []
    end = len(lines)
    for j in range(start + 1, len(lines)):
        if is_header_line(lines[j]):
            end = j
            break
    return lines[start + 1: end]


# -----------------------------
# Parse blocks
# -----------------------------
def parse_name(lines: List[str]) -> str:
    return lines[0] if lines else ""


def parse_contact_line(lines: List[str]) -> Dict[str, str]:
    contact = {"phone": "", "email": "", "linkedin": "", "github": "", "location": ""}

    if len(lines) < 2:
        contact["github"] = DEFAULT_GITHUB
        return contact

    line = lines[1]
    parts = [p.strip() for p in line.split("|")]

    m = PHONE_RE.search(line)
    if m:
        contact["phone"] = collapse_ws(m.group(1))

    m = EMAIL_RE.search(line)
    if m:
        contact["email"] = collapse_ws(m.group(1))

    urls = URL_RE.findall(line)
    for u in urls:
        ul = u.lower()
        if "linkedin.com" in ul:
            contact["linkedin"] = u
        elif "github.com" in ul:
            contact["github"] = u

    # location: last part that isn't phone/email/url
    for p in reversed(parts):
        if not p:
            continue
        if EMAIL_RE.search(p):
            continue
        if URL_RE.search(p):
            continue
        if PHONE_RE.search(p) and len(p) <= 25:
            continue
        contact["location"] = collapse_ws(p)
        break

    if not contact["github"]:
        contact["github"] = DEFAULT_GITHUB

    return contact


def parse_summary(lines: List[str]) -> str:
    sec = slice_section(lines, "SUMMARY")
    if not sec:
        return ""
    return collapse_ws(" ".join(sec))


def parse_education(lines: List[str]) -> List[Dict[str, str]]:
    sec = slice_section(lines, "EDUCATION")
    if not sec:
        return []

    items: List[Dict[str, str]] = []
    cur_school = ""
    cur_degree = ""

    DEG_HINT = re.compile(r"\b(Master|Bachelor|PhD|B\.S\.|M\.S\.|B\.Eng|M\.Eng)\b", re.IGNORECASE)

    def push():
        nonlocal cur_school, cur_degree
        if collapse_ws(cur_school):
            items.append({"school": collapse_ws(cur_school), "degree": collapse_ws(cur_degree)})
        cur_school, cur_degree = "", ""

    for ln in sec:
        ln = collapse_ws(ln)
        if not ln:
            continue

        # heuristics: school line contains University/College or ends with CA etc
        if ("University" in ln) or ("College" in ln) or ("Institute" in ln) or ln.endswith(", CA"):
            # start new record
            if cur_school:
                push()
            cur_school = ln
            continue

        # degree line
        if DEG_HINT.search(ln) or re.search(r"\b\d{4}\b", ln):
            if not cur_school:
                # sometimes school line missing; treat as school
                cur_school = ln
            else:
                cur_degree = (cur_degree + " " + ln).strip()
            continue

        # fallback: append
        if cur_degree:
            cur_degree = (cur_degree + " " + ln).strip()
        else:
            # could be location line for school
            if cur_school:
                cur_school = (cur_school + " " + ln).strip()
            else:
                cur_school = ln

    push()
    # remove empty
    return [it for it in items if it["school"] or it["degree"]]


def split_project_header(line: str) -> Optional[Tuple[str, str]]:
    m = DATE_RANGE_RE.search(line)
    if not m:
        return None
    time = m.group(1).strip()
    title = line[:m.start(1)].strip(" -–—|")
    return (title, time)


def is_time_only(line: str) -> bool:
    line = collapse_ws(line)
    return bool(DATE_RANGE_RE.fullmatch(line))


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
        cur["bullets"] = [collapse_ws(b) for b in (cur.get("bullets") or []) if collapse_ws(str(b))]
        # filter garbage
        if cur.get("title") or cur.get("time") or cur.get("bullets"):
            projects.append(cur)
        cur = None

    for ln in sec:
        ln = collapse_ws(ln)
        if not ln:
            continue

        # header in one line: Title + Time
        tt = split_project_header(ln)
        if tt:
            push()
            title, time = tt
            cur = {"title": title, "time": time, "bullets": []}
            pending_title = None
            continue

        # title line (standalone)
        if cur is None and not ln.startswith("■") and not is_time_only(ln):
            pending_title = ln
            continue

        # time line (standalone)
        if cur is None and pending_title and is_time_only(ln):
            push()
            cur = {"title": pending_title, "time": ln, "bullets": []}
            pending_title = None
            continue

        # bullet
        bm = BULLET_RE.match(ln)
        if bm and cur is not None:
            cur["bullets"].append(bm.group(1))
            continue

        # continuation
        if cur is not None:
            if cur["bullets"]:
                cur["bullets"][-1] = (cur["bullets"][-1] + " " + ln).strip()
            else:
                # allow first non-bullet content as bullet
                cur["bullets"].append(ln)

    push()

    # final cleanup: drop entries with empty title AND bullets look like next project title
    cleaned = []
    for p in projects:
        title = collapse_ws(str(p.get("title", "")))
        if not title and p.get("bullets"):
            # if first bullet looks like a project title, move it into title
            b0 = collapse_ws(p["bullets"][0])
            if "Web App" in b0 or "App" in b0:
                p["title"] = b0
                p["bullets"] = p["bullets"][1:]
        cleaned.append(p)

    return cleaned


def split_csvish(s: str) -> List[str]:
    parts = re.split(r"[;,]", s)
    return [collapse_ws(p) for p in parts if collapse_ws(p)]


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
        return split_csvish(m.group(1) or "")

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
def build_structured(lines: List[str], source_name: str) -> Dict[str, object]:
    name = parse_name(lines) or "Zhengshu Zhang"
    contact = parse_contact_line(lines)
    summary = parse_summary(lines)
    education = parse_education(lines)
    projects = parse_projects(lines)
    skills = parse_skills(lines)

    return {
        "generated_at": iso_now(),
        "source": source_name,
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

    docx_path = os.path.join(repo_root, "resume.docx")
    pdf_path = os.path.join(repo_root, "resume.pdf")

    if os.path.exists(docx_path):
        raw_lines = extract_lines_from_docx(docx_path)
        source = "resume.docx"
    else:
        raw_lines = extract_lines_from_pdf(pdf_path)
        source = "resume.pdf"

    lines = preprocess_lines(raw_lines)

    # raw output: for debugging
    raw_out = {
        "generated_at": iso_now(),
        "source": source,
        "lines": lines,
    }

    structured = build_structured(lines, source)

    write_json(os.path.join(repo_root, "resume_raw.json"), raw_out)
    write_json(os.path.join(repo_root, "resume.json"), structured)

    print("✅ Generated resume_raw.json and resume.json")


if __name__ == "__main__":
    main()
