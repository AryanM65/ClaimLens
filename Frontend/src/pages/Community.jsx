import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  MessageSquare, Heart, Share2, Plus, LogIn, AlertTriangle, 
  ExternalLink, CheckCircle, HelpCircle, X, Loader2, Sparkles, User, Calendar,
  Building2, Scale
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Community = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeModalReport, setActiveModalReport] = useState(null);

  // New Post Form State
  const [selectedReportId, setSelectedReportId] = useState('');
  const [opinionText, setOpinionText] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formError, setFormError] = useState('');

  // Inline Brand Dispute Modal States
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedDisputeReport, setSelectedDisputeReport] = useState(null);
  const [disputedPostId, setDisputedPostId] = useState('');
  const [disputeClaimText, setDisputeClaimText] = useState('');
  const [disputeReasonText, setDisputeReasonText] = useState('');
  const [disputeEvidenceLinks, setDisputeEvidenceLinks] = useState(['']);
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeError, setDisputeError] = useState('');

  // Fetch posts, reports, and brand list
  useEffect(() => {
    fetchPosts();
    fetchOrganizations();
    if (isAuthenticated) {
      fetchUserReports();
    } else {
      fetchPublicReports();
    }
  }, [isAuthenticated]);

  const fetchOrganizations = async () => {
    try {
      const res = await axios.get('/api/v1/organizations/public/list');
      setOrganizations(res.data);
      if (res.data.length > 0) {
        setSelectedOrgId(res.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/api/v1/community/get-posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReports = async () => {
    try {
      // Get logged in user's history
      const response = await axios.get('/api/v1/users/history');
      setReports(response.data);
      if (response.data.length > 0) {
        setSelectedReportId(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching user history:', error);
      fetchPublicReports(); // Fallback to public reports
    }
  };

  const fetchPublicReports = async () => {
    try {
      const response = await axios.get('/api/v1/analysis/reports');
      setReports(response.data);
      if (response.data.length > 0) {
        setSelectedReportId(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching public reports:', error);
    }
  };

  const handleLike = async (postId) => {
    if (!isAuthenticated) {
      alert('Please log in to like community opinion posts.');
      return;
    }

    if (user?.role === 'admin' || user?.role === 'organization') {
      alert('Administrators and Organization Representatives are not permitted to like community posts.');
      return;
    }

    try {
      const response = await axios.post(`/api/v1/community/${postId}/like`);
      // Update local posts state with the new like count and list
      setPosts(posts.map(post => post._id === postId ? response.data : post));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this community opinion post?')) {
      return;
    }

    if (!window.confirm('Are you absolutely sure? This action is permanent, cannot be undone, and the author will be notified via email.')) {
      return;
    }

    try {
      await axios.delete(`/api/v1/community/${postId}`);
      // Remove from feed locally
      setPosts(posts.filter(p => p._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(error.response?.data?.message || 'Failed to delete post.');
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!selectedReportId || !opinionText.trim() || !selectedOrgId) {
      setFormError('Please select an audit report, concerned brand, and enter your opinion.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const response = await axios.post('/api/v1/community/create-post', {
        reportId: selectedReportId,
        opinionText: opinionText.trim(),
        organizationId: selectedOrgId,
      });

      // Insert new post at the top of the feed list
      setPosts([response.data, ...posts]);
      setOpinionText('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating post:', error);
      setFormError(error.response?.data?.message || 'Failed to publish post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 50) return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-600 bg-rose-500/10 border-rose-500/20';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Verified':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'Misleading':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'False':
        return <X className="h-4 w-4 text-rose-600" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
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

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background py-12 transition-all duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-on-surface sm:text-5xl font-display tracking-tight flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              Community <span className="text-primary font-display">Feed</span>
            </h1>
            <p className="text-on-surface-variant text-base mt-2">
              Explore audited credibility reports and read visual/audio validation audits submitted by the ClaimLens community.
            </p>
          </div>

          <div>
            {isAuthenticated ? (
              (user?.role !== 'admin' && user?.role !== 'organization') ? (
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-all shadow-md shadow-primary/10 hover:-translate-y-0.5"
                >
                  <Plus className="h-5 w-5" />
                  Share an Audit Opinion
                </button>
              ) : (
                <div className="text-xs font-bold text-amber-600 bg-amber-500/10 px-4 py-2.5 rounded-xl border border-amber-500/20">
                  Admins & Representatives cannot post opinions
                </div>
              )
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-all shadow-md shadow-primary/10 hover:-translate-y-0.5"
              >
                <LogIn className="h-5 w-5" />
                Log In to Post
              </Link>
            )}
          </div>
        </div>

        {/* Create Post Section Form */}
        {showCreateForm && isAuthenticated && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 mb-10 shadow-md animate-fadeIn">
            <h3 className="text-xl font-bold text-on-surface mb-4 font-display">
              Create a Community Opinion Post
            </h3>
            
            <form onSubmit={handleSubmitPost} className="space-y-5">
              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-3.5 text-sm flex gap-2">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Select an Audit Report from History
                </label>
                {reports.length > 0 ? (
                  <select
                    value={selectedReportId}
                    onChange={(e) => setSelectedReportId(e.target.value)}
                    className="block w-full px-4 py-3 border border-outline-variant rounded-xl shadow-sm bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                  >
                    {reports.map((report) => (
                      <option key={report._id} value={report._id}>
                        [Score: {report.overallScore}] - {report.url.substring(0, 70)}{report.url.length > 70 ? '...' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-on-surface-variant p-4 bg-surface-container rounded-xl border border-outline-variant text-center">
                    You do not have any analyzed reports. Go to the{' '}
                    <Link to="/dashboard" className="text-primary font-semibold hover:underline">
                      Dashboard
                    </Link>{' '}
                    to audit a video first!
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Explicitly Tag Affected Brand / Organization (Database Match)
                </label>
                <select
                  required
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="block w-full px-4 py-3 border border-outline-variant rounded-xl shadow-sm bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                >
                  <option value="">-- Choose brand to tag --</option>
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.organizationName} ({org.website})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-on-surface-variant">
                  Organizations are synced from the official verified registry database.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Your Audit Opinion
                </label>
                <textarea
                  rows="4"
                  value={opinionText}
                  onChange={(e) => setOpinionText(e.target.value)}
                  placeholder="Share your analysis opinion, context, or visual findings about this ad's credibility..."
                  className="block w-full px-4 py-3 border border-outline-variant rounded-xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant text-sm font-medium hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || reports.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-75"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publish Opinion'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Feed Posts */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-sm font-medium">Fetching community audit board...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-12 text-center shadow-sm">
            <MessageSquare className="h-14 w-14 text-outline mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-on-surface mb-1 font-display">No Posts Yet</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
              Be the first to share an audited video credibility report and post your detailed opinion with the community board!
            </p>
            {isAuthenticated ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors"
              >
                Create First Post
              </button>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors inline-block"
              >
                Log In to Share
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const isLiked = user && post.likes?.includes(user._id);
              const author = post.userId?.username || 'Anonymous Auditor';
              const report = post.reportId;

              return (
                <article
                  key={post._id}
                  className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between mb-4 border-b border-outline-variant pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface text-sm sm:text-base leading-tight">
                          @{author}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(post.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user && (user.role === 'admin' || post.userId?._id === user._id) && (
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all mr-1 flex items-center justify-center cursor-pointer"
                          title="Delete Opinion Post"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      {post.organizationName && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-700 font-black uppercase tracking-wider flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-amber-600" /> Tagged: {post.organizationName}
                        </span>
                      )}
                      <span className="text-xs px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-semibold">
                        Community Opinion
                      </span>
                    </div>
                  </div>

                  {/* Post Opinion Body */}
                  <div className="text-on-surface text-sm sm:text-base leading-relaxed mb-6 whitespace-pre-line">
                    {post.opinionText}
                  </div>

                  {/* Embedded Credibility Report Card */}
                  {report ? (
                    <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/60 pb-4 mb-4">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                            Visual & Audio Audit Evidence
                          </span>
                          <h4 className="font-bold text-on-surface text-sm sm:text-base truncate mt-0.5">
                            {report.url}
                          </h4>
                        </div>
                        
                        <div className="flex gap-2 flex-shrink-0">
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${getScoreColorClass(report.overallScore)}`}>
                            Score: {report.overallScore}/100
                          </div>
                        </div>
                      </div>

                      {/* Brief details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-on-surface-variant font-medium block">Audit Verdict Summary</span>
                          <p className="text-on-surface mt-1 leading-relaxed line-clamp-2">
                            {report.verdict || 'No custom verdict generated. Credibility scores computed successfully.'}
                          </p>
                        </div>
                        <div className="border-t md:border-t-0 md:border-l border-outline-variant/60 pt-4 md:pt-0 md:pl-4 flex flex-col justify-between">
                          <div>
                            <span className="text-on-surface-variant font-medium block mb-1.5">Flagged Claim Overview</span>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-semibold">
                                {report.flaggedClaims?.length || 0} Claims Checked
                              </span>
                              {report.visualFlags?.length > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-semibold flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {report.visualFlags.length} Visual Issues
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              if (!isAuthenticated) {
                                navigate('/login');
                                return;
                              }
                              setActiveModalReport(report);
                            }}
                            className="mt-3 inline-flex items-center text-primary font-bold hover:underline gap-1 text-left self-start"
                          >
                            View Full Verification Audit
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-on-surface-variant bg-surface-container-low border border-dashed border-outline-variant rounded-2xl p-4 text-center mb-6">
                      Linked visual audit report could not be loaded.
                    </div>
                  )}

                  {/* Actions (Like / Share) */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-on-surface-variant border-t border-outline-variant/60 pt-4">
                    <button
                      onClick={() => handleLike(post._id)}
                      disabled={user?.role === 'admin' || user?.role === 'organization'}
                      className={`flex items-center gap-2 py-1.5 px-3 rounded-lg transition-all group ${
                        user?.role === 'admin' || user?.role === 'organization'
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-surface-container cursor-pointer'
                      } ${
                        isLiked ? 'text-rose-600 bg-rose-500/5' : ''
                      }`}
                      title={
                        user?.role === 'admin' || user?.role === 'organization'
                          ? 'Only standard user auditor accounts can like opinion posts'
                          : 'Like Post'
                      }
                    >
                      <Heart className={`h-4.5 w-4.5 transition-transform group-hover:scale-110 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                      <span>{post.likes?.length || 0} Likes</span>
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + `/report?id=${report?._id}`);
                        alert('Audit link copied to clipboard!');
                      }}
                      className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-surface-container transition-colors"
                    >
                      <Share2 className="h-4.5 w-4.5" />
                      <span>Share Audit</span>
                    </button>

                    {/* Add Brand Dispute Trigger directly from post if user's organizationId matches post's organizationId */}
                    {user?.role === 'organization' && user?.organizationId === post.organizationId && report && (
                      <button
                        onClick={() => {
                          setSelectedDisputeReport(report);
                          setDisputedPostId(post._id);
                          setDisputeClaimText('');
                          setDisputeReasonText('');
                          setDisputeEvidenceLinks(['']);
                          setDisputeError('');
                          setIsDisputeModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-white bg-amber-600 hover:bg-amber-700 hover:-translate-y-0.5 transition-all font-black uppercase tracking-wider text-[10px] shadow-md shadow-amber-600/10 cursor-pointer ml-auto"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>File Brand Dispute</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>

      {/* Report View Full Audit Details Modal */}
      {activeModalReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary block">
                  Comprehensive Ad Credibility Report
                </span>
                <h3 className="text-lg font-bold text-on-surface truncate max-w-lg mt-0.5">
                  {activeModalReport.url}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalReport(null)}
                className="h-9 w-9 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              
              {/* Verdict Summary Block */}
              <div className="bg-gradient-to-br from-primary/5 to-surface-container border border-primary/20 rounded-2xl p-5">
                <h4 className="font-bold text-primary mb-2 flex items-center gap-1.5 font-display">
                  <Sparkles className="h-4.5 w-4.5" />
                  AI Summary Verdict
                </h4>
                <p className="text-on-surface leading-relaxed">
                  {activeModalReport.verdict || 'No verdict text generated.'}
                </p>
              </div>

              {/* Score breakdowns */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-3">
                  <span className="text-[11px] text-on-surface-variant font-medium block">Overall Score</span>
                  <span className="text-lg font-extrabold text-on-surface block mt-1">{activeModalReport.overallScore}/100</span>
                </div>
                <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-3">
                  <span className="text-[11px] text-on-surface-variant font-medium block">Audio Score</span>
                  <span className="text-lg font-extrabold text-on-surface block mt-1">{activeModalReport.audioScore}/100</span>
                </div>
                <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-3">
                  <span className="text-[11px] text-on-surface-variant font-medium block">Text Score</span>
                  <span className="text-lg font-extrabold text-on-surface block mt-1">{activeModalReport.textScore}/100</span>
                </div>
              </div>

              {/* Checked claims list */}
              <div>
                <h4 className="font-bold text-on-surface mb-3 font-display">
                  Flagged Transcribed Claims ({activeModalReport.flaggedClaims?.length || 0})
                </h4>
                {activeModalReport.flaggedClaims?.length > 0 ? (
                  <div className="space-y-3.5">
                    {activeModalReport.flaggedClaims.map((item, idx) => (
                      <div key={idx} className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
                            {item.category || 'other'}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${getStatusBadgeClass(item.status)}`}>
                            {getStatusIcon(item.status)}
                            {item.status}
                          </span>
                        </div>
                        <p className="font-bold text-on-surface leading-tight text-sm">
                          "{item.claim}"
                        </p>
                        <div className="mt-3 text-xs border-t border-outline-variant/40 pt-2 text-on-surface-variant">
                          <span className="font-semibold block text-on-surface mb-0.5">Evidence / Reason:</span>
                          <p className="leading-relaxed">{item.evidence}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl p-4 text-center">
                    <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-xs font-semibold">No critical misleading verbal claims flagged in the audio transcript.</p>
                  </div>
                )}
              </div>

              {/* Visual Flags list */}
              <div>
                <h4 className="font-bold text-on-surface mb-3 font-display">
                  Visual Frame Audit Alerts ({activeModalReport.visualFlags?.length || 0})
                </h4>
                {activeModalReport.visualFlags?.length > 0 ? (
                  <div className="space-y-3">
                    {activeModalReport.visualFlags.map((item, idx) => (
                      <div key={idx} className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-4 flex gap-3 items-start">
                        <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-rose-700 text-sm leading-snug">{item.issue}</h5>
                          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl p-4 text-center">
                    <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-xs font-semibold">No critical credibility/deception alerts flagged in visual keyframe frames.</p>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-surface-container border-t border-outline-variant flex justify-between items-center">
              <span className="text-[11px] text-on-surface-variant font-medium">
                ClaimLens Audit ID: {activeModalReport._id}
              </span>
              <button
                onClick={() => setActiveModalReport(null)}
                className="px-5 py-2 rounded-xl bg-on-surface text-surface-container-lowest text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Close Audit
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Inline Brand Dispute Modal */}
      {isDisputeModalOpen && selectedDisputeReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl max-w-lg w-full overflow-hidden flex flex-col shadow-2xl animate-scaleIn">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-amber-600 animate-pulse" />
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-amber-600 block">
                    Official Brand Dispute
                  </span>
                  <h3 className="text-base font-bold text-on-surface">
                    Submit Factual Challenge
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsDisputeModalOpen(false)}
                className="h-8 w-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!disputeClaimText.trim() || !disputeReasonText.trim()) {
                  setDisputeError('Disputed claim and factual evidence are required.');
                  return;
                }
                setSubmittingDispute(true);
                setDisputeError('');
                try {
                  await axios.post('/api/v1/disputes/create-dispute', {
                    reportId: selectedDisputeReport._id,
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
              }}
              className="p-6 space-y-4 text-sm"
            >
              {disputeError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-3.5 text-xs flex gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>{disputeError}</span>
                </div>
              )}

              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/60 text-xs">
                <span className="font-bold text-on-surface-variant block mb-1">Target Video URL:</span>
                <p className="text-on-surface font-mono truncate">{selectedDisputeReport.url}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wide">
                  Which claim is incorrect?
                </label>
                <input
                  type="text"
                  required
                  value={disputeClaimText}
                  onChange={(e) => setDisputeClaimText(e.target.value)}
                  placeholder="e.g. The audio states that we use harmful artificial chemicals"
                  className="block w-full px-3 py-2.5 border border-outline-variant rounded-xl bg-surface-container-low text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wide">
                  Factual Clarification & Evidence
                </label>
                <textarea
                  rows="4"
                  required
                  value={disputeReasonText}
                  onChange={(e) => setDisputeReasonText(e.target.value)}
                  placeholder="State the accurate fact and explain why the analyzed verdict is false or misleading. Provide clean evidence."
                  className="block w-full px-3 py-2.5 border border-outline-variant rounded-xl bg-surface-container-low text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wide flex justify-between items-center">
                  <span>Evidence Links (Optional)</span>
                  <button
                    type="button"
                    onClick={() => setDisputeEvidenceLinks([...disputeEvidenceLinks, ''])}
                    className="text-[10px] text-primary hover:underline font-black uppercase tracking-wider"
                  >
                    + Add Link
                  </button>
                </label>
                <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1">
                  {disputeEvidenceLinks.map((link, idx) => (
                    <input
                      key={idx}
                      type="url"
                      value={link}
                      onChange={(e) => {
                        const newLinks = [...disputeEvidenceLinks];
                        newLinks[idx] = e.target.value;
                        setDisputeEvidenceLinks(newLinks);
                      }}
                      placeholder="e.g. https://ourbrand.com/lab-report-pdf"
                      className="block w-full px-3 py-1.5 border border-outline-variant rounded-lg bg-surface-container-low text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-medium hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/10 flex items-center gap-1.5 disabled:opacity-75"
                >
                  {submittingDispute ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Scale className="h-3.5 w-3.5" />}
                  Submit Dispute Challenge
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Community;
