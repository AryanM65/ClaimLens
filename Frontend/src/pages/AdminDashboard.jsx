import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, ShieldCheck, Users, Building, CheckSquare, AlertTriangle, 
  CheckCircle2, Loader2, Search, ExternalLink, RefreshCw, Scale, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Active Tab: 'overview' | 'disputes' | 'organizations' | 'users'
  const [activeTab, setActiveTab] = useState('overview');

  // Datasets
  const [disputes, setDisputes] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);

  // Loadings and errors
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected dispute for resolution modal
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Selected user profile for detail view modal
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  // Search queries
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [disputesRes, orgsRes, usersRes, reportsRes] = await Promise.all([
        axios.get('/api/v1/disputes/admin/all'),
        axios.get('/api/v1/organizations'),
        axios.get('/api/v1/users'),
        axios.get('/api/v1/analysis/reports')
      ]);
      setDisputes(disputesRes.data || []);
      setOrganizations(orgsRes.data || []);
      setUsers(usersRes.data || []);
      setReports(reportsRes.data || []);
    } catch (err) {
      console.error('Fetch admin data failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // Resolve Dispute
  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;
    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await axios.put(`/api/v1/disputes/${selectedDispute._id}/resolve`, {
        status: resolutionStatus,
        resolutionNotes: resolutionNotes.trim()
      });

      // Update local disputes array
      setDisputes(prev => prev.map(d => d._id === selectedDispute._id ? res.data : d));
      setSuccessMsg(`Dispute successfully marked as ${resolutionStatus}!`);
      setSelectedDispute(null);
      setResolutionNotes('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Resolve dispute failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to resolve dispute.');
    } finally {
      setActionLoading(false);
    }
  };

  // Verify Organization
  const handleVerifyOrganization = async (orgId) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await axios.put(`/api/v1/organizations/${orgId}/verify`);
      
      setOrganizations(prev => prev.map(o => o._id === orgId ? { ...o, isVerified: true } : o));
      setSuccessMsg(res.data?.message || 'Organization verified successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Verify organization failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to verify organization.');
    } finally {
      setActionLoading(false);
    }
  };

  // Ban/Unban User
  const handleToggleBanUser = async (targetUser) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      await axios.put(`/api/v1/users/${targetUser._id}/ban`);
      
      // Update local users array
      setUsers(prev => prev.map(u => u._id === targetUser._id ? { ...u, isBanned: !u.isBanned } : u));
      setSuccessMsg(`User @${targetUser.username} successfully ${targetUser.isBanned ? 'unbanned' : 'banned'}!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Ban/unban user failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to perform ban/unban operation.');
    } finally {
      setActionLoading(false);
    }
  };

  // Helpers
  const getDisputeStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600';
      case 'rejected': return 'bg-rose-500/10 border-rose-500/20 text-rose-600';
      case 'under-review': return 'bg-amber-500/10 border-amber-500/20 text-amber-600';
      default: return 'bg-surface-container border-outline-variant text-on-surface-variant';
    }
  };

  // Filtered lists
  const filteredDisputes = disputes.filter(d => 
    d.claimText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.organizationName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrgs = organizations.filter(o =>
    o.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.orgCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic calculations for administrative KPIs & graphs (100% database-driven)
  const getMonthlyAuditStats = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    
    const labels = [];
    const counts = [0, 0, 0, 0, 0];
    
    // Establish the last 5 month indices
    const monthIndices = [];
    for (let i = 4; i >= 0; i--) {
      let idx = currentMonthIdx - i;
      if (idx < 0) idx += 12;
      labels.push(months[idx]);
      monthIndices.push(idx);
    }
    
    // Increment counts for each report based on actual creation month
    if (reports && reports.length > 0) {
      reports.forEach(r => {
        if (!r.createdAt) return;
        const d = new Date(r.createdAt);
        const mIdx = d.getMonth();
        const targetIdx = monthIndices.indexOf(mIdx);
        if (targetIdx !== -1) {
          counts[targetIdx]++;
        }
      });
    }
    
    return { labels, counts };
  };

  const getVerdictDistribution = () => {
    let verified = 0;
    let misleading = 0;
    let falseCount = 0;
    
    if (reports && reports.length > 0) {
      reports.forEach(r => {
        if (r.overallScore >= 80) verified++;
        else if (r.overallScore >= 50) misleading++;
        else falseCount++;
      });
    }

    const total = verified + misleading + falseCount;
    return {
      verified: { count: verified, pct: total > 0 ? ((verified / total) * 100).toFixed(0) : 0 },
      misleading: { count: misleading, pct: total > 0 ? ((misleading / total) * 100).toFixed(0) : 0 },
      falseCount: { count: falseCount, pct: total > 0 ? ((falseCount / total) * 100).toFixed(0) : 0 },
      total
    };
  };

  const getRecentSignups = () => {
    return [...users]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background py-16 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 pb-6 border-b border-outline-variant">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface font-display flex items-center gap-3">
              <Scale className="h-9 w-9 text-primary animate-pulse" />
              ClaimLens <span className="text-primary font-display">Control Room</span>
            </h1>
            <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Global administration panel. Resolve correction disputes, verify truth-checking organizations, and manage platform membership.
            </p>
          </div>

          <button 
            onClick={fetchData} 
            disabled={loading}
            className="self-start md:self-center inline-flex items-center gap-1.5 px-4 py-2 border border-outline-variant hover:bg-surface-container rounded-xl text-xs font-bold text-on-surface transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Board
          </button>
        </div>

        {/* Board Statistics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Total Ingestions</span>
              <span className="text-2xl font-black text-on-surface font-display">{reports.length} Audited</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Global Disputes</span>
              <span className="text-2xl font-black text-on-surface font-display">{disputes.length} Raised</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Organizations</span>
              <span className="text-2xl font-black text-on-surface font-display">
                {organizations.filter(o => o.isVerified).length} Verified
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Community Core</span>
              <span className="text-2xl font-black text-on-surface font-display">{users.length} Registrations</span>
            </div>
          </div>
        </div>

        {/* Tabs and Searching */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 bg-surface-container-low border border-outline-variant p-2 rounded-2xl">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview' 
                  ? 'bg-primary text-white shadow-sm shadow-primary/10' 
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              System Overview & Analytics
            </button>

            <button
              onClick={() => { setActiveTab('disputes'); setSearchQuery(''); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'disputes' 
                  ? 'bg-primary text-white shadow-sm shadow-primary/10' 
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              Correction Disputes ({disputes.length})
            </button>

            <button
              onClick={() => { setActiveTab('organizations'); setSearchQuery(''); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'organizations' 
                  ? 'bg-primary text-white shadow-sm shadow-primary/10' 
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              Verify Organizations ({organizations.length})
            </button>

            <button
              onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'users' 
                  ? 'bg-primary text-white shadow-sm shadow-primary/10' 
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              User Accounts ({users.length})
            </button>
          </div>

          {activeTab !== 'overview' && (
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 pl-10 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all"
              />
            </div>
          )}
        </div>

        {/* Dynamic Alerts */}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl p-4 mb-8 text-sm flex gap-2 items-center animate-fadeIn">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-2xl p-4 mb-8 text-sm flex gap-2 items-center animate-fadeIn">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Tab Contents */}
        {loading ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-16 text-center shadow-sm flex flex-col items-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-sm font-semibold text-on-surface-variant">Loading records from database...</p>
          </div>
        ) : (
          activeTab === 'overview' ? (
            <div className="space-y-10 animate-fadeIn">
              
              {/* Analytics & Graphs Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* SVG Area Chart */}
                {(() => {
                  const { labels, counts } = getMonthlyAuditStats();
                  const maxVal = Math.max(...counts, 10);
                  
                  const points = counts.map((c, i) => {
                    const x = 40 + i * 100;
                    const y = 130 - (c / maxVal) * 90;
                    return { x, y, val: c };
                  });
                  
                  const pathD = `M ${points[0].x} ${points[0].y} ` + 
                    points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
                    
                  const areaD = `${pathD} L ${points[points.length-1].x} 140 L ${points[0].x} 140 Z`;
                  
                  return (
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
                      <div className="mb-6">
                        <h4 className="text-base font-bold text-on-surface font-display">Ingestions & Audits Over Time</h4>
                        <span className="text-xs text-on-surface-variant mt-0.5 block">Monthly analyzed credibility checks</span>
                      </div>
                      
                      <div className="relative h-48 w-full">
                        <svg className="w-full h-full" viewBox="0 0 480 160" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25"/>
                              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00"/>
                            </linearGradient>
                          </defs>
                          
                          {/* Grid lines */}
                          <line x1="40" y1="40" x2="440" y2="40" stroke="currentColor" className="text-outline-variant/30" strokeDasharray="3,3" />
                          <line x1="40" y1="90" x2="440" y2="90" stroke="currentColor" className="text-outline-variant/30" strokeDasharray="3,3" />
                          <line x1="40" y1="140" x2="440" y2="140" stroke="currentColor" className="text-outline-variant/50" />
                          
                          {/* Area Fill */}
                          <path d={areaD} fill="url(#chartGrad)" />
                          
                          {/* Smooth Line Path */}
                          <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                          
                          {/* Data Dots & Labels */}
                          {points.map((p, idx) => (
                            <g key={idx}>
                              <circle cx={p.x} cy={p.y} r="5" className="fill-primary stroke-white stroke-2 cursor-pointer hover:r-7 transition-all" />
                              <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[10px] font-extrabold fill-on-surface">
                                {p.val}
                              </text>
                              <text x={p.x} y="156" textAnchor="middle" className="text-[10px] font-bold fill-on-surface-variant">
                                {labels[idx]}
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>
                    </div>
                  );
                })()}

                {/* Credibility Distribution Segment Graph */}
                {(() => {
                  const dist = getVerdictDistribution();
                  return (
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                      <div>
                        <div className="mb-6">
                          <h4 className="text-base font-bold text-on-surface font-display">Credibility Rating Distribution</h4>
                          <span className="text-xs text-on-surface-variant mt-0.5 block">Visual & audio credibility audit segmentation</span>
                        </div>
                        
                        {/* Segmented Pill */}
                        <div className="h-6 w-full rounded-full bg-surface-container overflow-hidden flex border border-outline-variant">
                          {dist.verified.count > 0 && (
                            <div 
                              style={{ width: `${dist.verified.pct}%` }} 
                              className="h-full bg-emerald-500 hover:opacity-90 transition-opacity cursor-pointer"
                              title={`Verified: ${dist.verified.count}`}
                            />
                          )}
                          {dist.misleading.count > 0 && (
                            <div 
                              style={{ width: `${dist.misleading.pct}%` }} 
                              className="h-full bg-amber-500 hover:opacity-90 transition-opacity cursor-pointer"
                              title={`Misleading: ${dist.misleading.count}`}
                            />
                          )}
                          {dist.falseCount.count > 0 && (
                            <div 
                              style={{ width: `${dist.falseCount.pct}%` }} 
                              className="h-full bg-rose-500 hover:opacity-90 transition-opacity cursor-pointer"
                              title={`False: ${dist.falseCount.count}`}
                            />
                          )}
                        </div>
                        
                        {/* Legend and stats */}
                        <div className="grid grid-cols-3 gap-3 mt-8 text-center">
                          <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                            <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider block">Verified</span>
                            <span className="text-base font-black text-on-surface mt-1 block">{dist.verified.count} ({dist.verified.pct}%)</span>
                          </div>
                          
                          <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                            <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider block">Misleading</span>
                            <span className="text-base font-black text-on-surface mt-1 block">{dist.misleading.count} ({dist.misleading.pct}%)</span>
                          </div>
                          
                          <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                            <span className="text-[10px] text-rose-600 font-extrabold uppercase tracking-wider block">False</span>
                            <span className="text-base font-black text-on-surface mt-1 block">{dist.falseCount.count} ({dist.falseCount.pct}%)</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-8 pt-4 border-t border-outline-variant/60 flex items-center justify-between text-xs">
                        <span className="text-on-surface-variant font-medium">Total Audited Claims</span>
                        <span className="font-extrabold text-on-surface">{dist.total} Segmented Claims</span>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Dynamic Bottom Grid: Admin KPIs & Recent Signups */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Admin KPIs Panel */}
                <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-6 pb-4 border-b border-outline-variant/60">
                    <h4 className="text-base font-bold text-on-surface font-display">Control Room Status & Health</h4>
                    <span className="text-xs text-on-surface-variant mt-0.5 block">Core metrics and factual verification parameters</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-surface-container-low/40 rounded-2xl border border-outline-variant/50 flex flex-col justify-between h-32">
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Dispute Resolution Rate</span>
                      <div>
                        <span className="text-3xl font-black text-on-surface block font-display">
                          {disputes.length > 0 
                            ? ((disputes.filter(d => d.status === 'resolved' || d.status === 'rejected').length / disputes.length) * 100).toFixed(0) 
                            : '100'}%
                        </span>
                        <span className="text-[10px] text-primary font-bold mt-1 block">Active administrative review</span>
                      </div>
                    </div>

                    <div className="p-5 bg-surface-container-low/40 rounded-2xl border border-outline-variant/50 flex flex-col justify-between h-32">
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Factual Accuracy Score</span>
                      <div>
                        <span className="text-3xl font-black text-emerald-600 block font-display">
                          {reports.length > 0 
                            ? (reports.reduce((acc, r) => acc + (r.overallScore || 0), 0) / reports.length).toFixed(1) 
                            : '100'}%
                        </span>
                        <span className="text-[10px] text-emerald-600/80 font-bold mt-1 block">Average platform factual credibility score</span>
                      </div>
                    </div>

                    <div className="p-5 bg-surface-container-low/40 rounded-2xl border border-outline-variant/50 flex flex-col justify-between h-32">
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Factual Claims Indexed</span>
                      <div>
                        <span className="text-3xl font-black text-on-surface block font-display">
                          {reports.reduce((acc, r) => acc + (r.claims?.length || 0), 0)} Claims
                        </span>
                        <span className="text-[10px] text-on-surface-variant mt-1 block">Visual & verbal claims verified</span>
                      </div>
                    </div>

                    <div className="p-5 bg-surface-container-low/40 rounded-2xl border border-outline-variant/50 flex flex-col justify-between h-32">
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Pending Disputes</span>
                      <div>
                        <span className="text-3xl font-black text-amber-600 block font-display">
                          {disputes.filter(d => d.status === 'pending' || d.status === 'under-review').length} Pending
                        </span>
                        <span className="text-[10px] text-amber-600/80 font-bold mt-1 block">Awaiting official admin action</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Core Signups Panel */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-6 pb-4 border-b border-outline-variant/60">
                    <h4 className="text-base font-bold text-on-surface font-display">Recent System Signups</h4>
                    <span className="text-xs text-on-surface-variant mt-0.5 block">Newly registered community core profiles</span>
                  </div>
                  
                  <div className="space-y-4">
                    {getRecentSignups().length === 0 ? (
                      <div className="text-center py-8 text-xs text-on-surface-variant">
                        No registrations logged in database.
                      </div>
                    ) : (
                      getRecentSignups().map((u) => (
                        <div key={u._id} className="flex items-center justify-between gap-3 p-3 bg-surface-container-low/40 border border-outline-variant/50 rounded-2xl hover:bg-surface-container-low/80 transition-all">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black flex-shrink-0">
                              {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                              <span className="block text-xs font-bold text-on-surface truncate leading-tight">{u.name}</span>
                              <span className="block text-[10px] text-primary font-bold truncate mt-0.5">@{u.username}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                              u.role === 'admin' 
                                ? 'bg-primary/10 text-primary border border-primary/20' 
                                : u.role === 'organization' 
                                  ? 'bg-surface-container text-on-surface-variant border border-outline-variant' 
                                  : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            }`}>
                              {u.role}
                            </span>
                            
                            <button
                              onClick={() => setSelectedUserProfile(u)}
                              className="text-[9px] font-bold px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/60 transition-all shadow-sm cursor-pointer"
                            >
                              Profile
                            </button>
                            
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleToggleBanUser(u)}
                                className={`text-[9px] font-black px-2 py-1 rounded-lg transition-all shadow-sm ${
                                  u.isBanned 
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                                }`}
                              >
                                {u.isBanned ? 'Unban' : 'Ban'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-sm overflow-hidden">
              
              {/* Disputes Tab content */}
              {activeTab === 'disputes' && (
              <div>
                {filteredDisputes.length === 0 ? (
                  <div className="p-16 text-center">
                    <CheckSquare className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-on-surface mb-1 font-display">No Disputes Found</h4>
                    <p className="text-on-surface-variant text-sm max-w-md mx-auto">
                      All platform evaluations match organization truth guidelines or no corrections have been raised.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant/60">
                    {filteredDisputes.map((d) => (
                      <div key={d._id} className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 hover:bg-surface-container-low/20 transition-all">
                        <div className="space-y-4 max-w-3xl">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-black bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded text-primary uppercase">
                              {d.organizationName}
                            </span>
                            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full uppercase tracking-wider ${getDisputeStatusColor(d.status)}`}>
                              {d.status}
                            </span>
                            <span className="text-xs text-on-surface-variant">
                              Raised on {new Date(d.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div>
                            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Target Claim:</span>
                            <blockquote className="border-l-4 border-primary pl-4 py-1.5 italic font-semibold text-on-surface bg-surface-container-low/50 rounded-r-xl pr-4">
                              "{d.claimText}"
                            </blockquote>
                          </div>

                          <div>
                            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Reasoning / Factual Challenge:</span>
                            <p className="text-sm text-on-surface leading-relaxed">
                              {d.reasonText}
                            </p>
                          </div>

                          {d.evidenceLinks && d.evidenceLinks.length > 0 && (
                            <div>
                              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Supporting Links:</span>
                              <div className="flex flex-wrap gap-2">
                                {d.evidenceLinks.map((link, lIdx) => (
                                  <a 
                                    key={lIdx} 
                                    href={link} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Evidence Link #{lIdx + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {d.resolutionNotes && (
                            <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/60">
                              <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">Admin Decision / Notes:</span>
                              <p className="text-xs text-on-surface-variant leading-relaxed">
                                {d.resolutionNotes}
                              </p>
                            </div>
                          )}
                        </div>

                        {d.status === 'pending' || d.status === 'under-review' ? (
                          <button
                            onClick={() => setSelectedDispute(d)}
                            className="self-start lg:self-center inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            Resolve Dispute
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Organizations Tab content */}
            {activeTab === 'organizations' && (
              <div className="overflow-x-auto">
                {filteredOrgs.length === 0 ? (
                  <div className="p-16 text-center">
                    <Building className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-on-surface mb-1 font-display">No Organizations Found</h4>
                    <p className="text-on-surface-variant text-sm">No verification codes have been generated or requested.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                        <th className="p-5 font-bold">Organization Name</th>
                        <th className="p-5 font-bold">Org Code</th>
                        <th className="p-5 font-bold">Website</th>
                        <th className="p-5 font-bold">Status</th>
                        <th className="p-5 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/60 text-sm text-on-surface">
                      {filteredOrgs.map((o) => (
                        <tr key={o._id} className="hover:bg-surface-container-low/20 transition-all">
                          <td className="p-5 font-semibold">
                            <span className="block">{o.organizationName}</span>
                            <span className="text-[11px] text-on-surface-variant font-normal max-w-sm block truncate mt-1">
                              {o.description || 'No description added'}
                            </span>
                          </td>
                          <td className="p-5 font-mono text-xs font-bold text-primary uppercase">{o.orgCode}</td>
                          <td className="p-5">
                            <a 
                              href={o.website.startsWith('http') ? o.website : `https://${o.website}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                            >
                              {o.website}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="p-5">
                            {o.isVerified ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                                <CheckCircle2 className="w-4 h-4" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                Pending Approval
                              </span>
                            )}
                          </td>
                          <td className="p-5 text-right">
                            {!o.isVerified && (
                              <button
                                onClick={() => handleVerifyOrganization(o._id)}
                                className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Approve
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Users Tab content */}
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      <th className="p-5 font-bold">Name & Handle</th>
                      <th className="p-5 font-bold">Email</th>
                      <th className="p-5 font-bold">Platform Role</th>
                      <th className="p-5 font-bold">Ban Status</th>
                      <th className="p-5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60 text-sm text-on-surface">
                    {filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-surface-container-low/20 transition-all">
                        <td className="p-5 font-semibold">
                          <div className="flex items-center gap-2">
                            <div className="h-8 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                              {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <span className="block">{u.name}</span>
                              <span className="text-xs text-primary font-bold">@{u.username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-xs font-medium text-on-surface-variant">{u.email}</td>
                        <td className="p-5">
                          <span className="capitalize font-bold text-xs inline-flex items-center gap-1">
                            {u.role === 'admin' ? (
                              <Award className="w-4.5 h-4.5 text-primary animate-pulse" />
                            ) : u.role === 'organization' ? (
                              <Building className="w-4.5 h-4.5 text-outline" />
                            ) : (
                              <Users className="w-4.5 h-4.5 text-on-surface-variant" />
                            )}
                            {u.role}
                          </span>
                        </td>
                        <td className="p-5">
                          {u.isBanned ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-500/10 px-2.5 py-0.5 rounded-full text-xs font-bold border border-rose-500/20">
                              Banned Account
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="p-5 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedUserProfile(u)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 rounded-xl text-[11px] font-bold text-on-surface transition-all cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5 text-primary" />
                            View Profile
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleBanUser(u)}
                              disabled={actionLoading}
                              className={`inline-flex items-center gap-1 px-4 py-2 text-[11px] font-bold rounded-xl transition-all ${
                                u.isBanned 
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                  : 'bg-rose-600 hover:bg-rose-700 text-white'
                              }`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {u.isBanned ? 'Unban' : 'Ban'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )
      )}

      </div>

      {/* Resolution Modal Overlay */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-scaleIn">
            <button 
              type="button" 
              onClick={() => setSelectedDispute(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-6 h-6 text-primary animate-spin" />
              <h3 className="text-xl font-bold text-on-surface font-display">
                Resolve Factual Dispute
              </h3>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
              Evaluate organization claims against the auto-generated fact check data. Provide detailed context for your resolution decision.
            </p>

            <form onSubmit={handleResolveDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Resolution Decision / Status
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full text-sm rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all"
                >
                  <option value="resolved">Accept Challenge / Correct Claim (Resolved)</option>
                  <option value="rejected">Reject Challenge / Uphold Factual Score (Rejected)</option>
                  <option value="under-review">Keep Under Official Review (Under Review)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Explanation / Notes (Sent to Organization)
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explain why the claim is accepted or why evidence is insufficient..."
                  className="w-full text-sm rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition-all"
                >
                  {actionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Apply Decision
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Profile Modal Overlay */}
      {selectedUserProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-scaleIn">
            <button 
              type="button" 
              onClick={() => setSelectedUserProfile(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
            >
              ✕
            </button>

            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl font-black mb-3">
                {selectedUserProfile.name ? selectedUserProfile.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <h3 className="text-xl font-bold text-on-surface font-display">
                {selectedUserProfile.name}
              </h3>
              <span className="text-sm text-primary font-bold">@{selectedUserProfile.username}</span>
              
              <div className="mt-2.5 flex gap-1.5 flex-wrap justify-center">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-surface-container border border-outline-variant text-on-surface-variant capitalize">
                  {selectedUserProfile.role}
                </span>
                {selectedUserProfile.isBanned ? (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600">
                    Banned
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                    Active
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4 border-t border-outline-variant/60 pt-4 mb-6">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Email Address</span>
                <span className="text-on-surface font-bold">{selectedUserProfile.email}</span>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Member Since</span>
                <span className="text-on-surface font-bold">
                  {new Date(selectedUserProfile.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Total Audits Run</span>
                <span className="text-on-surface font-bold">
                  {reports.filter(r => r.userId === selectedUserProfile._id || r.userId?._id === selectedUserProfile._id).length} Audited
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Factual Disputes Filed</span>
                <span className="text-on-surface font-bold">
                  {disputes.filter(d => d.userId === selectedUserProfile._id || d.userId?._id === selectedUserProfile._id).length} Raised
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center gap-3 pt-4 border-t border-outline-variant/60">
              {selectedUserProfile.role !== 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    handleToggleBanUser(selectedUserProfile);
                    setSelectedUserProfile(prev => ({ ...prev, isBanned: !prev.isBanned }));
                  }}
                  disabled={actionLoading}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 text-white ${
                    selectedUserProfile.isBanned 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {selectedUserProfile.isBanned ? 'Unban' : 'Ban'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedUserProfile(null)}
                className="px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
