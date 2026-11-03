"""
Verification test suite for AI Resume Matcher backend services.
"""
import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(__file__))

from app.services.skills_db import get_all_skills_flat, get_skill_category
from app.services.nlp_matcher import extract_skills_from_text, calculate_tfidf_similarity, analyze_resume_job_match
from app.services.parser import clean_extracted_text, parse_resume_sections
from app.data.sample_resumes import SAMPLE_RESUMES
from app.data.sample_jobs import SAMPLE_JOBS
from app.services.database import db_manager

def test_skills_extraction():
    print("Testing skill extraction...")
    text = "Experienced in Python, FastAPI, React.js, Docker, Kubernetes, and MongoDB with CI/CD."
    skills = extract_skills_from_text(text)
    names = [s["canonical"] for s in skills]
    print(f"Extracted skills: {names}")
    assert "python" in names, "Python should be detected"
    assert "fastapi" in names, "FastAPI should be detected"
    assert "react" in names, "React should be detected (canonicalized from react.js)"
    assert "docker" in names, "Docker should be detected"
    assert "kubernetes" in names, "Kubernetes should be detected"
    assert "mongodb" in names, "MongoDB should be detected"
    assert "ci/cd" in names, "CI/CD should be detected"
    print("Skill extraction passed!")

def test_tfidf_similarity():
    print("Testing TF-IDF vectorizer and cosine similarity...")
    doc1 = "Python developer building FastAPI backend with Docker and MongoDB databases."
    doc2 = "Looking for a Python software engineer to create FastAPI APIs and work with MongoDB and Docker."
    result = calculate_tfidf_similarity(doc1, doc2)
    score = result["similarity_score"]
    print(f"TF-IDF Cosine Similarity score: {score}%")
    assert score > 10.0, f"Expected similarity score > 10, got {score}"
    assert len(result["top_resume_keywords"]) > 0, "Keywords should be extracted"
    print("TF-IDF similarity passed!")

def test_full_analysis():
    print("Testing end-to-end resume-job match analysis...")
    resume = SAMPLE_RESUMES[0]["text"]
    job = SAMPLE_JOBS[0]["text"]
    analysis = analyze_resume_job_match(resume, job)
    print(f"Overall Score: {analysis['overall_score']}%")
    print(f"Skill Match: {analysis['skill_match_score']}%")
    print(f"TF-IDF Similarity: {analysis['tfidf_similarity_score']}%")
    print(f"Matched Skills count: {len(analysis['matched_skills'])}")
    print(f"Missing Skills count: {len(analysis['missing_skills'])}")
    print(f"ATS Readability: {analysis['ats_readability_score']}/100")
    assert analysis["overall_score"] > 50, "Fullstack resume should have high match with Fullstack job"
    print("End-to-end analysis passed!")

def test_database_manager():
    print("Testing database persistence...")
    record = {
        "candidate_name": "Test Candidate",
        "job_title": "Test Role",
        "overall_score": 85.5,
        "skill_match_score": 90.0,
        "tfidf_similarity_score": 81.0,
        "total_job_skills_found": 10,
        "total_resume_skills_found": 12,
        "matched_skills": [],
        "missing_skills": [],
        "bonus_skills": [],
        "top_resume_keywords": [],
        "top_job_keywords": [],
        "ats_readability_score": 90,
        "strengths": ["Great match"],
        "recommendations": ["Keep it up"]
    }
    rec_id = db_manager.save_analysis(record)
    assert rec_id, "Record ID should be generated"
    retrieved = db_manager.get_analysis_by_id(rec_id)
    assert retrieved is not None, "Saved analysis should be retrievable"
    print(f"Database persistence passed! (Mode: {db_manager.get_status()['mode']})")

if __name__ == "__main__":
    test_skills_extraction()
    test_tfidf_similarity()
    test_full_analysis()
    test_database_manager()
    print("\nAll backend verification tests passed successfully!")
