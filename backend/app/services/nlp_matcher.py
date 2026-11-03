import re
import math
from typing import Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.services.skills_db import (
    SKILL_TAXONOMY,
    SYNONYM_MAP,
    get_skill_category
)

# Standard English stop words to filter out noise
STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
    "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't",
    "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't",
    "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
    "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm",
    "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more",
    "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or",
    "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
    "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's",
    "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they",
    "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under",
    "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't",
    "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom",
    "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've",
    "your", "yours", "yourself", "yourselves"
}

def preprocess_text(text: str) -> str:
    """Cleans and normalizes text while preserving special tech tokens (e.g. C++, C#, .NET)."""
    text = text.lower()
    
    # Protect special programming terms before punctuation strip
    text = re.sub(r"\bc\+\+\b", "cplusplus", text)
    text = re.sub(r"\bc#\b", "csharp", text)
    text = re.sub(r"\.net\b", "dotnet", text)
    text = re.sub(r"\bnode\.js\b", "nodejs", text)
    text = re.sub(r"\bvue\.js\b", "vuejs", text)
    text = re.sub(r"\breact\.js\b", "reactjs", text)
    text = re.sub(r"\bci/cd\b", "cicd", text)
    
    # Replace other punctuation with spaces
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
    
    # Restore mapped terms
    text = re.sub(r"\bcplusplus\b", "c++", text)
    text = re.sub(r"\bcsharp\b", "c#", text)
    text = re.sub(r"\bdotnet\b", ".net", text)
    text = re.sub(r"\bnodejs\b", "node.js", text)
    text = re.sub(r"\bvuejs\b", "vue.js", text)
    text = re.sub(r"\breactjs\b", "react", text)
    text = re.sub(r"\bcicd\b", "ci/cd", text)
    
    # Normalize multiple whitespace
    return re.sub(r"\s+", " ", text).strip()

def extract_skills_from_text(text: str) -> list[dict[str, str]]:
    """
    Scans text for skills from the taxonomy, supporting multi-word phrases and synonyms.
    Returns a sorted list of matched unique canonical skills with categories.
    """
    cleaned_lower = f" {preprocess_text(text)} "
    matched_skills = {}
    
    for category, skills in SKILL_TAXONOMY.items():
        for skill in skills:
            canonical = SYNONYM_MAP.get(skill.lower(), skill.lower())
            
            # Form regex pattern with word boundaries (handling special chars like +, #, .)
            escaped_skill = re.escape(skill.lower())
            # For skills like c++, \b at the end doesn't work directly because + is non-word
            if escaped_skill.endswith(r"\+\+") or escaped_skill.endswith(r"\#"):
                pattern = rf"(?:\s|^){escaped_skill}(?:\s|$)"
            else:
                pattern = rf"\b{escaped_skill}\b"
                
            if re.search(pattern, cleaned_lower):
                matched_skills[canonical] = {
                    "name": canonical.title() if canonical not in ["sql", "aws", "gcp", "ci/cd", "nlp", "llm", "rag", "tdd", "oop", "rest api"] else canonical.upper(),
                    "category": category,
                    "canonical": canonical
                }
                
    return sorted(list(matched_skills.values()), key=lambda x: (x["category"], x["name"]))

def calculate_tfidf_similarity(resume_text: str, job_text: str) -> dict[str, Any]:
    """
    Computes TF-IDF vector representations and calculates Cosine Similarity between Resume and Job Description.
    Also extracts top differentiating keywords for each document.
    """
    cleaned_resume = preprocess_text(resume_text)
    cleaned_job = preprocess_text(job_text)
    
    if not cleaned_resume or not cleaned_job:
        return {
            "similarity_score": 0.0,
            "top_resume_keywords": [],
            "top_job_keywords": []
        }
        
    documents = [cleaned_resume, cleaned_job]
    
    # Fit TF-IDF Vectorizer with unigrams and bigrams
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        max_features=250
    )
    
    try:
        tfidf_matrix = vectorizer.fit_transform(documents)
        similarity = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
        # Scale to 0.0 - 100.0
        similarity_percentage = round(similarity * 100, 1)
        
        feature_names = np.array(vectorizer.get_feature_names_out())
        
        # Extract top keywords for resume
        resume_scores = tfidf_matrix[0].toarray().flatten()
        top_resume_idx = resume_scores.argsort()[-8:][::-1]
        top_resume_keywords = [
            {"term": feature_names[i], "score": round(float(resume_scores[i]), 3)}
            for i in top_resume_idx if resume_scores[i] > 0
        ]
        
        # Extract top keywords for job
        job_scores = tfidf_matrix[1].toarray().flatten()
        top_job_idx = job_scores.argsort()[-8:][::-1]
        top_job_keywords = [
            {"term": feature_names[i], "score": round(float(job_scores[i]), 3)}
            for i in top_job_idx if job_scores[i] > 0
        ]
        
    except Exception as e:
        similarity_percentage = 0.0
        top_resume_keywords = []
        top_job_keywords = []
        
    return {
        "similarity_score": similarity_percentage,
        "top_resume_keywords": top_resume_keywords,
        "top_job_keywords": top_job_keywords
    }

