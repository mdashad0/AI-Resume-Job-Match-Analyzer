import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  TrendingUp,
  Database,
  Server,
  Clock,
  Layers,
  Briefcase,
  Award,
  RefreshCw,
  Search,
  Check,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Cpu,
  BookOpen
} from 'lucide-react';
import ScoreGauge from './components/ScoreGauge';
import SkillBadge from './components/SkillBadge';
import HistoryModal from './components/HistoryModal';

export default function App() {
  // Input State
  const [resumeMode, setResumeMode] = useState('upload'); // 'upload' | 'paste'
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  // Processing & Results State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [activeSkillFilter, setActiveSkillFilter] = useState('all'); // 'all' | 'matched' | 'missing' | 'bonus'

  // Metadata & History
  const [systemStatus, setSystemStatus] = useState({ mode: 'Detecting...', connected: false });
  const [sampleData, setSampleData] = useState({ resumes: [], jobs: [] });
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);

  const handleClearWorkspace = () => {
    setResumeMode('upload');
    setResumeFile(null);
    setResumeText('');
    setJobDescription('');
    setCandidateName('');
    setJobTitle('');
    setAnalysis(null);
    setErrorMessage('');
    setActiveSkillFilter('all');
    setDragActive(false);
    setFormResetKey((currentKey) => currentKey + 1);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch initial system status, sample data, and history
  useEffect(() => {
    fetchHealthStatus();
    fetchSampleData();
    fetchHistory();
  }, []);

  const fetchHealthStatus = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (e) {
      setSystemStatus({ mode: 'Local JSON Fallback', connected: false });
    }
  };

  const fetchSampleData = async () => {
    try {
      const res = await fetch('/api/sample-data');
      if (res.ok) {
        const data = await res.json();
        setSampleData(data);
      }
    } catch (e) {
      console.error('Failed to fetch sample data', e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setResumeFile(file);
      setResumeMode('upload');
      setCandidateName(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      setCandidateName(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }
  };

  // Load sample resume or job
  const handleLoadSampleResume = (sampleId) => {
    const found = sampleData.resumes.find(r => r.id === sampleId);
    if (found) {
      setResumeMode('paste');
      setResumeText(found.text);
      setCandidateName(found.name);
      setResumeFile(null);
    }
  };

  const handleLoadSampleJob = (jobId) => {
    const found = sampleData.jobs.find(j => j.id === jobId);
    if (found) {
      setJobDescription(found.text);
      setJobTitle(found.title);
    }
  };

  // 1-Click Demo Loader
  const handleRunDemo = async () => {
    if (sampleData.resumes.length > 0 && sampleData.jobs.length > 0) {
      const sampleR = sampleData.resumes[0];
      const sampleJ = sampleData.jobs[0];
      setResumeMode('paste');
      setResumeText(sampleR.text);
      setCandidateName(sampleR.name);
      setJobDescription(sampleJ.text);
      setJobTitle(sampleJ.title);
      setResumeFile(null);
      // Run analysis directly with these values
      await executeAnalysis({
        textResume: sampleR.text,
        file: null,
        jobDesc: sampleJ.text,
        cName: sampleR.name,
        jTitle: sampleJ.title
      });
    }
  };

  // Submit Analysis
  const executeAnalysis = async (params = null) => {
    setErrorMessage('');
    setLoading(true);

    const useFile = params ? params.file : (resumeMode === 'upload' ? resumeFile : null);
    const useText = params ? params.textResume : (resumeMode === 'paste' ? resumeText : '');
    const useJob = params ? params.jobDesc : jobDescription;
    const useCName = params ? params.cName : (candidateName || 'Candidate');
    const useJTitle = params ? params.jTitle : (jobTitle || 'Target Role');

    if (!useFile && (!useText || useText.trim().length < 20)) {
      setErrorMessage('Please upload a resume file (PDF/TXT) or paste at least 20 characters of resume text.');
      setLoading(false);
      return;
    }

    if (!useJob || useJob.trim().length < 20) {
      setErrorMessage('Please provide a complete Job Description to compare against (minimum 20 characters).');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      if (useFile) {
        formData.append('file', useFile);
      } else {
        formData.append('resume_text', useText);
      }
      formData.append('job_description', useJob);
      formData.append('candidate_name', useCName);
      formData.append('job_title', useJTitle);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Analysis failed.' }));
        throw new Error(errorData.detail || 'Analysis request failed.');
      }

      const result = await response.json();
      setAnalysis(result);
      fetchHistory(); // Refresh history list

      // Smooth scroll to results
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      setErrorMessage(err.message || 'Error communicating with FastAPI backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await fetch('/api/history', { method: 'DELETE' });
      setHistory([]);
    } catch (e) {
      console.error('Failed to clear history', e);
    }
  };

  // Filter skills for display
  const getFilteredSkills = () => {
    if (!analysis) return [];
    if (activeSkillFilter === 'matched') {
      return analysis.matched_skills.map(s => ({ ...s, matchType: 'matched' }));
    }
    if (activeSkillFilter === 'missing') {
      return analysis.missing_skills.map(s => ({ ...s, matchType: 'missing' }));
    }
    if (activeSkillFilter === 'bonus') {
      return analysis.bonus_skills.map(s => ({ ...s, matchType: 'bonus' }));
    }
    // 'all'
    return [
      ...analysis.matched_skills.map(s => ({ ...s, matchType: 'matched' })),
      ...analysis.missing_skills.map(s => ({ ...s, matchType: 'missing' })),
      ...analysis.bonus_skills.map(s => ({ ...s, matchType: 'bonus' }))
    ];
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header style={{
        borderBottom: '1px solid #334155',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '12px 24px'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Logo & Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)'
            }}>
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                  AI-Powered Resume Matcher
                </h1>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(59, 130, 246, 0.4)'
                }}>
                  TF-IDF & NLP
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                FastAPI • Scikit-learn • TF-IDF Cosine Similarity • MongoDB
              </p>
            </div>
          </div>

          {/* Right Action Controls: DB Status & History Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Database Status Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid #334155',
              fontSize: '0.75rem',
              color: '#94a3b8'
            }}>
              <Database size={13} color={systemStatus.connected ? "#10b981" : "#38bdf8"} />
              <span>Storage:</span>
              <span style={{
                color: systemStatus.connected ? "#34d399" : "#38bdf8",
                fontWeight: 600
              }}>
                {systemStatus.mode || 'Detecting...'}
              </span>
            </div>

            {/* Quick Demo Button */}
            <button
              onClick={handleRunDemo}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                fontSize: '0.8125rem',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.2s',
                opacity: loading ? 0.6 : 1
              }}
            >
              <Cpu size={14} />
              <span>Run Quick Demo</span>
            </button>

            {/* History Toggle */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '0.8125rem',
                fontWeight: 500,
                transition: 'border-color 0.2s'
              }}
            >
              <Clock size={14} color="#94a3b8" />
              <span>History</span>
              {history.length > 0 && (
                <span style={{
                  fontSize: '0.6875rem',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontWeight: 700
                }}>
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px', flex: 1, width: '100%' }}>
        {/* Error notification banner */}
        {errorMessage && (
          <div style={{
            padding: '12px 18px',
            backgroundColor: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: '10px',
            color: '#fb7185',
            fontSize: '0.875rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Input Workstation Section (Dual Columns) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
          marginBottom: '28px'
        }}>
          {/* ================= LEFT COLUMN: RESUME INPUT ================= */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#38bdf8" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc' }}>
                  Candidate Resume
                </h2>
              </div>

              {/* Sample resume loader dropdown */}
              {sampleData.resumes.length > 0 && (
                <select
                  key={`resume-sample-${formResetKey}`}
                  onChange={(e) => handleLoadSampleResume(e.target.value)}
                  defaultValue=""
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" disabled>Load Sample Resume...</option>
                  {sampleData.resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Candidate Name Input */}
            <input
              type="text"
              placeholder="Candidate Name (Optional)"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.875rem',
                marginBottom: '14px'
              }}
            />

            {/* Resume Mode Switcher Tabs */}
            <div style={{
              display: 'flex',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              padding: '3px',
              marginBottom: '14px'
            }}>
              <button
                onClick={() => setResumeMode('upload')}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  backgroundColor: resumeMode === 'upload' ? '#3b82f6' : 'transparent',
                  color: resumeMode === 'upload' ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.15s'
                }}
              >
                Upload File (PDF / TXT)
              </button>
              <button
                onClick={() => setResumeMode('paste')}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  backgroundColor: resumeMode === 'paste' ? '#3b82f6' : 'transparent',
                  color: resumeMode === 'paste' ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.15s'
                }}
              >
                Paste Plain Text
              </button>
            </div>

            {/* Mode 1: File Upload Drag & Drop */}
            {resumeMode === 'upload' ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1,
                  minHeight: '220px',
                  border: `2px dashed ${dragActive ? '#3b82f6' : resumeFile ? '#10b981' : '#334155'}`,
                  borderRadius: '10px',
                  backgroundColor: dragActive ? 'rgba(59, 130, 246, 0.08)' : 'rgba(15, 23, 42, 0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background-color 0.2s'
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.doc,.docx"
                  style={{ display: 'none' }}
                />
                <UploadCloud size={38} color={resumeFile ? "#10b981" : "#64748b"} style={{ marginBottom: '12px' }} />
                
                {resumeFile ? (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.95rem' }}>
                      {resumeFile.name}
                    </p>
                    <p style={{ color: '#10b981', fontSize: '0.8125rem', marginTop: '4px' }}>
                      Ready to parse ({(resumeFile.size / 1024).toFixed(1)} KB)
                    </p>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', display: 'inline-block' }}>
                      Click to choose another file
                    </span>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#f8fafc', fontWeight: 500, fontSize: '0.9rem' }}>
                      Drop your resume here, or <span style={{ color: '#38bdf8' }}>browse</span>
                    </p>
                    <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>
                      Supports PDF, TXT files (Fast PyPDF text extraction)
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Mode 2: Paste Text Area */
              <textarea
                placeholder="Paste the full text of candidate's resume here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                style={{
                  flex: 1,
                  minHeight: '220px',
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  resize: 'vertical'
                }}
              />
            )}
          </div>

          {/* ================= RIGHT COLUMN: JOB DESCRIPTION ================= */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={18} color="#38bdf8" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc' }}>
                  Target Job Description
                </h2>
              </div>

              {/* Sample job loader dropdown */}
              {sampleData.jobs.length > 0 && (
                <select
                  key={`job-sample-${formResetKey}`}
                  onChange={(e) => handleLoadSampleJob(e.target.value)}
                  defaultValue=""
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" disabled>Load Sample Job...</option>
                  {sampleData.jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Target Job Title Input */}
            <input
              type="text"
              placeholder="Target Role / Job Title (Optional)"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.875rem',
                marginBottom: '14px'
              }}
            />

            {/* Job Description Textarea */}
            <textarea
              placeholder="Paste the target job description requisition, required skills, and responsibilities here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              style={{
                flex: 1,
                minHeight: '265px',
                width: '100%',
                padding: '12px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '10px',
                color: '#f8fafc',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Central Submit Action */}
        <div className="analysis-actions" style={{ display: 'flex', justifyContent: 'center', marginBottom: '36px' }}>
          <button
            onClick={() => executeAnalysis()}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff',
              fontSize: '1.05rem',
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'transform 0.15s, box-shadow 0.15s'
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                <span>Running NLP & TF-IDF Vectorizer...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Calculate Resume & Job Match</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
          <button
            type="button"
            className="clear-workspace-button"
            onClick={handleClearWorkspace}
            disabled={loading}
            title="Clear the current resume, job description, and results"
          >
            <RefreshCw size={17} />
            <span>Clear Workspace</span>
          </button>
        </div>

        {/* ================= RESULTS DASHBOARD ================= */}
        {analysis && (
          <div ref={resultsRef} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Score Banner Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px'
            }}>
              {/* Overall Match Gauge Card */}
              <div className="glass-panel" style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderTop: '4px solid #3b82f6'
              }}>
                <ScoreGauge score={analysis.overall_score} label="Overall Match Score" size={150} />
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', textAlign: 'center' }}>
                  Weighted: 55% Skills + 45% TF-IDF Cosine
                </span>
              </div>

              {/* Direct Skill Match Card */}
              <div className="glass-panel" style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: '4px solid #10b981'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 500 }}>
                      Skill Overlap Rate
                    </span>
                    <Layers size={18} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
                    {analysis.skill_match_score}%
                  </div>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                  Matched <strong style={{ color: '#10b981' }}>{analysis.matched_skills.length}</strong> of{' '}
                  <strong>{analysis.total_job_skills_found}</strong> required skills from the job description.
                </div>
              </div>

              {/* TF-IDF Cosine Similarity Card */}
              <div className="glass-panel" style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: '4px solid #a855f7'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 500 }}>
                      TF-IDF Cosine Similarity
                    </span>
                    <TrendingUp size={18} color="#a855f7" />
                  </div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
                    {analysis.tfidf_similarity_score}%
                  </div>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                  Natural language vector alignment measuring overall contextual terminology.
                </div>
              </div>

              {/* ATS Readability Card */}
              <div className="glass-panel" style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: '4px solid #f59e0b'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 500 }}>
                      ATS Readability Score
                    </span>
                    <ShieldCheck size={18} color="#f59e0b" />
                  </div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
                    {analysis.ats_readability_score}<span style={{ fontSize: '1.25rem', fontWeight: 500, color: '#64748b' }}>/100</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                  Evaluated against standard applicant tracking parser heuristics and keyword density.
                </div>
              </div>
            </div>

            {/* Detailed Skills Alignment Breakdown */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '18px',
                borderBottom: '1px solid #334155',
                paddingBottom: '14px'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc' }}>
                    Skills Alignment Matrix
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                    Extracted via NLP taxonomy comparison
                  </p>
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveSkillFilter('all')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: activeSkillFilter === 'all' ? '#334155' : 'transparent',
                      color: activeSkillFilter === 'all' ? '#f8fafc' : '#94a3b8',
                      border: '1px solid #334155'
                    }}
                  >
                    All Skills ({analysis.matched_skills.length + analysis.missing_skills.length + analysis.bonus_skills.length})
                  </button>
                  <button
                    onClick={() => setActiveSkillFilter('matched')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: activeSkillFilter === 'matched' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    Matched ({analysis.matched_skills.length})
                  </button>
                  <button
                    onClick={() => setActiveSkillFilter('missing')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: activeSkillFilter === 'missing' ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
                      color: '#fb7185',
                      border: '1px solid rgba(244, 63, 94, 0.4)'
                    }}
                  >
                    Missing in Resume ({analysis.missing_skills.length})
                  </button>
                  <button
                    onClick={() => setActiveSkillFilter('bonus')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: activeSkillFilter === 'bonus' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      color: '#60a5fa',
                      border: '1px solid rgba(59, 130, 246, 0.4)'
                    }}
                  >
                    Bonus Skills ({analysis.bonus_skills.length})
                  </button>
                </div>
              </div>

              {/* Skill Badges Flow */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '60px', alignItems: 'center' }}>
                {getFilteredSkills().length === 0 ? (
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>No skills in this category.</span>
                ) : (
                  getFilteredSkills().map((skill, idx) => (
                    <SkillBadge key={`${skill.canonical}-${idx}`} skill={skill} type={skill.matchType} />
                  ))
                )}
              </div>
            </div>

            {/* Bottom Row: Top TF-IDF Keywords & ATS Recommendations */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '24px'
            }}>
              {/* TF-IDF Top Differentiating Keywords */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} color="#a855f7" />
                  Top TF-IDF Extracted Terms
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Job Requisition Keywords */}
                  <div>
                    <h4 style={{ fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Job Requisition Terms
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {analysis.top_job_keywords.map((kw, i) => (
                        <div key={i} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '4px 8px',
                          backgroundColor: 'rgba(15, 23, 42, 0.6)',
                          borderRadius: '6px',
                          fontSize: '0.8125rem'
                        }}>
                          <span style={{ color: '#f8fafc' }}>{kw.term}</span>
                          <span style={{ color: '#a855f7', fontWeight: 600 }}>{kw.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resume Keywords */}
                  <div>
                    <h4 style={{ fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Candidate Resume Terms
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {analysis.top_resume_keywords.map((kw, i) => (
                        <div key={i} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '4px 8px',
                          backgroundColor: 'rgba(15, 23, 42, 0.6)',
                          borderRadius: '6px',
                          fontSize: '0.8125rem'
                        }}>
                          <span style={{ color: '#f8fafc' }}>{kw.term}</span>
                          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{kw.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable ATS Strategy & Insights */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="#10b981" />
                  ATS Optimization & Recommendations
                </h3>

                {/* Strengths */}
                {analysis.strengths && analysis.strengths.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '0.75rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 700 }}>
                      Profile Strengths
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {analysis.strengths.map((s, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8125rem', color: '#f8fafc' }}>
                          <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.75rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 700 }}>
                      Actionable Improvements
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {analysis.recommendations.map((r, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8125rem', color: '#f8fafc' }}>
                          <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* History Drawer Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectRecord={(rec) => {
          setAnalysis(rec);
          setCandidateName(rec.candidate_name || '');
          setJobTitle(rec.job_title || '');
          setTimeout(() => {
            if (resultsRef.current) {
              resultsRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        }}
        onClearHistory={handleClearHistory}
      />

      {/* Footer */}
      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <div className="site-footer__logo">
              <Sparkles size={18} />
            </div>
            <div>
              <h2>AI Resume Matcher</h2>
              <p>Make every application more intentional.</p>
            </div>
          </div>

          <div className="site-footer__about">
            <h3>Built for better applications</h3>
            <p>
              Compare a candidate resume with any job description using skill
              extraction, TF-IDF similarity, and ATS-focused readability signals.
              Get practical insights in seconds.
            </p>
          </div>

          <div className="site-footer__details">
            <div>
              <span className="site-footer__label">Analysis engine</span>
              <strong>FastAPI · Scikit-learn</strong>
            </div>
            <div>
              <span className="site-footer__label">Data storage</span>
              <strong>{systemStatus.mode || 'Local Persistent JSON'}</strong>
            </div>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>Resume & Job Match Analyzer</span>
          <span className="site-footer__dot">•</span>
          <span>Designed & developed by <strong className="site-footer__credit">Md Ashad</strong></span>
          <span className="site-footer__dot">•</span>
          <span>Private-by-design · v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
