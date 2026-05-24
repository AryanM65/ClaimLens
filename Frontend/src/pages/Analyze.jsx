import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Search, ShieldAlert, Sparkles, Languages, CheckCircle2, 
  HelpCircle, Link2, Info, ArrowRight, Loader2, Building2, PlayCircle
} from 'lucide-react';
import axios from 'axios';

const Analyze = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if not logged in or non-auditor role
  useEffect(() => {
    if (!user) {
      setErrorMsg('You must be logged in to access the advanced credibility pipeline.');
    } else if (user.role !== 'user') {
      navigate(user.role === 'admin' ? '/admin' : '/organization-dashboard');
    } else {
      fetchOrganizations();
    }
  }, [user, navigate]);

  const fetchOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const res = await axios.get('/api/v1/organizations/public/list');
      setOrganizations(res.data || []);
    } catch (err) {
      console.error('Failed to load organizations for tagging:', err);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleStartAnalysis = (e) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    
    // Construct search params with URL and optional organization tag
    let targetPath = `/report?url=${encodeURIComponent(videoUrl.trim())}`;
    if (selectedOrgId) {
      targetPath += `&organizationId=${selectedOrgId}`;
    }
    navigate(targetPath);
  };

  if (!user) {
    return (
      <div className="min-h-[80vh] bg-background flex items-center justify-center p-6 transition-colors duration-300">
        <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 text-center shadow-md animate-fadeIn">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-6 text-primary">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-bold text-on-surface mb-3 font-display">Authentication Required</h3>
          <p className="text-on-surface-variant mb-6 leading-relaxed text-sm">
            Please log in or create an account to access our automated, high-fidelity ad credibility scanning pipeline.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-primary hover:bg-primary-hover text-white transition-colors cursor-pointer"
            >
              Log In to ClaimLens
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold border border-outline-variant hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
            >
              Sign Up For Free
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface py-12 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center mb-10 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/25 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Advanced Credibility Auditor
          </div>
          <h1 className="text-4xl font-extrabold text-on-surface sm:text-5xl font-display tracking-tight">
            Analyze Ad Credibility
          </h1>
          <p className="mt-3 text-on-surface-variant text-base sm:text-lg max-w-xl mx-auto font-medium">
            Deploy ClaimLens AI on any marketing campaign video to audit claims, OCR text, and verify visual context in seconds.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 shadow-sm mb-10 animate-fadeIn">
          <form onSubmit={handleStartAnalysis} className="space-y-6">
            
            {/* Input 1: Video URL */}
            <div>
              <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-primary" />
                Advertisement Video URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Paste YouTube, Instagram, or TikTok URL here..."
                  className="block w-full p-4.5 pr-12 border border-outline-variant rounded-2xl bg-surface-container-low text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-medium"
                />
                <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none text-on-surface-variant/40">
                  <PlayCircle className="w-5 h-5" />
                </div>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1.5 block font-medium">
                Tip: Copy the link directly from the video share panel or URL address bar.
              </span>
            </div>

            {/* Input 2: Brand Tagging Dropdown */}
            <div>
              <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary" />
                Target Organization / Brand Tag (Optional)
              </label>
              {loadingOrgs ? (
                <div className="flex items-center gap-2 text-xs text-on-surface-variant py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Fetching verified brand registry...</span>
                </div>
              ) : (
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="block w-full p-4 border border-outline-variant rounded-2xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-medium cursor-pointer"
                >
                  <option value="">-- No organization tag (General Analysis) --</option>
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.organizationName} (ID: {org.orgCode || org._id})
                    </option>
                  ))}
                </select>
              )}
              <span className="text-[11px] text-on-surface-variant mt-1.5 block font-medium">
                Selecting a verified brand ensures that matched brand representatives can officially review or dispute report details.
              </span>
            </div>

            {/* Start Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={!videoUrl.trim()}
                className="w-full py-4 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-2xl text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Initiate AI Verification Pipeline</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </form>
        </div>

        {/* Informative Guidance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          
          <div className="bg-surface-container border border-outline-variant/60 rounded-2xl p-5 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-3">
              <Languages className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-on-surface text-sm font-display">Multilingual Audio Transcribing</h4>
            <p className="text-on-surface-variant text-xs mt-2 leading-relaxed font-medium">
              Sarvam transcribe pipeline processes mixed voiceovers (English, Hindi, Hinglish) to pull verbal marketing claims accurately.
            </p>
          </div>

          <div className="bg-surface-container border border-outline-variant/60 rounded-2xl p-5 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-3">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-on-surface text-sm font-display">Visual Deception Checks</h4>
            <p className="text-on-surface-variant text-xs mt-2 leading-relaxed font-medium">
              AI deep frame scanning audits keyframes to detect graphical trickery, fake product models, and staging indicators.
            </p>
          </div>

          <div className="bg-surface-container border border-outline-variant/60 rounded-2xl p-5 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-3">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-on-surface text-sm font-display">Automated Fact Checking</h4>
            <p className="text-on-surface-variant text-xs mt-2 leading-relaxed font-medium">
              Extracted claims are indexed and researched live using Google Search indices to construct factual corroborative score breakdowns.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Analyze;
