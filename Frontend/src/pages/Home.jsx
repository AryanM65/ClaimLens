import { useState } from 'react';
import { Search, ShieldAlert, Sparkles, Languages, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (url) {
      // In the future this will call the backend API and navigate to the loading/progress screen
      navigate(`/report?url=${encodeURIComponent(url)}`);
    }
  };

  return (
    <div className="bg-gray-950 min-h-screen text-gray-200">
      
      {/* Hero Section */}
      <div className="relative isolate pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        
        {/* Abstract Glow Effects */}
        <div className="absolute top-0 -z-10 transform-gpu overflow-hidden blur-3xl opacity-30" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl mb-8">
              Analyze Ad Credibility <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">In Seconds.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Paste any YouTube, Instagram, or TikTok ad URL. Our AI pipeline detects false claims, visual manipulation, and provides a definitive credibility score using Gemini 1.5 and Serper fact-checking.
            </p>

            {/* URL Input Form */}
            <div className="mt-10 flex items-center justify-center gap-x-6 relative max-w-2xl mx-auto">
              <form onSubmit={handleAnalyze} className="w-full relative group">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input 
                  type="url" 
                  className="block w-full p-5 ps-12 text-sm text-white border border-gray-700 rounded-2xl bg-gray-900/50 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-gray-500 shadow-xl shadow-black/50" 
                  placeholder="Paste ad URL here (e.g., https://youtube.com/watch?v=...)" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required 
                />
                <button type="submit" className="text-white absolute end-2.5 bottom-2.5 bg-indigo-600 hover:bg-indigo-500 focus:ring-4 focus:outline-none focus:ring-indigo-800 font-medium rounded-xl text-sm px-6 py-2.5 transition-all shadow-lg shadow-indigo-600/30">
                  Analyze Now
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 sm:py-32 bg-gray-900/50 border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-400">Advanced Pipeline</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything you need to spot the truth
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-400">
              Our backend utilizes industry-leading AI models to rip apart every frame, every spoken word, and every on-screen disclaimer.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col bg-gray-900 border border-gray-800 p-8 rounded-3xl shadow-xl hover:border-indigo-500/30 transition-colors">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <Sparkles className="h-6 w-6 text-indigo-400" aria-hidden="true" />
                  </div>
                  Visual & Frame Analysis
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-400">
                  <p className="flex-auto">Gemini 1.5 Flash analyzes extracted keyframes for misleading before/after comparisons, CGI, fake expert staging, and lighting tricks.</p>
                </dd>
              </div>
              <div className="flex flex-col bg-gray-900 border border-gray-800 p-8 rounded-3xl shadow-xl hover:border-indigo-500/30 transition-colors">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <Languages className="h-6 w-6 text-indigo-400" aria-hidden="true" />
                  </div>
                  Multilingual Extraction
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-400">
                  <p className="flex-auto">Groq Whisper large-v3 transcribes English, Hindi, and Hinglish perfectly, while EasyOCR grabs every fine-print disclaimer from the video.</p>
                </dd>
              </div>
              <div className="flex flex-col bg-gray-900 border border-gray-800 p-8 rounded-3xl shadow-xl hover:border-indigo-500/30 transition-colors">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <CheckCircle2 className="h-6 w-6 text-indigo-400" aria-hidden="true" />
                  </div>
                  Live Fact-Checking
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-400">
                  <p className="flex-auto">Every extracted claim is cross-referenced live using the Serper Google Search API to give you a definitive Verified or False verdict.</p>
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
