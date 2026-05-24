import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Sparkles, Languages, 
  CheckCircle2, XCircle, Info, ExternalLink, RefreshCw, ArrowLeft,
  ChevronDown, ChevronUp, FileText, BarChart3, MessageSquare, Send, ThumbsUp, Lock
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Report = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const videoUrl = searchParams.get('url');

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [expandedClaim, setExpandedClaim] = useState(null);

  // Community discussion state
  const [opinions, setOpinions] = useState([]);
  const [newOpinion, setNewOpinion] = useState('');
  const [opinionsLoading, setOpinionsLoading] = useState(false);
  const [opinionSubmitLoading, setOpinionSubmitLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Brand Dispute States
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeClaimText, setDisputeClaimText] = useState('');
  const [disputeReasonText, setDisputeReasonText] = useState('');
  const [disputeEvidenceLinks, setDisputeEvidenceLinks] = useState(['']);
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeError, setDisputeError] = useState('');

  const steps = [
    "Downloading and indexing ad video...",
    "Extracting audio streams & sampling keyframes...",
    "OCR scanning on-screen text & disclaimers...",
    "Transcribing English/Hindi/Hinglish audio...",
    "Gemini visual trick analysis...",
    "Extracting factual ad claims...",
    "Querying Google Search (Serper) to fact-check...",
    "Computing final credibility metrics..."
  ];

  // Dynamic progress loader effect
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  // Fetch organizations for tagging on mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoadingOrgs(true);
        const res = await axios.get('/api/v1/organizations/public/list');
        setOrganizations(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedOrgId(res.data[0]._id);
        }
      } catch (err) {
        console.error("Failed to load organizations for tagging:", err);
      } finally {
        setLoadingOrgs(false);
      }
    };
    fetchOrganizations();
  }, []);

  // Fetch report on mount
  useEffect(() => {
    if (!videoUrl) {
      setError("No video URL provided.");
      setLoading(false);
      return;
    }

    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const orgId = searchParams.get('orgId');
        const payload = { url: videoUrl };
        if (orgId) {
          payload.organizationId = orgId;
        }

        // Direct, synchronous Express analysis call
        const response = await axios.post('/api/v1/analysis/analyse', payload);
        setReport(response.data);
      } catch (err) {
        console.error("Analysis API failed:", err);
        setError(err.response?.data?.error || "An error occurred during video analysis. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [videoUrl, searchParams]);

  // Load community opinions for this ad
  useEffect(() => {
    if (!report || !report.url) return;
    const fetchOpinions = async () => {
      try {
        setOpinionsLoading(true);
        const res = await axios.get(`/api/v1/community/get-posts?reportId=${report._id}`);
        setOpinions(res.data || []);
      } catch (err) {
        console.error("Failed to load community opinions:", err);
      } finally {
        setOpinionsLoading(false);
      }
    };
    fetchOpinions();
  }, [report]);

  const handleSubmitOpinion = async (e) => {
    e.preventDefault();
    if (!newOpinion.trim()) return;
    if (!selectedOrgId) {
      alert("Please select a concerned brand/organization from the dropdown to tag on your post.");
      return;
    }
    try {
      setOpinionSubmitLoading(true);
      const res = await axios.post('/api/v1/community/create-post', {
        reportId: report._id,
        opinionText: newOpinion.trim(),
        organizationId: selectedOrgId,
      });
      setOpinions((prev) => [res.data, ...prev]);
      setNewOpinion('');
    } catch (err) {
      console.error("Failed to submit opinion:", err);
      alert(err.response?.data?.message || "Failed to post opinion. Please try again.");
    } finally {
      setOpinionSubmitLoading(false);
    }
  };

  const handleLikeOpinion = async (id) => {
    if (!user) {
      alert("Please log in to upvote opinions.");
      return;
    }
    try {
      const res = await axios.post(`/api/v1/community/${id}/like`);
      setOpinions((prev) => prev.map((post) => (post._id === id ? res.data : post)));
    } catch (err) {
      console.error("Failed to like opinion:", err);
    }
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeClaimText.trim() || !disputeReasonText.trim()) {
      setDisputeError('Disputed claim and factual evidence are required.');
      return;
    }
    setSubmittingDispute(true);
    setDisputeError('');
    try {
      await axios.post('/api/v1/disputes/create-dispute', {
        reportId: report._id,
        claimText: disputeClaimText.trim(),
        reasonText: disputeReasonText.trim(),
        evidenceLinks: disputeEvidenceLinks.filter(l => l.trim() !== '')
      });
      alert('Brand dispute challenge submitted successfully! Our validation team will verify it.');
      setIsDisputeModalOpen(false);
    } catch (err) {
      console.error('Error creating dispute:', err);
      setDisputeError(err.response?.data?.message || 'Failed to submit dispute challenge. Please try again.');
    } finally {
      setSubmittingDispute(false);
    }
  };

  const toggleClaim = (index) => {
    setExpandedClaim(expandedClaim === index ? null : index);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600 border-emerald-500/20 bg-emerald-500/10";
    if (score >= 50) return "text-amber-600 border-amber-500/20 bg-amber-500/10";
    return "text-rose-600 border-rose-500/20 bg-rose-500/10";
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return "from-emerald-500 to-teal-500 shadow-emerald-500/10";
    if (score >= 50) return "from-amber-500 to-orange-500 shadow-amber-500/10";
    return "from-rose-500 to-red-500 shadow-rose-500/10";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </span>
        );
      case 'Misleading':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Misleading
          </span>
        );
      case 'False':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> False
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-600 border border-gray-500/20">
            <Info className="w-3.5 h-3.5" /> Unverifiable
          </span>
        );
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Verified':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'Misleading':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'False':
        return <XCircle className="h-4 w-4 text-rose-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Verified':
        return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
      case 'Misleading':
        return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
      case 'False':
        return 'text-rose-600 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-gray-600 bg-gray-500/10 border-gray-500/20';
    }
  };

  // Loading State UI
  if (loading) {
    return (
      <div className="min-h-[80vh] bg-background flex flex-col items-center justify-center p-6 text-center transition-colors duration-300">
        {/* Dynamic Scanning Circular Pulse */}
        <div className="relative mb-12 animate-fadeIn">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse"></div>
          <div className="w-32 h-32 rounded-full border-4 border-dashed border-primary/30 border-t-primary border-b-primary-hover animate-spin flex items-center justify-center relative">
            <ShieldAlert className="w-12 h-12 text-primary animate-pulse" />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight sm:text-4xl mb-4 font-display">
          ClaimLens AI Analyzing Video
        </h2>
        
        {/* Animated Loading Text Box */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 max-w-lg w-full shadow-md backdrop-blur-sm">
          <div className="flex items-center justify-center gap-3 text-primary font-bold mb-3 text-sm tracking-wide">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>AI PIPELINE SCANNING...</span>
          </div>
          <p className="text-on-surface-variant text-base sm:text-lg animate-pulse min-h-[2.5rem] font-medium leading-relaxed">
            {steps[loadingStep]}
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-surface-container-high rounded-full h-2 mt-5 overflow-hidden">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${((loadingStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // Error State UI
  if (error) {
    return (
      <div className="min-h-[85vh] bg-background flex items-center justify-center p-6 transition-colors duration-300">
        <div className="max-w-md w-full bg-surface-container-lowest border border-rose-500/20 rounded-3xl p-8 text-center shadow-md animate-fadeIn">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-6">
            <ShieldAlert className="h-8 w-8 text-rose-600" />
          </div>
          <h3 className="text-2xl font-bold text-on-surface mb-3 font-display">Analysis Failed</h3>
          <p className="text-on-surface-variant mb-6 leading-relaxed text-sm">{error}</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate('/')}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-background text-on-surface py-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Breadcrumb */}
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-8 group font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to analysis</span>
        </button>

        {/* Dashboard Grid Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-10">
          
          {/* Card 1: Radial Gauge for Overall Score */}
          <div className="lg:col-span-1 bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10"></div>
            
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-6">Overall Credibility Score</h3>
            
            {/* Visual Circular Meter */}
            <div className="relative w-44 h-44 flex items-center justify-center mb-6">
              {/* SVG Background Circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="88" cy="88" r="76" 
                  className="stroke-outline-variant/60" 
                  strokeWidth="10" 
                  fill="transparent" 
                />
                <circle 
                  cx="88" cy="88" r="76" 
                  className={`transition-all duration-1000 ease-out ${
                    report.overallScore >= 80 ? "stroke-emerald-500" :
                    report.overallScore >= 50 ? "stroke-amber-500" : "stroke-rose-500"
                  }`} 
                  strokeWidth="10" 
                  fill="transparent" 
                  strokeDasharray={477.5}
                  strokeDashoffset={477.5 - (477.5 * report.overallScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              {/* Inner Text */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-on-surface tracking-tight">{report.overallScore}</span>
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-1">out of 100</span>
              </div>
            </div>

            <div className={`px-4 py-1.5 rounded-full border text-xs font-semibold ${getScoreColor(report.overallScore)}`}>
              {report.overallScore >= 80 ? "Highly Credible" :
               report.overallScore >= 50 ? "Caution Advised" : "Highly Misleading"}
            </div>

            {/* Direct Official Brand Dispute Trigger */}
            {user?.role === 'organization' && user?.organizationId === report.organizationId && (
              <button
                onClick={() => {
                  setDisputeClaimText('');
                  setDisputeReasonText('');
                  setDisputeEvidenceLinks(['']);
                  setDisputeError('');
                  setIsDisputeModalOpen(true);
                }}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white bg-amber-600 hover:bg-amber-700 font-bold transition-all shadow-md shadow-amber-600/10 cursor-pointer text-xs uppercase tracking-wider"
              >
                <span>File Official Dispute</span>
              </button>
            )}
          </div>

          {/* Card 2: AI Verdict Box */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-primary-hover to-amber-500"></div>
            
            <div>
              <div className="flex items-center gap-2.5 text-primary font-bold text-sm uppercase tracking-wider mb-4">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>Executive Verdict</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface mb-4 leading-tight font-display tracking-tight">
                AI Pipeline Summary
              </h2>
              <p className="text-on-surface-variant text-base sm:text-lg leading-relaxed mb-6 italic font-medium">
                "{report.verdict}"
              </p>
            </div>

            {/* Score Breakdown Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-outline-variant/60">
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-on-surface-variant uppercase tracking-wider">Audio Credibility</span>
                  <span className="text-on-surface">{report.audioScore}/100</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(report.audioScore)}`} 
                    style={{ width: `${report.audioScore}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-on-surface-variant uppercase tracking-wider">Text & Disclaimer</span>
                  <span className="text-on-surface">{report.textScore}/100</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(report.textScore)}`} 
                    style={{ width: `${report.textScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Detailed Sections (Claims and Visual Flags) */}
        {!user ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 sm:p-12 text-center shadow-sm relative overflow-hidden mt-6 animate-fadeIn">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -z-10"></div>
            
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-6 text-primary">
              <Lock className="h-7 w-7 animate-pulse" />
            </div>

            <h3 className="text-3xl font-extrabold text-on-surface mb-3 font-display tracking-tight">
              Login to See Complete Report
            </h3>
            
            <p className="text-on-surface-variant text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed font-medium">
              Unlock the detailed audit dashboard including automated fact-check Google search evidence, disclaimer OCR text audits, visual manipulation checklist markers, and access the open community discussion boards.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-sm transition-all duration-200 cursor-pointer"
              >
                Log In to ClaimLens
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto px-8 py-3 border border-outline-variant hover:bg-surface-container rounded-xl text-sm font-bold text-on-surface-variant transition-all duration-200 cursor-pointer"
              >
                Create Free Account
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Left Columns (Col-span-2): Fact-Checked Claims */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-extrabold text-on-surface font-display">Fact-Checked Claims ({report.flaggedClaims.length})</h3>
                </div>

                {report.flaggedClaims.length === 0 ? (
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 text-center shadow-sm">
                    <Info className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-on-surface mb-1">No Factual Claims Detected</h4>
                    <p className="text-on-surface-variant text-sm">
                      This advertisement does not make any checkable, factual statements in its transcript or on-screen text.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {report.flaggedClaims.map((item, idx) => {
                      const isExpanded = expandedClaim === idx;
                      return (
                        <div 
                          key={idx} 
                          className={`bg-surface-container-lowest border transition-all rounded-2xl overflow-hidden shadow-sm ${
                            isExpanded ? "border-primary/40 ring-1 ring-primary/20" : "border-outline-variant hover:border-outline-variant/80"
                          }`}
                        >
                          {/* Accordion Toggle Header */}
                          <button 
                            onClick={() => toggleClaim(idx)}
                            className="w-full text-left p-6 flex justify-between items-center gap-4 transition-colors cursor-pointer"
                          >
                            <div className="flex-1">
                              <p className="text-on-surface font-bold text-base mb-2.5 leading-snug">
                                "{item.claim}"
                              </p>
                              <div className="flex items-center gap-3">
                                {getStatusBadge(item.status)}
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-on-surface-variant flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-on-surface-variant flex-shrink-0" />
                            )}
                          </button>

                          {/* Accordion Expandable Content */}
                          {isExpanded && (
                            <div className="px-6 pb-6 pt-4 border-t border-outline-variant/60 bg-surface-container-low/50">
                              <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">
                                Fact-Check Google Search Evidence
                              </h4>
                              <p className="text-on-surface-variant text-sm leading-relaxed font-medium">
                                {item.evidence}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column (Col-span-1): Visual manipulation Checklist */}
              <div className="lg:col-span-1">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldAlert className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-extrabold text-on-surface font-display">Visual Deceptions ({report.visualFlags.length})</h3>
                </div>

                {report.visualFlags.length === 0 ? (
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 text-center shadow-sm">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-on-surface mb-1">Visually Honest</h4>
                    <p className="text-on-surface-variant text-sm">
                      Gemini frame scanner did not detect any misleading visual tricks or staging in this ad!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {report.visualFlags.map((flag, idx) => (
                      <div key={idx} className="bg-rose-500/5 border border-rose-500/15 rounded-2xl p-6 shadow-sm hover:border-rose-500/25 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm animate-pulse"></div>
                          <h4 className="text-rose-700 font-bold text-base leading-tight">
                            {flag.issue}
                          </h4>
                        </div>
                        <p className="text-on-surface-variant text-sm leading-relaxed font-medium">
                          {flag.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Video Meta Info card */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 mt-8 shadow-sm">
                  <h4 className="text-xs font-black text-on-surface uppercase tracking-wider mb-4 border-b border-outline-variant/60 pb-2">
                    Metadata Details
                  </h4>
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant font-medium">Audio Language</span>
                      <span className="text-on-surface font-bold uppercase">{report.languageDetected}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant font-medium">Original Link</span>
                      <a 
                        href={report.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:text-primary-hover font-bold transition-colors"
                      >
                        <span>View Video</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Community Discussion Board */}
            <div className="mt-16 pt-10 border-t border-outline-variant/60">
              <div className="flex items-center gap-3 mb-8">
                <MessageSquare className="w-7 h-7 text-primary" />
                <h3 className="text-2xl font-extrabold text-on-surface font-display">Community Discussion</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left/Col-span-2: Feed of opinions */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Form to submit opinion */}
                  {user ? (
                    (user.role !== 'admin' && user.role !== 'organization') ? (
                      <form onSubmit={handleSubmitOpinion} className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm space-y-4">
                        <h4 className="text-xs font-black text-on-surface uppercase tracking-wider mb-1">Share your opinion</h4>
                        
                        {/* Brand Tag Dropdown Selection */}
                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                            Concerned Brand / Organization (Required database match)
                          </label>
                          {loadingOrgs ? (
                            <div className="text-xs text-on-surface-variant animate-pulse">Loading brands...</div>
                          ) : (
                            <select
                              required
                              value={selectedOrgId}
                              onChange={(e) => setSelectedOrgId(e.target.value)}
                              className="block w-full px-4 py-3 border border-outline-variant rounded-xl shadow-sm bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-xs font-medium cursor-pointer"
                            >
                              <option value="">-- Choose brand to tag --</option>
                              {organizations.map((org) => (
                                <option key={org._id} value={org._id}>
                                  {org.organizationName} (ID: {org.orgCode || org._id})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="relative">
                          <textarea
                            rows="3"
                            required
                            value={newOpinion}
                            onChange={(e) => setNewOpinion(e.target.value)}
                            className="w-full appearance-none block p-4 pr-12 border border-outline-variant rounded-2xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm resize-none"
                            placeholder="What is your review or thoughts on the credibility of this advertisement?"
                          />
                          <button
                            type="submit"
                            disabled={opinionSubmitLoading || !newOpinion.trim() || !selectedOrgId}
                            className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary hover:bg-primary-hover text-white transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {opinionSubmitLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="text-xs font-bold text-amber-600 bg-amber-500/10 px-4 py-3.5 rounded-2xl border border-amber-500/20 text-center font-display uppercase tracking-wider">
                        Administrators & Organization Representatives cannot post community opinions.
                      </div>
                    )
                  ) : (
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 text-center shadow-sm">
                      <p className="text-on-surface-variant text-sm font-medium">
                        Please{" "}
                        <Link to="/login" className="text-primary hover:text-primary-hover font-bold underline">
                          log in
                        </Link>{" "}
                        to share your opinion with the community!
                      </p>
                    </div>
                  )}

                  {/* Feed List */}
                  {opinionsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : opinions.length === 0 ? (
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-8 text-center shadow-sm">
                      <MessageSquare className="w-12 h-12 text-outline mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-on-surface mb-1">No Opinions Yet</h4>
                      <p className="text-on-surface-variant text-sm">
                        Be the first to share your opinion or verdict about this ad!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {opinions.map((post) => {
                        const isLiked = user && post.likes?.includes(user._id);
                        return (
                          <div key={post._id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-outline-variant/60">
                              <div className="flex items-center gap-2">
                                <span className="text-primary font-bold text-sm">
                                  @{post.userId?.username || 'anonymous'}
                                </span>
                                {post.organizationName && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 font-black uppercase tracking-wider">
                                    Tagged: {post.organizationName}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-on-surface-variant font-medium">
                                {new Date(post.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <p className="text-on-surface text-sm leading-relaxed mb-4">
                              {post.opinionText}
                            </p>
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => handleLikeOpinion(post._id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                  isLiked
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:text-on-surface"
                                }`}
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                <span>{post.likes.length} Upvotes</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right/Col-span-1: Info Sidebar card */}
                <div className="lg:col-span-1 bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm">
                  <h4 className="text-xs font-black text-on-surface uppercase tracking-wider mb-4 border-b border-outline-variant/60 pb-2">
                    Community Guidelines
                  </h4>
                  <ul className="text-xs text-on-surface-variant space-y-3 list-disc pl-4 leading-relaxed font-medium">
                    <li>Keep the discussion focused strictly on the ad's credibility.</li>
                    <li>Avoid insulting other users; keep opinions respectful.</li>
                    <li>If citing scientific evidence, try to describe the study or findings briefly.</li>
                    <li>Double check your facts before disputing verified ratings!</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Brand Dispute Challenge Modal */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative animate-scaleUp">
            <h3 className="text-2xl font-extrabold text-on-surface font-display mb-2 flex items-center gap-2">
              <span>File Official Brand Dispute</span>
            </h3>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              As the verified representative of <span className="font-bold text-primary">{report.organizationName}</span>, you are filing a formal credibility dispute challenge against this report.
            </p>

            <form onSubmit={handleDisputeSubmit} className="space-y-6">
              {disputeError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs font-semibold rounded-xl">
                  {disputeError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2.5">
                  Which specific claim or visual flag is incorrect?
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 'Claim #1 stating our serum causes 100% cure is misunderstood'"
                  value={disputeClaimText}
                  onChange={(e) => setDisputeClaimText(e.target.value)}
                  className="block w-full p-3.5 border border-outline-variant bg-surface-container-low text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2.5">
                  Factual Clarification & Evidence Reason
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Please state why our AI classification is incorrect and offer factual reasons backed by independent studies or documentation."
                  value={disputeReasonText}
                  onChange={(e) => setDisputeReasonText(e.target.value)}
                  className="block w-full p-3.5 border border-outline-variant bg-surface-container-low text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2.5">
                  Evidence / Verification Links (Optional)
                </label>
                {disputeEvidenceLinks.map((link, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={link}
                      onChange={(e) => {
                        const newLinks = [...disputeEvidenceLinks];
                        newLinks[idx] = e.target.value;
                        setDisputeEvidenceLinks(newLinks);
                      }}
                      className="block flex-1 p-3.5 border border-outline-variant bg-surface-container-low text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                    {disputeEvidenceLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDisputeEvidenceLinks(disputeEvidenceLinks.filter((_, i) => i !== idx))}
                        className="p-3 text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer text-sm font-bold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setDisputeEvidenceLinks([...disputeEvidenceLinks, ''])}
                  className="mt-1 text-xs text-primary hover:text-primary-hover font-bold transition-colors cursor-pointer"
                >
                  + Add Another Link
                </button>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="px-6 py-3 border border-outline-variant hover:bg-surface-container rounded-xl text-xs font-bold text-on-surface-variant transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/10 cursor-pointer"
                >
                  {submittingDispute ? 'Submitting...' : 'Submit Official Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
