# tools/extract_resume.py
# Extract text from resume.pdf -> resume_raw.json
# Parse text -> resume.json (structured) for your website

import json
import re
from datetime import datetime, timezone
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "resume.pdf"
RAW_JSON = ROOT / "resume_raw.json"
OUT_JSON = ROOT / "resume.json"


MONTHS = [
    "jan", "january", "feb", "february", "mar", "march", "apr", "april",
    "may", "jun", "june", "jul", "july", "aug", "august",
    "sep", "sept", "september", "oct", "october", "nov", "november", "dec", "december"
]

BULLET_PREFIXES = ("■", "◼", "•", "-", "–", "—")


def extract_pdf_text(pdf_path: Path) -> str:
    if not pdf_path.exists():
        raise FileNotFoundError(f"Cannot find {pdf_path}")
    parts = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            txt = page.extract_text() or ""
            parts.append(txt)
    text = "\n".join(parts)
    # normalize
    text = text.replace("\u00a0", " ")
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text


def find_heading(lines, heading: str):
    h = heading.strip().upper()
    for idx, ln in enumerate(lines):
        if ln.strip().upper() == h:
            return idx
    return None


def clean_school_line(s: str) -> str:
    # Remove trailing "City, ST" if present
    s = s.strip()
    s = re.sub(r"\s+[A-Za-z .’'-]+,\s*[A-Z]{2}\s*$", "", s).strip()
    return s


def extract_name_time(header: str):
    # Best-effort: split by first month word occurrence (e.g. "July 2024-Aug 2024")
    low = header.lower()
    best = None
    for m in MONTHS:
        pos = low.find(m)
        if pos != -1:
            if best is None or pos < best:
                best = pos
    if best is not None and best > 0:
        name = header[:best].strip(" -–—\t")
        time = header[best:].strip()
        return name, time

    # fallback: split around last year
    m = re.search(r"(.*?)(\b(19|20)\d{2}\b.*)$", header)
    if m:
        name = m.group(1).strip(" -–—\t")
        time = m.group(2).strip()
        return name, time

    return header.strip(), ""


def parse_resume(text: str) -> dict:
    lines = [ln.strip() for ln in text.splitlines()]
    lines = [ln for ln in lines if ln != ""]

    # name: first line
    name = lines[0] if lines else "Your Name"

    # contact: try second line with pipes
    phone = ""
    email = ""
    linkedin = ""
    location = ""

    for ln in lines[1:5]:
        if "|" in ln:
            parts = [p.strip() for p in ln.split("|")]
            for p in parts:
                if re.search(r"\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b", p) or p.startswith("+"):
                    phone = p
                elif "@" in p:
                    email = p
                elif "linkedin.com" in p:
                    linkedin = p
                else:
                    # last chunk often is location
                    location = p
            break

    # headings
    idx_sum = find_heading(lines, "SUMMARY")
    idx_edu = find_heading(lines, "EDUCATION")
    idx_proj = find_heading(lines, "PROJECTS")
    idx_skill = find_heading(lines, "TECHNICAL SKILLS")

    def block(a, b):
        if a is None:
            return []
        start = a + 1
        end = b if b is not None else len(lines)
        return lines[start:end]

    summary_lines = block(idx_sum, idx_edu) if idx_sum is not None else []
    summary = " ".join(summary_lines).strip()

    # education: pairs
    edu_lines = block(idx_edu, idx_proj) if idx_edu is not None else []
    education = []
    i = 0
    while i < len(edu_lines):
        school_line = edu_lines[i].strip()
        degree_line = edu_lines[i + 1].strip() if i + 1 < len(edu_lines) else ""
        # stop if accidentally hit next heading
        if school_line.upper() in ("PROJECTS", "TECHNICAL SKILLS"):
            break
        if degree_line.upper() in ("PROJECTS", "TECHNICAL SKILLS"):
            degree_line = ""

        school = clean_school_line(school_line)
        degree = degree_line

        if school:
            education.append({"school": school, "degree": degree})
        i += 2

        if len(education) >= 4:
            break

    # projects
    proj_lines = block(idx_proj, idx_skill) if idx_proj is not None else []
    projects = []
    cur = None

    def flush():
        nonlocal cur
        if cur:
            # remove empty bullets
            cur["bullets"] = [b for b in cur.get("bullets", []) if b.strip()]
            projects.append(cur)
        cur = None

    for ln in proj_lines:
        if not ln:
            continue

        is_bullet = ln.startswith(BULLET_PREFIXES)
        has_year = bool(re.search(r"\b(19|20)\d{2}\b", ln))

        if (not is_bullet) and has_year:
            # new project header
            flush()
            name2, time2 = extract_name_time(ln)
            cur = {"name": name2, "time": time2, "bullets": []}
            continue

        # bullet line
        if is_bullet and cur:
            b = ln.lstrip("".join(BULLET_PREFIXES)).strip()
            cur["bullets"].append(b)
        else:
            # sometimes PDF extraction breaks bullets into continuation lines
            if cur and cur["bullets"]:
                cur["bullets"][-1] = (cur["bullets"][-1] + " " + ln).strip()

    flush()

    # skills
    skills_lines = block(idx_skill, None) if idx_skill is not None else []
    languages = []
    frameworks = []
    tools = []

    def split_list(s: str):
        return [x.strip() for x in s.split(",") if x.strip()]

    db = []
    cloud = []
    test_tools = []

    for ln in skills_lines:
        ln = ln.strip()
        ln = ln.lstrip("".join(BULLET_PREFIXES)).strip()
        if ":" not in ln:
            continue
        k, v = ln.split(":", 1)
        k = k.strip().lower()
        v = v.strip()

        if "language" in k:
            languages = split_list(v)
        elif "framework" in k or "libraries" in k or "library" in k:
            frameworks = split_list(v)
        elif "database" in k or "caching" in k:
            db = split_list(v)
        elif "cloud" in k or "devops" in k:
            cloud = split_list(v)
        elif "tools" in k or "testing" in k:
            test_tools = split_list(v)

    # front-end "tools" bucket = db + cloud + tools/testing
    tools = db + cloud + test_tools

    # subtitle: you can keep it stable (or parse more later)
    subtitle = "Software Engineer • USC MS Spatial Data Science • Los Angeles"

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "resume.pdf",
        "name": name,
        "subtitle": subtitle,
        "summary": summary,
        "resumeUrl": "./resume.pdf",
        "contact": {
            "phone": phone,
            "email": email,
            "linkedin": linkedin,
            "github": "https://github.com/forestzs",
            "location": location,
        },
        "education": education[:2],
        "projects": projects[:4],
        "skills": {
            "languages": languages,
            "frameworks": frameworks,
            "tools": tools,
        },
    }


def main():
    text = extract_pdf_text(PDF_PATH)

    RAW_JSON.write_text(
        json.dumps(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "source": "resume.pdf",
                "text": text,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    structured = parse_resume(text)
    OUT_JSON.write_text(json.dumps(structured, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
