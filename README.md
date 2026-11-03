# AI Resume & Job Match Analyzer

An AI-assisted resume analysis platform that compares a candidate resume with a target job description. It combines skill extraction, TF-IDF cosine similarity, ATS-oriented heuristics, and a polished React dashboard to turn resume content into practical application feedback.

> **Designed & developed by Md Ashad**

## What it does

- Accepts PDF, TXT, or pasted resume content.
- Extracts technical and professional skills from resumes and job descriptions.
- Calculates a weighted match score:
  - **55%** skill alignment
  - **45%** TF-IDF cosine similarity
- Identifies matched, missing, and bonus skills.
- Shows top resume and job-description keywords.
- Provides ATS readability feedback and improvement recommendations.
- Saves analysis history in MongoDB when available.
- Automatically uses local JSON persistence when MongoDB is unavailable.
- Includes sample resumes, sample jobs, and a one-click demo.

## Application preview

The interface includes:

- Drag-and-drop resume upload
- Resume text paste mode
- Sample resume and job-description loaders
- Animated match score gauge
- Skills alignment dashboard
- Keyword comparison
- Strengths and recommendations
- Persistent analysis history
- Responsive dark glassmorphism UI

## Architecture

```text
React 19 + Vite frontend
        |
        | REST API / multipart form data
        v
FastAPI backend
        |
        +-- Resume parser (PDF/TXT/text cleanup)
        +-- Skill taxonomy and synonym matching
        +-- TF-IDF vectorization and cosine similarity
        +-- ATS readability heuristics
        |
        +-- MongoDB persistence
            Local JSON fallback when MongoDB is offline
```

## Technology stack

### Frontend

- React 19
- Vite
- Lucide React icons
- CSS with responsive layout, glass panels, gradients, hover effects, and accessible focus states

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- pypdf
- python-multipart

### NLP and scoring

- Scikit-learn
- NumPy
- Pandas
- TF-IDF vectorization with unigrams and bigrams
- Cosine similarity
- Curated skill taxonomy with synonym canonicalization

### Storage

- MongoDB through PyMongo
- Local JSON fallback at `backend/app/data/history.json`

## Requirements

- Windows 10 or later
- Python 3.11 or newer
- Node.js 18 or newer
- npm
- MongoDB is optional

The repository includes a local `venv` directory and installed frontend dependencies. For a fresh setup, follow the installation steps below.

## Installation

### 1. Clone or open the project

```bash
cd ai-resume-analyzer
```

### 2. Create and activate a Python environment

PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Command Prompt:

```bat
python -m venv venv
venv\Scripts\activate.bat
```

### 3. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

## Running the project

### Development mode

The recommended option starts both servers with hot reloading:

```bat
dev.bat
```

Or start them manually in separate terminals.

Backend:

```powershell
cd backend
..\venv\Scripts\python.exe run.py
```

Frontend:

```powershell
cd frontend
npm run dev
```