def generate_ats_recommendations(
    matched_skills: list[dict],
    missing_skills: list[dict],
    similarity_score: float,
    resume_text: str
) -> dict[str, Any]:
    """Generates actionable advice to improve resume match and pass ATS systems."""
    tips = []
    strengths = []
    
    word_count = len(resume_text.split())
    if word_count < 250:
        tips.append("Your resume appears quite brief (under 250 words). Adding detailed accomplishment bullets will help ATS scan for keywords.")
    elif word_count > 1200:
        tips.append("Your resume exceeds 1,200 words. Consider condensing to 1-2 focused pages for higher recruiter engagement.")
    else:
        strengths.append(f"Resume length is optimal ({word_count} words).")
        
    if missing_skills:
        top_missing = [s["name"] for s in missing_skills[:5]]
        tips.append(f"Prioritize incorporating key missing skills required by the job: {', '.join(top_missing)}.")
        
    if similarity_score >= 65:
        strengths.append("High contextual vocabulary overlap with the target job requisition.")
    elif similarity_score < 40:
        tips.append("Low overall phrase similarity. Mirror the job description's terminology (e.g. 'microservices', 'cross-functional collaboration', 'data pipelines').")
        
    if len(matched_skills) >= 6:
        strengths.append(f"Strong skill alignment: successfully matched {len(matched_skills)} core technical proficiencies.")
    else:
        tips.append("Explicitly highlight core competencies in a dedicated 'Skills' section so parsers categorize them accurately.")
        
    # Calculate an estimated ATS readability score (0 - 100)
    base_ats = 60
    if 300 <= word_count <= 900:
        base_ats += 15
    if len(matched_skills) >= 5:
        base_ats += 15
    if similarity_score > 50:
        base_ats += 10
    ats_readability_score = min(98, max(40, base_ats))
    
    return {
        "ats_readability_score": ats_readability_score,
        "strengths": strengths,
        "recommendations": tips
    }

def analyze_resume_job_match(resume_text: str, job_text: str) -> dict[str, Any]:
    """
    Main orchestration function: extracts skills, runs TF-IDF vectorization,
    calculates composite match score, and generates ATS suggestions.
    """
    # 1. Extract skills from both documents
    resume_skills = extract_skills_from_text(resume_text)
    job_skills = extract_skills_from_text(job_text)
    
    resume_skill_keys = {s["canonical"]: s for s in resume_skills}
    job_skill_keys = {s["canonical"]: s for s in job_skills}
    
    # 2. Categorize skill matches
    matched_skills = [
        s for key, s in job_skill_keys.items() if key in resume_skill_keys
    ]
    missing_skills = [
        s for key, s in job_skill_keys.items() if key not in resume_skill_keys
    ]
    candidate_bonus_skills = [
        s for key, s in resume_skill_keys.items() if key not in job_skill_keys
    ]
    
    # 3. Calculate Skill Recall / Match Rate
    if job_skills:
        skill_match_percentage = round((len(matched_skills) / len(job_skills)) * 100, 1)
    else:
        skill_match_percentage = 100.0 if resume_skills else 50.0
        
    # 4. TF-IDF & Cosine Similarity
    tfidf_results = calculate_tfidf_similarity(resume_text, job_text)
    tfidf_similarity = tfidf_results["similarity_score"]
    
    # 5. Composite Weighted Overall Match Score:
    # 55% Skill Overlap + 45% TF-IDF Semantic Content Similarity
    overall_score = round((0.55 * skill_match_percentage) + (0.45 * tfidf_similarity), 1)
    overall_score = min(100.0, max(0.0, overall_score))
    
    # 6. ATS Insights & Recommendations
    ats_insights = generate_ats_recommendations(
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        similarity_score=tfidf_similarity,
        resume_text=resume_text
    )
    
    return {
        "overall_score": overall_score,
        "skill_match_score": skill_match_percentage,
        "tfidf_similarity_score": tfidf_similarity,
        "total_job_skills_found": len(job_skills),
        "total_resume_skills_found": len(resume_skills),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "bonus_skills": candidate_bonus_skills,
        "top_resume_keywords": tfidf_results["top_resume_keywords"],
        "top_job_keywords": tfidf_results["top_job_keywords"],
        "ats_readability_score": ats_insights["ats_readability_score"],
        "strengths": ats_insights["strengths"],
        "recommendations": ats_insights["recommendations"]
    }
