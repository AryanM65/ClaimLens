import { useState, useEffect } from 'react';
import { Search, Sparkles, Languages, CheckCircle2, ShieldAlert, UploadCloud, Volume2, Cpu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Home = () => {
  const [url, setUrl] = useState('');
  const { user, isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/how-it-works') {
      const element = document.getElementById('how-it-works');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (location.pathname === '/features') {
      const element = document.getElementById('features');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  // Fetch organizations only if logged in as user
  useEffect(() => {
    if (isAuthenticated && user?.role === 'user') {
      const fetchOrganizations = async () => {
        try {
          setLoadingOrgs(true);
          const res = await axios.get('/api/v1/organizations/public/list');
          setOrganizations(res.data || []);
        } catch (err) {
          console.error("Failed to load organizations:", err);
        } finally {
          setLoadingOrgs(false);
        }
      };
      fetchOrganizations();
    }
  }, [isAuthenticated, user]);

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (url) {
      let target = `/report?url=${encodeURIComponent(url)}`;
      if (selectedOrgId) {
        target += `&orgId=${encodeURIComponent(selectedOrgId)}`;
      }
      navigate(target);
    }
  };

  return (
    <div className="bg-background min-h-screen text-on-background transition-all duration-300">
      
      {/* Hero Section */}
      <div className="relative isolate pt-24 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        
        {/* Soft Background Accent Glows */}
        <div className="absolute top-0 -z-10 transform-gpu overflow-hidden blur-3xl opacity-20" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-5xl font-extrabold tracking-tight text-on-surface sm:text-7xl mb-8 font-display">
              Analyze Ad Credibility <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-600 to-purple-600">In Seconds.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-on-surface-variant max-w-2xl mx-auto">
              Paste any YouTube, Instagram, or TikTok ad URL. Our AI pipeline detects false claims, visual manipulation, and provides a definitive credibility score using Gemini 2.0 and Serper fact-checking.
            </p>

            {/* Conditional URL Input / Role restrictions / Guest CTA Form */}
            {!isAuthenticated ? (
              <div className="mt-10 p-8 rounded-3xl border border-outline-variant bg-surface-container-lowest backdrop-blur-sm shadow-xl max-w-2xl mx-auto text-center">
                <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-bold text-on-surface font-display mb-2">
                  Log In to Analyze Ads
                </h3>
                <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                  To run visual, transcript, and fact-checking credibility audits on ad campaigns, you must be logged in as a verified auditor user.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Go to Login Page
                </button>
              </div>
            ) : user?.role !== 'user' ? (
              <div className="mt-10 p-8 rounded-3xl border border-amber-500/20 bg-amber-500/5 max-w-2xl mx-auto text-center">
                <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-amber-800 font-display mb-2">
                  Audits Restricted for Your Role
                </h3>
                <p className="text-sm text-amber-700/80 leading-relaxed">
                  You are currently logged in as a {user?.role === 'admin' ? 'Platform Administrator' : 'Brand Representative'}. Report generation is restricted to standard auditor accounts only.
                </p>
              </div>
            ) : (
              <div className="mt-10 flex flex-col gap-6 max-w-2xl mx-auto">
                <form onSubmit={handleAnalyze} className="w-full relative group">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                    <Search className="w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                  </div>
                  <input 
                    type="url" 
                    className="block w-full p-5 ps-12 text-sm text-on-surface border border-outline-variant rounded-2xl bg-surface-container-lowest backdrop-blur-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-on-surface-variant/40 shadow-xl shadow-surface-container-high/40" 
                    placeholder="Paste ad URL here (e.g., https://youtube.com/watch?v=...)" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required 
                  />
                  <button type="submit" className="text-white absolute end-2.5 bottom-2.5 bg-primary hover:bg-primary-hover focus:ring-4 focus:outline-none focus:ring-primary/30 font-medium rounded-xl text-sm px-6 py-2.5 transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]">
                    Analyze Now
                  </button>
                </form>

                <div className="p-5 rounded-2xl border border-outline-variant bg-surface-container-lowest text-start shadow-sm">
                  <label className="block text-xs font-bold text-on-surface-variant mb-2.5 uppercase tracking-wider">
                    Tag Brand / Organization (Database Match Only)
                  </label>
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="block w-full p-3.5 text-xs text-on-surface border border-outline-variant rounded-xl bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">General / No specific brand</option>
                    {organizations.map((org) => (
                      <option key={org._id} value={org._id}>
                        {org.organizationName} (ID: {org.orgCode || org._id})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[10px] text-on-surface-variant/70 leading-normal">
                    Organizations must exist in the database. Tagging a brand automatically maps this report to their official verified profile.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div id="how-it-works" className="py-24 sm:py-32 bg-background border-t border-outline-variant">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-primary font-display uppercase tracking-widest">Step-By-Step Process</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-on-surface sm:text-4xl font-display">
              How ClaimLens Audits Credibility
            </p>
            <p className="mt-6 text-lg leading-8 text-on-surface-variant">
              ClaimLens processes ad campaigns through a comprehensive, four-stage automated audit pipeline to extract facts and verify claims.
            </p>
          </div>

          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 overflow-hidden lg:mx-0 lg:max-w-none lg:grid-cols-4 sm:grid-cols-2">
            
            {/* Step 1 */}
            <div className="relative bg-surface-container-lowest border border-outline-variant p-6 rounded-3xl shadow-sm hover:border-primary/45 transition-all duration-300 group hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <span className="text-4xl font-extrabold text-outline-variant group-hover:text-primary/20 font-display transition-colors">01</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface font-display leading-7">Ingestion & OCR</h3>
              <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
                The ad video is downloaded and broken into frames. Tesseract OCR scans every on-screen text block and fine-print disclaimer.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-surface-container-lowest border border-outline-variant p-6 rounded-3xl shadow-sm hover:border-primary/45 transition-all duration-300 group hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                  <Volume2 className="h-6 w-6" />
                </div>
                <span className="text-4xl font-extrabold text-outline-variant group-hover:text-primary/20 font-display transition-colors">02</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface font-display leading-7">Multilingual Audio</h3>
              <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
                Sarvam AI transcribes audio streams perfectly, detecting speech in English, Hindi, or mixed Hinglish voiceovers.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-surface-container-lowest border border-outline-variant p-6 rounded-3xl shadow-sm hover:border-primary/45 transition-all duration-300 group hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                  <Cpu className="h-6 w-6" />
                </div>
                <span className="text-4xl font-extrabold text-outline-variant group-hover:text-primary/20 font-display transition-colors">03</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface font-display leading-7">Visual Verification</h3>
              <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
                Gemini 2.0 scans sampled frames to flag CGI manipulations, misleading mockups, or staged scientific expert set designs.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative bg-surface-container-lowest border border-outline-variant p-6 rounded-3xl shadow-sm hover:border-primary/45 transition-all duration-300 group hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <span className="text-4xl font-extrabold text-outline-variant group-hover:text-primary/20 font-display transition-colors">04</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface font-display leading-7">Fact-Check Audit</h3>
              <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
                Claims are cross-checked against search databases using Serper API to compile a definitive score and live report.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 sm:py-32 bg-surface-container-low border-t border-outline-variant">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary font-display uppercase tracking-widest">Advanced Pipeline</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-on-surface sm:text-4xl font-display">
              Everything you need to spot the truth
            </p>
            <p className="mt-6 text-lg leading-8 text-on-surface-variant">
              Our backend utilizes industry-leading AI models to rip apart every frame, every spoken word, and every on-screen disclaimer.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              
              {/* Visual & Frame Analysis */}
              <div className="flex flex-col bg-surface-container-lowest border border-outline-variant p-8 rounded-2xl shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-on-surface font-display">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  Visual & Frame Analysis
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-on-surface-variant">
                  <p className="flex-auto text-sm">Gemini 2.0 Flash analyzes extracted keyframes for misleading before/after comparisons, CGI, fake expert staging, and lighting tricks.</p>
                </dd>
              </div>

              {/* Multilingual Extraction */}
              <div className="flex flex-col bg-surface-container-lowest border border-outline-variant p-8 rounded-2xl shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-on-surface font-display">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <Languages className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  Multilingual Extraction
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-on-surface-variant">
                  <p className="flex-auto text-sm">Sarvam AI transcribes speech perfectly in English, Hindi, and Hinglish, while Tesseract OCR grabs every fine-print disclaimer from the video.</p>
                </dd>
              </div>

              {/* Live Fact-Checking */}
              <div className="flex flex-col bg-surface-container-lowest border border-outline-variant p-8 rounded-2xl shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-on-surface font-display">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  Live Fact-Checking
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-on-surface-variant">
                  <p className="flex-auto text-sm">Every extracted claim is cross-referenced live using the Serper Google Search API to give you a definitive Verified or False verdict.</p>
                </dd>
              </div>

            </dl>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