Development URLs:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:8000](http://localhost:8000)
- Swagger API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Production-style local mode

Build the frontend and start the backend:

```powershell
cd frontend
npm run build
cd ..
start.bat
```

When `frontend/dist` exists, FastAPI serves the built frontend from the backend application. Open [http://localhost:8000](http://localhost:8000).

## Deploying to Render

The repository includes a [`render.yaml`](./render.yaml) Blueprint for deploying the frontend and backend as one Render web service.

1. Push the repository to GitHub.
2. In Render, choose **New +** → **Blueprint** and select this repository.
3. Create a MongoDB Atlas database and copy its connection string.
4. In the Render service environment variables, set `MONGODB_URI` to the Atlas connection string.
5. Deploy. Render provides the public application URL; the API is available under the same URL at `/api`.

The frontend uses relative `/api` requests, so no frontend API URL setting is required. The Render health check uses `/api/health`.

If configuring a Render web service manually instead of using the Blueprint, use:

- **Build command:** `pip install -r requirements.txt && npm install --prefix frontend && npm run build --prefix frontend`
- **Start command:** `python run.py`
- **Health check path:** `/api/health`

The root `requirements.txt` delegates to `backend/requirements.txt`, so the dependency install also works with Render's default root-directory build context.
The root `run.py` launcher starts the backend from its `backend` directory, which is required when Render runs the command from the repository root.

If deploying the frontend separately (for example, on Vercel), set the frontend environment variable `VITE_API_URL` to the public backend URL ending in `/api`, then redeploy the frontend. For example:

```text
VITE_API_URL=https://your-backend.example.com/api
```

## Environment configuration

Set these environment variables before starting the backend when custom configuration is needed. The available variable reference is [.env.example](./.env.example).

PowerShell:

```powershell
$env:MONGODB_URI="mongodb://localhost:27017"
$env:DB_NAME="resume_matcher_db"
$env:HOST="0.0.0.0"
$env:PORT="8000"
```

Command Prompt:

```bat
set MONGODB_URI=mongodb://localhost:27017
set DB_NAME=resume_matcher_db
set HOST=0.0.0.0
set PORT=8000
```

Expected values:

```text
MONGODB_URI=mongodb://localhost:27017
DB_NAME=resume_matcher_db
HOST=0.0.0.0
PORT=8000
```

MongoDB is optional. If the connection cannot be established, the application continues using:

```text
backend/app/data/history.json
```

## API reference

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Returns application and storage status |
| `GET` | `/api/sample-data` | Returns sample resumes and job descriptions |
| `POST` | `/api/analyze` | Analyzes PDF/TXT upload or pasted resume text with a job description |
| `POST` | `/api/analyze-json` | Analyzes resume and job text from a JSON body |
| `POST` | `/api/parse-resume` | Extracts text, sections, and skills from a resume |
| `GET` | `/api/history` | Lists recent analyses |
| `GET` | `/api/history/{analysis_id}` | Returns one saved analysis |
| `DELETE` | `/api/history` | Clears saved analysis history |

### JSON analysis example

```bash
curl -X POST http://localhost:8000/api/analyze-json ^
  -H "Content-Type: application/json" ^
  -d "{\"resume_text\":\"Python FastAPI React developer with SQL experience\", \"job_description\":\"Looking for a Python FastAPI and React engineer\", \"candidate_name\":\"Md Ashad\", \"job_title\":\"Full-Stack Engineer\"}"
```

The response contains the overall score, skill-match score, TF-IDF score, ATS score, matched skills, missing skills, bonus skills, keywords, strengths, recommendations, and saved record ID.

## Testing and quality checks

Run backend verification tests:

```powershell
cd backend
..\venv\Scripts\python.exe test_backend.py
```

Build the frontend:

```powershell
cd frontend
npm run build
```

Run the frontend linter:

```powershell
npm run lint
```

## Project structure

```text
ai-resume-analyzer/
|-- backend/
|   |-- app/
|   |   |-- data/              Sample data and local history
|   |   |-- models/            Pydantic request/response schemas
|   |   |-- services/          Parser, NLP matcher, and database services
|   |   |-- config.py          Environment-backed settings
|   |   `-- main.py            FastAPI application and routes
|   |-- requirements.txt
|   |-- run.py
|   `-- test_backend.py
|-- frontend/
|   |-- src/
|   |   |-- components/        Score gauge, skill badges, history modal
|   |   |-- App.jsx            Main dashboard and API integration
|   |   `-- index.css          Theme, layout, animations, and responsive styles
|   |-- package.json
|   `-- vite.config.js
|-- .env.example
|-- dev.bat                    Start backend and Vite together
|-- start.bat                  Serve built frontend through FastAPI
`-- README.md
```

## Troubleshooting

### Frontend does not load

Confirm that the Vite server is running on port `5173`:

```powershell
cd frontend
npm run dev
```

### API requests fail

Confirm that the FastAPI backend is running on port `8000` and check:

[http://localhost:8000/api/health](http://localhost:8000/api/health)

### MongoDB is unavailable

This is supported. The application automatically switches to local JSON persistence. Start MongoDB only if MongoDB-backed storage is required.

### Resume analysis is rejected

Both the resume and job description must contain at least 20 characters. Use a readable PDF, TXT file, pasted text, or the built-in sample data.

## Privacy note

The application is designed for local development and analysis. When MongoDB is unavailable, analysis records remain in the local JSON fallback file. Do not upload sensitive resumes to a shared or publicly exposed deployment without adding appropriate authentication, access controls, and data-retention policies.

## License

No license has been specified for this project yet.
