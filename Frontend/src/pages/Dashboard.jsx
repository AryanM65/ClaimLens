import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, History, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const { user, loading, setUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        setReportsLoading(true);
        const response = await axios.get('/api/v1/analysis/reports');
        setReports(response.data || []);
      } catch (err) {
        console.error("Failed to load reports history", err);
      } finally {
        setReportsLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleLogout = async () => {
    try {
      await axios.post('/api/v1/auth/logout');
      setUser(null);
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Header */}
        <div className="md:flex md:items-center md:justify-between mb-10 border-b border-gray-800 pb-5">
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-bold leading-7 text-white sm:text-4xl sm:truncate flex items-center gap-3">
              <ShieldCheck className="h-10 w-10 text-indigo-500" />
              Welcome back, @{user.username || user.name.split(' ')[0]}
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Manage your credibility reports and account settings.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-300 bg-gray-900 hover:bg-gray-800 focus:outline-none transition-colors"
            >
              <LogOut className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          
          {/* Card 1: New Analysis */}
          <div className="bg-gradient-to-br from-indigo-900/50 to-gray-900 border border-indigo-500/30 overflow-hidden rounded-2xl shadow-lg hover:border-indigo-500/60 transition-colors group">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500/20 p-3 rounded-lg border border-indigo-500/30">
                  <ShieldCheck className="h-6 w-6 text-indigo-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Quick Action</dt>
                    <dd className="text-lg font-semibold text-white">New Analysis</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-900/50 px-6 py-4 border-t border-indigo-500/20">
              <div className="text-sm">
                <a href="/" className="font-medium text-indigo-400 hover:text-indigo-300 flex items-center">
                  Analyze a new URL
                  <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                </a>
              </div>
            </div>
          </div>

          {/* Card 2: Report History Metric */}
          <div className="bg-gray-900 border border-gray-800 overflow-hidden rounded-2xl shadow-lg hover:border-gray-700 transition-colors">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-800 p-3 rounded-lg border border-gray-700">
                  <History className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Total Analyses</dt>
                    <dd className="text-lg font-semibold text-white">
                      {reportsLoading ? "..." : `${reports.length} Reports`}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/30 px-6 py-4 border-t border-gray-800">
              <div className="text-sm text-gray-400">
                Logged securely in your MongoDB database
              </div>
            </div>
          </div>

        </div>

        {/* Dynamic Recent Reports List */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <History className="h-6 w-6 text-indigo-500" />
            Recent Credibility Analyses
          </h3>

          {reportsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-12 text-center shadow-lg">
              <History className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-1">No reports generated yet</h4>
              <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
                Paste an ad URL on the home page and run your first AI analysis to build your credibility dashboard history!
              </p>
              <a 
                href="/" 
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Analyze Your First Video
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports.map((report) => (
                <div 
                  key={report._id} 
                  className="bg-gray-900/40 border border-gray-850 rounded-2xl p-6 hover:border-indigo-500/30 transition-all flex flex-col justify-between shadow-xl backdrop-blur-sm group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <span className="text-xs font-semibold text-indigo-400 font-mono tracking-wider uppercase">
                        {report.languageDetected} Ad Analysis
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        report.overallScore >= 80 ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" :
                        report.overallScore >= 50 ? "text-amber-400 border-amber-500/20 bg-amber-500/10" :
                        "text-rose-400 border-rose-500/20 bg-rose-500/10"
                      }`}>
                        Score: {report.overallScore}/100
                      </span>
                    </div>
                    <p className="text-white font-semibold text-sm truncate mb-2 group-hover:text-indigo-300 transition-colors">
                      {report.url}
                    </p>
                    <p className="text-gray-400 text-xs line-clamp-2 italic mb-4">
                      "{report.verdict}"
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-800 mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                    <a 
                      href={`/report?url=${encodeURIComponent(report.url)}`}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold text-xs flex items-center gap-1"
                    >
                      View Full Dashboard →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
