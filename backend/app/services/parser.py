import io
import re
from pypdf import PdfReader

SECTION_PATTERNS = {
    "summary": re.compile(r"^(professional\s+summary|profile|about\s+me|summary|objective)", re.IGNORECASE),
    "experience": re.compile(r"^(work\s+experience|professional\s+experience|experience|employment\s+history)", re.IGNORECASE),
    "education": re.compile(r"^(education|academic\s+background|qualifications|academic\s+history)", re.IGNORECASE),
    "skills": re.compile(r"^(skills|technical\s+skills|core\s+competencies|technologies|tools)", re.IGNORECASE),
    "projects": re.compile(r"^(projects|personal\s+projects|featured\s+projects|key\s+projects)", re.IGNORECASE),
    "certifications": re.compile(r"^(certifications|certificates|licenses|courses)", re.IGNORECASE),
}

def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    """Extracts raw text from PDF bytes using pypdf."""
    reader = PdfReader(io.BytesIO(file_bytes))
    extracted_text = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            extracted_text.append(text)
    return "\n".join(extracted_text).strip()

def clean_extracted_text(text: str) -> str:
    """Normalizes whitespace and removes odd artifacts."""
    if not text:
        return ""
    # Normalize newline variations
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Replace multiple continuous blank lines with two
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Replace multiple horizontal spaces with single space
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()

def parse_resume_sections(text: str) -> dict[str, str]:
    """
    Parses resume text into common sections based on header patterns.
    """
    lines = text.split("\n")
    sections: dict[str, list[str]] = {
        "header": [],
        "summary": [],
        "experience": [],
        "education": [],
        "skills": [],
        "projects": [],
        "certifications": [],
        "other": []
    }
    
    current_section = "header"
    
    for line in lines:
        cleaned_line = line.strip()
        if not cleaned_line:
            continue
            
        matched_section = None
        # Headers are usually short
        if len(cleaned_line) < 45:
            for section_key, pattern in SECTION_PATTERNS.items():
                if pattern.search(cleaned_line):
                    matched_section = section_key
                    break
                    
        if matched_section:
            current_section = matched_section
        else:
            sections[current_section].append(cleaned_line)
            
    return {k: "\n".join(v).strip() for k, v in sections.items() if v}
