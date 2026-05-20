import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Sparkles, Languages, 
  CheckCircle2, XCircle, Info, ExternalLink, RefreshCw, ArrowLeft,
  ChevronDown, ChevronUp, FileText, BarChart3
} from 'lucide-react';
import axios from 'axios';

const Report = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const videoUrl = searchParams.get('url');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [expandedClaim, setExpandedClaim] = useState(null);

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
        
        // Direct, synchronous Express analysis call
        const response = await axios.post('/api/analysis/analyse', { url: videoUrl });
        setReport(response.data);
      } catch (err) {
        console.error("Analysis API failed:", err);
        setError(err.response?.data?.error || "An error occurred during video analysis. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [videoUrl]);

  const toggleClaim = (index) => {
    setExpandedClaim(expandedClaim === index ? null : index);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 50) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return "from-emerald-500 to-teal-500 shadow-emerald-500/20";
    if (score >= 50) return "from-amber-500 to-orange-500 shadow-amber-500/20";
    return "from-rose-500 to-red-500 shadow-rose-500/20";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </span>
        );
      case 'Misleading':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Misleading
          </span>
        );
      case 'False':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> False
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
            <Info className="w-3.5 h-3.5" /> Unverifiable
          </span>
        );
    }
  };

  // Loading State UI
  if (loading) {
    return (
      <div className="min-h-[80vh] bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
        {/* Dynamic Scanning Circular Pulse */}
        <div className="relative mb-12">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse"></div>
          <div className="w-32 h-32 rounded-full border-4 border-dashed border-indigo-500/40 border-t-indigo-500 border-b-indigo-400 animate-spin flex items-center justify-center relative">
            <ShieldAlert className="w-12 h-12 text-indigo-400 animate-pulse" />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl mb-4">
          ClaimLens AI Analyzing Video
        </h2>
        
        {/* Animated Loading Text Box */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 max-w-lg w-full backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-center gap-3 text-indigo-400 font-semibold mb-3">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>AI Pipeline Scanning...</span>
          </div>
          <p className="text-gray-300 text-lg animate-pulse min-h-[2.5rem]">
            {steps[loadingStep]}
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 mt-5 overflow-hidden">
            <div 
              className="bg-indigo-500 h-2 rounded-full transition-all duration-1000 ease-out" 
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
      <div className="min-h-[85vh] bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-900 border border-rose-500/30 rounded-3xl p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-6">
            <ShieldAlert className="h-8 w-8 text-rose-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Analysis Failed</h3>
          <p className="text-gray-400 mb-6 leading-relaxed">{error}</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate('/')}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-white transition-colors"
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
    <div className="min-h-screen bg-gray-950 text-gray-200 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Breadcrumb */}
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to analysis</span>
        </button>

        {/* Dashboard Grid Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-10">
          
          {/* Card 1: Radial Gauge for Overall Score */}
          <div className="lg:col-span-1 bg-gray-900/60 border border-gray-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -z-10"></div>
            
            <h3 className="text-lg font-semibold text-gray-400 mb-6">Overall Credibility Score</h3>
            
            {/* Visual Circular Meter */}
            <div className="relative w-44 h-44 flex items-center justify-center mb-6">
              {/* SVG Background Circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="88" cy="88" r="76" 
                  className="stroke-gray-800" 
                  strokeWidth="12" 
                  fill="transparent" 
                />
                <circle 
                  cx="88" cy="88" r="76" 
                  className={`transition-all duration-1000 ease-out ${
                    report.overallScore >= 80 ? "stroke-emerald-500" :
                    report.overallScore >= 50 ? "stroke-amber-500" : "stroke-rose-500"
                  }`} 
                  strokeWidth="12" 
                  fill="transparent" 
                  strokeDasharray={477.5}
                  strokeDashoffset={477.5 - (477.5 * report.overallScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              {/* Inner Text */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-5xl font-extrabold text-white">{report.overallScore}</span>
                <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">out of 100</span>
              </div>
            </div>

            <div className={`px-4 py-1.5 rounded-full border text-xs font-semibold ${getScoreColor(report.overallScore)}`}>
              {report.overallScore >= 80 ? "Highly Credible" :
               report.overallScore >= 50 ? "Caution Advised" : "Highly Misleading"}
            </div>
          </div>

          {/* Card 2: AI Verdict Box */}
          <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-3xl p-8 shadow-xl flex flex-col justify-between h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"></div>
            
            <div>
              <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-sm uppercase tracking-wider mb-4">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>Executive Verdict</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 leading-tight">
                AI Pipeline Summary
              </h2>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6 italic">
                "{report.verdict}"
              </p>
            </div>

            {/* Score Breakdown Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-800">
              <div>
                <div className="flex justify-between items-center text-sm font-semibold mb-2">
                  <span className="text-gray-400">Audio Credibility</span>
                  <span className="text-white">{report.audioScore}/100</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(report.audioScore)}`} 
                    style={{ width: `${report.audioScore}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center text-sm font-semibold mb-2">
                  <span className="text-gray-400">Text & Disclaimer Credibility</span>
                  <span className="text-white">{report.textScore}/100</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Columns (Col-span-2): Fact-Checked Claims */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-xl font-bold text-white">Fact-Checked Claims ({report.flaggedClaims.length})</h3>
            </div>

            {report.flaggedClaims.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 text-center">
                <Info className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-1">No Factual Claims Detected</h4>
                <p className="text-gray-400 text-sm">
                  This advertisement does not make any specific, checkable claims in its transcript or on-screen disclaimers.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {report.flaggedClaims.map((item, idx) => {
                  const isExpanded = expandedClaim === idx;
                  return (
                    <div 
                      key={idx} 
                      className={`bg-gray-900 border transition-all rounded-2xl overflow-hidden shadow-lg ${
                        isExpanded ? "border-indigo-500/40 ring-1 ring-indigo-500/20" : "border-gray-800 hover:border-gray-700"
                      }`}
                    >
                      {/* Accordion Toggle Header */}
                      <button 
                        onClick={() => toggleClaim(idx)}
                        className="w-full text-left p-6 flex justify-between items-center gap-4 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-white font-semibold text-base mb-2">
                            "{item.claim}"
                          </p>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>

                      {/* Accordion Expandable Content */}
                      {isExpanded && (
                        <div className="px-6 pb-6 pt-4 border-t border-gray-800 bg-gray-950/40">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Fact-Check Google Search Evidence
                          </h4>
                          <p className="text-gray-300 text-sm leading-relaxed">
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
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              <h3 className="text-xl font-bold text-white">Visual Deceptions ({report.visualFlags.length})</h3>
            </div>

            {report.visualFlags.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-1">Visually Honest</h4>
                <p className="text-gray-400 text-sm">
                  Gemini frame scanner did not detect any misleading visual transformations or staging tactics in this ad!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {report.visualFlags.map((flag, idx) => (
                  <div key={idx} className="bg-gray-900/50 border border-rose-500/10 rounded-2xl p-6 shadow-md backdrop-blur-sm hover:border-rose-500/20 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm animate-pulse"></div>
                      <h4 className="text-white font-bold text-base leading-tight">
                        {flag.issue}
                      </h4>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {flag.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Video Meta Info card */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 mt-8 shadow-md">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
                Metadata Details
              </h4>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Audio Language</span>
                  <span className="text-gray-300 font-semibold uppercase">{report.languageDetected}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Original Link</span>
                  <a 
                    href={report.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <span>View Video</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Report;
