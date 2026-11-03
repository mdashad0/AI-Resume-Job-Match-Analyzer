"""
Curated Skill Database and Taxonomy
Categorizes technical and professional skills for ATS and NLP matching.
"""

SKILL_TAXONOMY = {
    "Programming Languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "go", "golang",
        "rust", "ruby", "php", "swift", "kotlin", "sql", "bash", "shell", "r",
        "scala", "dart", "html", "css", "html5", "css3"
    ],
    "Frontend Development": [
        "react", "react.js", "next.js", "vue", "vue.js", "angular", "svelte",
        "redux", "zustand", "tailwind", "tailwind css", "bootstrap", "material-ui",
        "sass", "less", "webpack", "vite", "graphql", "responsive design"
    ],
    "Backend & APIs": [
        "fastapi", "flask", "django", "node.js", "express", "express.js", "nestjs",
        "spring boot", "asp.net", "asp.net core", "ruby on rails", "gin", "fiber",
        "rest api", "restful api", "grpc", "graphql", "microservices", "celery",
        "rabbitmq", "kafka", "event-driven architecture"
    ],
    "Databases & Caching": [
        "mongodb", "postgresql", "postgres", "mysql", "redis", "sqlite",
        "dynamodb", "cassandra", "elasticsearch", "neo4j", "supabase", "firebase",
        "firestore", "snowflake", "bigquery", "mariadb", "orm", "prisma", "sqlalchemy"
    ],
    "Cloud & DevOps": [
        "aws", "amazon web services", "azure", "google cloud", "gcp", "docker",
        "kubernetes", "k8s", "terraform", "ansible", "ci/cd", "continuous integration",
        "continuous deployment", "github actions", "gitlab ci", "jenkins", "helm",
        "prometheus", "grafana", "nginx", "linux", "cloudformation", "serverless"
    ],
    "AI, Machine Learning & Data": [
        "machine learning", "deep learning", "nlp", "natural language processing",
        "computer vision", "scikit-learn", "sklearn", "pytorch", "tensorflow", "keras",
        "pandas", "numpy", "scipy", "hugging face", "transformers", "llm", "large language models",
        "langchain", "llamaindex", "tf-idf", "cosine similarity", "word2vec", "bert",
        "data modeling", "feature engineering", "data analysis", "matplotlib", "seaborn",
        "vector database", "rag", "retrieval augmented generation"
    ],
    "Engineering Practices & Tools": [
        "git", "github", "gitlab", "jira", "agile", "scrum", "kanban", "tdd",
        "test-driven development", "unit testing", "integration testing", "pytest",
        "jest", "system design", "clean code", "design patterns", "oop", "object-oriented programming"
    ],
    "Soft Skills & Leadership": [
        "leadership", "team leadership", "mentorship", "communication", "collaboration",
        "problem solving", "critical thinking", "project management", "cross-functional collaboration",
        "time management", "stakeholder management"
    ]
}

# Synonyms and Canonical Mapping
SYNONYM_MAP = {
    "golang": "go",
    "k8s": "kubernetes",
    "react.js": "react",
    "reactjs": "react",
    "node": "node.js",
    "nodejs": "node.js",
    "vue.js": "vue",
    "vuejs": "vue",
    "express.js": "express",
    "amazon web services": "aws",
    "google cloud platform": "google cloud",
    "gcp": "google cloud",
    "postgres": "postgresql",
    "mongo": "mongodb",
    "mongo db": "mongodb",
    "sklearn": "scikit-learn",
    "tf": "tensorflow",
    "ts": "typescript",
    "js": "javascript",
    "restful api": "rest api",
    "restful apis": "rest api",
    "ci / cd": "ci/cd",
    "continuous integration / continuous deployment": "ci/cd",
    "continuous integration and continuous deployment": "ci/cd",
    "llms": "llm",
    "large language models": "llm",
    "natural language processing": "nlp"
}

def get_all_skills_flat() -> list[str]:
    """Returns a flat list of all unique skills across categories."""
    skills = set()
    for cat_skills in SKILL_TAXONOMY.values():
        for skill in cat_skills:
            canonical = SYNONYM_MAP.get(skill.lower(), skill.lower())
            skills.add(canonical)
    return sorted(list(skills))

def get_skill_category(skill_name: str) -> str:
    """Finds the primary category for a given skill."""
    canonical = SYNONYM_MAP.get(skill_name.lower(), skill_name.lower())
    for category, skills in SKILL_TAXONOMY.items():
        for s in skills:
            if SYNONYM_MAP.get(s.lower(), s.lower()) == canonical:
                return category
    return "Other Technical"
