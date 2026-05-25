import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, History, LogOut, Loader2, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const { user, loading, setUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Fetch initial history
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

  // Active Background Polling Loop for processing/pending reports
  useEffect(() => {
    const activeJobs = reports.filter(r => r.status === 'processing');
    if (activeJobs.length === 0) return;

    let isSubscribed = true;

    const pollPendingJobs = async () => {
      try {
        const promises = activeJobs.map(async (job) => {
          const res = await axios.get(`/api/v1/analysis/status/${job.jobId}`);
          const { status, report: updatedReport } = res.data;

          if (status === 'completed' || status === 'failed') {
            // Update this specific report in local state dynamically!
            setReports(prevReports => 
              prevReports.map(r => r.jobId === job.jobId ? updatedReport : r)
            );
          }
        });
        await Promise.all(promises);
      } catch (err) {
        console.error("Dashboard background poll failed:", err);
      }
    };

    // Poll every 4 seconds
    const intervalId = setInterval(() => {
      if (isSubscribed) pollPendingJobs();
    }, 4000);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, [reports]);


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
    <div className="min-h-[calc(100vh-80px)] bg-background py-10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Header */}
        <div className="md:flex md:items-center md:justify-between mb-10 border-b border-outline-variant pb-5">
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-bold leading-7 text-on-surface sm:text-4xl sm:truncate flex items-center gap-3 font-display">
              <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
              Welcome back, @{user.username || user.name.split(' ')[0]}
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Manage your credibility reports and account settings.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2.5 border border-outline-variant rounded-xl shadow-sm text-sm font-medium text-on-surface-variant bg-surface-container-lowest hover:bg-surface-container-low focus:outline-none transition-colors"
            >
              <LogOut className="-ml-1 mr-2 h-5 w-5 text-on-surface-variant" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          
          {/* Card 1: New Analysis */}
          <div className="bg-gradient-to-br from-primary/10 to-surface-container border border-primary/25 overflow-hidden rounded-2xl shadow-sm hover:border-primary/50 transition-all duration-300 group">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary/15 p-3 rounded-xl border border-primary/20">
                  <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Quick Action</dt>
                    <dd className="text-lg font-bold text-on-surface font-display mt-0.5">New Analysis</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest px-6 py-4 border-t border-primary/10">
              <div className="text-sm">
                <a href="/" className="font-semibold text-primary hover:text-primary-hover flex items-center">
                  Analyze a new URL
                  <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                </a>
              </div>
            </div>
          </div>

          {/* Card 2: Report History Metric */}
          <div className="bg-surface-container-lowest border border-outline-variant overflow-hidden rounded-2xl shadow-sm hover:border-outline transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-surface-container-low p-3 rounded-xl border border-outline-variant">
                  <History className="h-6 w-6 text-on-surface-variant" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Total Analyses</dt>
                    <dd className="text-lg font-bold text-on-surface font-display mt-0.5">
                      {reportsLoading ? "..." : `${reports.length} Reports`}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-low/40 px-6 py-4 border-t border-outline-variant">
              <div className="text-xs text-on-surface-variant">
                Logged securely in your MongoDB database
              </div>
            </div>
          </div>

        </div>

        {/* Dynamic Recent Reports List */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2 font-display">
            <History className="h-6 w-6 text-primary" />
            Recent Credibility Analyses
          </h3>

          {reportsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-12 text-center shadow-sm">
              <History className="h-12 w-12 text-on-surface-variant mx-auto mb-4" />
              <h4 className="text-lg font-bold text-on-surface mb-1 font-display">No reports generated yet</h4>
              <p className="text-on-surface-variant text-sm max-w-sm mx-auto mb-6">
                Paste an ad URL on the home page and run your first AI analysis to build your credibility dashboard history!
              </p>
              <a 
                href="/" 
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-hover text-white transition-colors"
              >
                Analyze Your First Video
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports.map((report) => {
                const isProcessing = report.status === 'processing';
                const isFailed = report.status === 'failed';

                if (isProcessing) {
                  return (
                    <div 
                      key={report._id || report.jobId} 
                      className="bg-gradient-to-br from-surface-container-lowest to-primary/5 border border-primary/30 rounded-2xl p-6 flex flex-col justify-between shadow-sm animate-pulse"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <span className="text-xs font-bold text-primary flex items-center gap-1.5 font-mono tracking-wider uppercase">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            AI Auditing Active
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border border-primary/25 bg-primary/10 text-primary">
                            Processing...
                          </span>
                        </div>
                        <p className="text-on-surface font-semibold text-sm truncate mb-2">
                          {report.url}
                        </p>
                        <p className="text-on-surface-variant text-xs line-clamp-2 italic mb-4">
                          "The AI analysis pipeline is running in the background. Pulling transcription, fact-checking claims, and scanning frames..."
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-outline-variant/60 mt-2">
                        <span className="text-xs text-on-surface-variant">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                        <a 
                          href={`/report?url=${encodeURIComponent(report.url)}`}
                          className="text-primary hover:text-primary-hover font-semibold text-xs flex items-center gap-1"
                        >
                          View Live Stream →
                        </a>
                      </div>
                    </div>
                  );
                }

                if (isFailed) {
                  return (
                    <div 
                      key={report._id || report.jobId} 
                      className="bg-gradient-to-br from-surface-container-lowest to-rose-500/5 border border-rose-500/20 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-rose-500/40 transition-all"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5 font-mono tracking-wider uppercase">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Analysis Interrupted
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border border-rose-500/20 bg-rose-500/10 text-rose-600">
                            Failed
                          </span>
                        </div>
                        <p className="text-on-surface font-semibold text-sm truncate mb-2">
                          {report.url}
                        </p>
                        <p className="text-rose-600/80 text-xs line-clamp-2 italic mb-4 font-mono">
                          "{report.verdict || "An internal error occurred during video download or scraping."}"
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-outline-variant/60 mt-2">
                        <span className="text-xs text-on-surface-variant">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                        <a 
                          href={`/report?url=${encodeURIComponent(report.url)}`}
                          className="text-rose-600 hover:text-rose-700 font-semibold text-xs flex items-center gap-1"
                        >
                          Retry Analysis →
                        </a>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={report._id} 
                    className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 hover:border-primary/40 transition-all flex flex-col justify-between shadow-sm group hover:shadow-md"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <span className="text-xs font-bold text-primary font-mono tracking-wider uppercase">
                          {report.languageDetected} Ad Analysis
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          report.overallScore >= 80 ? "text-emerald-700 border-emerald-500/20 bg-emerald-500/10" :
                          report.overallScore >= 50 ? "text-amber-700 border-amber-500/20 bg-amber-500/10" :
                          "text-rose-700 border-rose-500/20 bg-rose-500/10"
                        }`}>
                          Score: {report.overallScore}/100
                        </span>
                      </div>
                      <p className="text-on-surface font-semibold text-sm truncate mb-2 group-hover:text-primary transition-colors">
                        {report.url}
                      </p>
                      <p className="text-on-surface-variant text-xs line-clamp-2 italic mb-4">
                        "{report.verdict}"
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-outline-variant mt-2">
                      <span className="text-xs text-on-surface-variant">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                      <a 
                        href={`/report?url=${encodeURIComponent(report.url)}`}
                        className="text-primary hover:text-primary-hover font-semibold text-xs flex items-center gap-1"
                      >
                        View Full Dashboard →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
