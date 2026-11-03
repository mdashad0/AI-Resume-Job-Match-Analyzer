from pydantic import BaseModel, Field
from typing import Optional, Any

class SkillItem(BaseModel):
    name: str
    category: str
    canonical: str

class KeywordScore(BaseModel):
    term: str
    score: float

class MatchAnalysisResponse(BaseModel):
    id: Optional[str] = None
    candidate_name: Optional[str] = "Candidate"
    job_title: Optional[str] = "Target Role"
    overall_score: float = Field(..., description="Weighted composite match percentage (0-100)")
    skill_match_score: float = Field(..., description="Direct skill overlap percentage (0-100)")
    tfidf_similarity_score: float = Field(..., description="TF-IDF Cosine Similarity percentage (0-100)")
    total_job_skills_found: int
    total_resume_skills_found: int
    matched_skills: list[SkillItem]
    missing_skills: list[SkillItem]
    bonus_skills: list[SkillItem]
    top_resume_keywords: list[KeywordScore]
    top_job_keywords: list[KeywordScore]
    ats_readability_score: int
    strengths: list[str]
    recommendations: list[str]
    created_at: Optional[str] = None

class TextAnalysisRequest(BaseModel):
    resume_text: str = Field(..., min_length=20, description="Raw or parsed text of candidate's resume")
    job_description: str = Field(..., min_length=20, description="Full job description text")
    candidate_name: Optional[str] = "Candidate"
    job_title: Optional[str] = "Target Role"

class ResumeParseResponse(BaseModel):
    raw_text: str
    word_count: int
    detected_sections: dict[str, str]
    extracted_skills: list[SkillItem]

class DatabaseStatusResponse(BaseModel):
    mode: str
    connected: bool
    database_name: Optional[str] = None
    fallback_file: Optional[str] = None

class SampleDataResponse(BaseModel):
    resumes: list[dict[str, Any]]
    jobs: list[dict[str, Any]]
