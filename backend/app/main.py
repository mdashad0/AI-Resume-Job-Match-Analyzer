import os
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.models.schemas import (
    MatchAnalysisResponse,
    TextAnalysisRequest,
    ResumeParseResponse,
    DatabaseStatusResponse,
    SampleDataResponse
)
from app.services.parser import (
    extract_text_from_pdf_bytes,
    clean_extracted_text,
    parse_resume_sections
)
from app.services.nlp_matcher import (
    analyze_resume_job_match,
    extract_skills_from_text
)
from app.services.database import db_manager
from app.data.sample_resumes import SAMPLE_RESUMES
from app.data.sample_jobs import SAMPLE_JOBS

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="FastAPI Backend for AI-Powered Resume & Job Match Analyzer using TF-IDF, NLP Skill Extraction, and MongoDB"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", response_model=DatabaseStatusResponse)
def health_check():
    """Returns system status and MongoDB connectivity."""
    db_status = db_manager.get_status()
    return DatabaseStatusResponse(**db_status)

@app.get("/api/sample-data", response_model=SampleDataResponse)
def get_sample_data():
    """Provides pre-loaded sample resumes and job requisitions for immediate testing."""
    return SampleDataResponse(
        resumes=SAMPLE_RESUMES,
        jobs=SAMPLE_JOBS
    )

@app.post("/api/analyze", response_model=MatchAnalysisResponse)
async def analyze_match(
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    job_description: str = Form(...),
    candidate_name: Optional[str] = Form("Candidate"),
    job_title: Optional[str] = Form("Target Role")
):
    """
    Accepts either an uploaded resume file (PDF or TXT) OR pasted raw text,
    along with the job description. Calculates TF-IDF cosine similarity,
    skill alignment, and persists the analysis in MongoDB.
    """
    extracted_resume_text = ""
    
    if file and file.filename:
        content_bytes = await file.read()
        filename_lower = file.filename.lower()
        
        if filename_lower.endswith(".pdf"):
            try:
                extracted_resume_text = extract_text_from_pdf_bytes(content_bytes)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Could not parse PDF resume: {str(e)}"
                )
        else:
            # Fallback treat as plain text / markdown
            try:
                extracted_resume_text = content_bytes.decode("utf-8", errors="ignore")
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Could not decode text file: {str(e)}"
                )
    elif resume_text:
        extracted_resume_text = resume_text.strip()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either an uploaded resume file or resume_text must be provided."
        )

    extracted_resume_text = clean_extracted_text(extracted_resume_text)
    job_description = clean_extracted_text(job_description)

    if len(extracted_resume_text) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Extracted resume text is too short to analyze."
        )

    if len(job_description) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text is too short to analyze."
        )

    # Perform NLP Skill Extraction, TF-IDF Vectorization, and Cosine Similarity
    analysis_result = analyze_resume_job_match(extracted_resume_text, job_description)
    
    record = {
        "candidate_name": candidate_name or "Candidate",
        "job_title": job_title or "Target Role",
        "overall_score": analysis_result["overall_score"],
        "skill_match_score": analysis_result["skill_match_score"],
        "tfidf_similarity_score": analysis_result["tfidf_similarity_score"],
        "total_job_skills_found": analysis_result["total_job_skills_found"],
        "total_resume_skills_found": analysis_result["total_resume_skills_found"],
        "matched_skills": analysis_result["matched_skills"],
        "missing_skills": analysis_result["missing_skills"],
        "bonus_skills": analysis_result["bonus_skills"],
        "top_resume_keywords": analysis_result["top_resume_keywords"],
        "top_job_keywords": analysis_result["top_job_keywords"],
        "ats_readability_score": analysis_result["ats_readability_score"],
        "strengths": analysis_result["strengths"],
        "recommendations": analysis_result["recommendations"]
    }

    # Persist in MongoDB or fallback storage
    record_id = db_manager.save_analysis(record)
    record["id"] = record_id

    return MatchAnalysisResponse(**record)

@app.post("/api/analyze-json", response_model=MatchAnalysisResponse)
def analyze_match_json(payload: TextAnalysisRequest):
    """
    JSON endpoint for direct programmatic integration without form-data.
    """
    cleaned_resume = clean_extracted_text(payload.resume_text)
    cleaned_job = clean_extracted_text(payload.job_description)

    analysis_result = analyze_resume_job_match(cleaned_resume, cleaned_job)

    record = {
        "candidate_name": payload.candidate_name or "Candidate",
        "job_title": payload.job_title or "Target Role",
        "overall_score": analysis_result["overall_score"],
        "skill_match_score": analysis_result["skill_match_score"],
        "tfidf_similarity_score": analysis_result["tfidf_similarity_score"],
        "total_job_skills_found": analysis_result["total_job_skills_found"],
        "total_resume_skills_found": analysis_result["total_resume_skills_found"],
        "matched_skills": analysis_result["matched_skills"],
        "missing_skills": analysis_result["missing_skills"],
        "bonus_skills": analysis_result["bonus_skills"],
        "top_resume_keywords": analysis_result["top_resume_keywords"],
        "top_job_keywords": analysis_result["top_job_keywords"],
        "ats_readability_score": analysis_result["ats_readability_score"],
        "strengths": analysis_result["strengths"],
        "recommendations": analysis_result["recommendations"]
    }

    record_id = db_manager.save_analysis(record)
    record["id"] = record_id

    return MatchAnalysisResponse(**record)

@app.post("/api/parse-resume", response_model=ResumeParseResponse)
async def parse_resume_endpoint(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None)
):
    """Parses a resume to extract raw text, detected sections, and identified skills."""
    extracted = ""
    if file and file.filename:
        bytes_data = await file.read()
        if file.filename.lower().endswith(".pdf"):
            extracted = extract_text_from_pdf_bytes(bytes_data)
        else:
            extracted = bytes_data.decode("utf-8", errors="ignore")
    elif raw_text:
        extracted = raw_text

    cleaned = clean_extracted_text(extracted)
    sections = parse_resume_sections(cleaned)
    skills = extract_skills_from_text(cleaned)

    return ResumeParseResponse(
        raw_text=cleaned,
        word_count=len(cleaned.split()),
        detected_sections=sections,
        extracted_skills=skills
    )

@app.get("/api/history")
def get_history(limit: int = 15):
    """Retrieves previous match analyses."""
    return db_manager.get_recent_analyses(limit=limit)

@app.get("/api/history/{analysis_id}")
def get_history_item(analysis_id: str):
    """Retrieves a single match analysis by ID."""
    item = db_manager.get_analysis_by_id(analysis_id)
    if not item:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    return item

@app.delete("/api/history")
def clear_history():
    """Clears history."""
    db_manager.clear_history()
    return {"message": "History cleared successfully."}

# Mount static frontend build if present
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
