import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Globe, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ExternalLink, 
  Scale, 
  TrendingUp, 
  Send,
  Loader2,
  Calendar,
  X
} from 'lucide-react';
import axios from 'axios';

const OrganizationDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Auth Guard
  useEffect(() => {
    if (!user || user.role !== 'organization') {
      navigate('/login');
    }
  }, [user, navigate]);

  // State Management
  const [orgDetails, setOrgDetails] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Submit Dispute Form States
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [selectedReportClaims, setSelectedReportClaims] = useState([]);
  const [customReportId, setCustomReportId] = useState('');
  const [claimText, setClaimText] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [evidenceLinks, setEvidenceLinks] = useState(['']);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeFormError, setDisputeFormError] = useState('');

  // Selected Dispute Detail Modal State
  const [selectedDisputeDetail, setSelectedDisputeDetail] = useState(null);

  // Fetch Dashboard Telemetry Data
  const fetchDashboardData = useCallback(async () => {
    if (!user || !user.organizationId) return;
    try {
      setLoading(true);
      
      // 1. Fetch Organization Details
      const orgRes = await axios.get(`/api/v1/organizations/${user.organizationId}`);
      setOrgDetails(orgRes.data);

      // 2. Fetch Disputes
      const disputesRes = await axios.get('/api/v1/disputes/get-user-disputes');
      setDisputes(disputesRes.data);

      // 3. Fetch Platform Reports (for select dropdown in the modal)
      const reportsRes = await axios.get('/api/v1/analysis/reports');
      setReports(reportsRes.data);
    } catch (err) {
      console.error('Error loading organization dashboard data:', err);
      setError('Could not load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Watch for Report selection to dynamically parse claims
  useEffect(() => {
    if (selectedReportId) {
      const match = reports.find(r => r._id === selectedReportId);
      if (match && match.flaggedClaims) {
        setSelectedReportClaims(match.flaggedClaims);
      } else {
        setSelectedReportClaims([]);
      }
    } else {
      setSelectedReportClaims([]);
    }
  }, [selectedReportId, reports]);

  // Fetch custom report by ID if entered
  const handleFetchCustomReport = async () => {
    if (!customReportId.trim()) return;
    try {
      setDisputeFormError('');
      const res = await axios.get(`/api/v1/analysis/reports/${customReportId.trim()}`);
      if (res.status === 200) {
        // Temporarily append this to the reports state if not present
        if (!reports.some(r => r._id === res.data._id)) {
          setReports(prev => [res.data, ...prev]);
        }
        setSelectedReportId(res.data._id);
        setCustomReportId('');
      }
    } catch (err) {
      setDisputeFormError('Could not find a report with that ID. Make sure it is valid.');
    }
  };

  // Add/Remove evidence link inputs
  const handleAddEvidence = () => setEvidenceLinks([...evidenceLinks, '']);
  const handleRemoveEvidence = (index) => {
    if (evidenceLinks.length > 1) {
      setEvidenceLinks(evidenceLinks.filter((_, idx) => idx !== index));
    }
  };
  const handleEvidenceChange = (index, value) => {
    const updated = [...evidenceLinks];
    updated[index] = value;
    setEvidenceLinks(updated);
  };

  // Handle Dispute Form Submit
  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    setDisputeFormError('');

    if (!selectedReportId) {
      return setDisputeFormError('Please select or lookup a target credibility report.');
    }
    if (!claimText.trim()) {
      return setDisputeFormError('Please input or select the claim that is factually incorrect.');
    }
    if (reasonText.trim().length < 20) {
      return setDisputeFormError('Reasoning must be at least 20 characters explaining the correct facts.');
    }

    setIsSubmittingDispute(true);

    try {
      const payload = {
        reportId: selectedReportId,
        claimText: claimText.trim(),
        reasonText: reasonText.trim(),
        evidenceLinks: evidenceLinks.filter(l => l.trim() !== '')
      };

      const res = await axios.post('/api/v1/disputes/create-dispute', payload);

      if (res.status === 201) {
        // Reset states
        setSelectedReportId('');
        setClaimText('');
        setReasonText('');
        setEvidenceLinks(['']);
        setIsSubmitModalOpen(false);
        // Refresh feed
        fetchDashboardData();
      }
    } catch (err) {
      setDisputeFormError(err.response?.data?.message || 'Failed to submit correction dispute.');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  // KPI Calculations
  const totalDisputes = disputes.length;
  const pendingDisputes = disputes.filter(d => ['pending', 'under-review'].includes(d.status)).length;
  const resolvedDisputes = disputes.filter(d => d.status === 'resolved').length;
  const rejectedDisputes = disputes.filter(d => d.status === 'rejected').length;

  if (loading && !orgDetails) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] rounded-full bg-amber-500/5 blur-3xl -z-10" />

      {/* Main Wrapper */}
      <div className="max-w-7xl mx-auto space-y-8">
        
        {error && (
          <div className="bg-error-container border border-error/20 text-error rounded-2xl p-4 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        {/* Organization Header Panel */}
        {orgDetails && (
          <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/60 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shrink-0">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black text-on-surface tracking-tight font-display">
                    {orgDetails.organizationName}
                  </h1>
                  {orgDetails.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 tracking-wider">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified Brand
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 tracking-wider animate-pulse">
                      <Clock className="w-3.5 h-3.5" /> Pending Verification
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-on-surface-variant max-w-xl line-clamp-2">
                  {orgDetails.description}
                </p>
                <div className="flex items-center gap-4 text-xs font-bold text-on-surface-variant/80 pt-1.5">
                  <a href={orgDetails.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Globe className="w-4 h-4 text-primary" /> {orgDetails.website} <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="flex items-center gap-1">
                    <Scale className="w-4 h-4 text-amber-500" /> Representative: <span className="text-on-surface">@{user?.username}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Trigger */}
            {orgDetails.isVerified && (
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="inline-flex justify-center items-center py-3.5 px-6 border border-transparent rounded-2xl shadow-lg shadow-primary/10 text-sm font-bold text-white bg-primary hover:bg-primary-hover hover:-translate-y-0.5 transition-all shrink-0 font-display"
              >
                File Correction Dispute <Plus className="ml-1.5 w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Verification Status Warning / Block Banner */}
        {orgDetails && !orgDetails.isVerified && (
          <div className="bg-surface-container-low border border-amber-500/20 rounded-3xl p-6 flex items-start gap-4 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-left">
              <h4 className="text-sm font-black text-on-surface uppercase tracking-wider">Verification is Pending Admin Approval</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-3xl">
                Your brand profile registration was successful! However, to prevent bad actors from filing fake claims, our administrators must verify your corporate credentials before disputes can be raised. 
                <span className="block mt-2 font-black text-primary">Capabilities currently locked: Submitting claim corrections.</span>
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Telemetry KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-surface-container-lowest/80 border border-outline-variant/60 rounded-3xl p-5 shadow-lg flex items-center justify-between relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <div className="space-y-1">
              <span className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Total Disputes</span>
              <span className="text-3xl font-black text-on-surface tracking-tight">{totalDisputes}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-surface-container-lowest/80 border border-outline-variant/60 rounded-3xl p-5 shadow-lg flex items-center justify-between relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
            <div className="space-y-1">
              <span className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Under Review</span>
              <span className="text-3xl font-black text-on-surface tracking-tight">{pendingDisputes}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-surface-container-lowest/80 border border-outline-variant/60 rounded-3xl p-5 shadow-lg flex items-center justify-between relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
            <div className="space-y-1">
              <span className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Approved / Resolved</span>
              <span className="text-3xl font-black text-on-surface tracking-tight">{resolvedDisputes}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-surface-container-lowest/80 border border-outline-variant/60 rounded-3xl p-5 shadow-lg flex items-center justify-between relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
            <div className="space-y-1">
              <span className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Rejected Claims</span>
              <span className="text-3xl font-black text-on-surface tracking-tight">{rejectedDisputes}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform duration-300">
              <XCircle className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* Disputes History Log & Grid Table */}
        <div className="bg-surface-container-lowest/80 border border-outline-variant/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-outline-variant/60 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-on-surface uppercase tracking-wider font-display">Correction Disputes Feed</h3>
              <p className="text-[11px] text-on-surface-variant">Track all submitted claims, administrative findings, and live update states.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-on-surface-variant">Real-time sync:</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
          </div>

          {disputes.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-surface-container border border-outline-variant/60 flex items-center justify-center text-on-surface-variant/40 mx-auto">
                <Scale className="w-8 h-8" />
              </div>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                No disputes filed yet. If you believe a credibility report published on ClaimLens contains errors, you can dispute specific claims.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container/50 border-b border-outline-variant/50 text-[10px] font-black uppercase text-on-surface-variant tracking-wider">
                    <th className="p-4 pl-6">Target Report</th>
                    <th className="p-4">Disputed Claim</th>
                    <th className="p-4">Submitted On</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-xs">
                  {disputes.map((d) => (
                    <tr key={d._id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="p-4 pl-6 max-w-[200px]">
                        <div className="space-y-1">
                          <span className="font-black text-on-surface line-clamp-1 block" title={d.reportId?.url}>
                            {d.reportId?.url}
                          </span>
                          <span className="text-[10px] font-mono text-on-surface-variant/60 select-all block">
                            ID: {d.reportId?._id}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 max-w-[300px]">
                        <p className="text-on-surface font-semibold line-clamp-2" title={d.claimText}>
                          {d.claimText}
                        </p>
                      </td>
                      <td className="p-4 text-on-surface-variant/80 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-on-surface-variant/40" />
                          {new Date(d.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="p-4">
                        {d.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600">
                            Pending
                          </span>
                        )}
                        {d.status === 'under-review' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600">
                            Under Review
                          </span>
                        )}
                        {d.status === 'resolved' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                            Resolved
                          </span>
                        )}
                        {d.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => setSelectedDisputeDetail(d)}
                          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 border border-outline-variant hover:bg-surface-container rounded-xl transition-all"
                        >
                          View Case <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ==================== SUBMIT DISPUTE MODAL ==================== */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur overlay */}
          <div className="absolute inset-0 bg-surface/50 backdrop-blur-md" onClick={() => setIsSubmitModalOpen(false)} />

          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative z-10 animate-scaleUp p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4">
              <div className="flex items-center gap-3">
                <Scale className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-black text-on-surface uppercase tracking-wider">File Correction Dispute</h3>
              </div>
              <button 
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {disputeFormError && (
              <div className="bg-error-container border border-error/20 text-error rounded-2xl p-4 text-xs font-semibold leading-relaxed text-center animate-shake">
                {disputeFormError}
              </div>
            )}

            <form onSubmit={handleSubmitDispute} className="space-y-5">
              
              {/* Step 1: Select Credibility Report */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest">1. Select Target Analysis Report</h4>
                
                {/* Search / Paste Custom ID */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Or paste custom Report ID directly..."
                    value={customReportId}
                    onChange={(e) => setCustomReportId(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-outline-variant/80 rounded-xl bg-surface-container text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-on-surface-variant/40"
                  />
                  <button
                    type="button"
                    onClick={handleFetchCustomReport}
                    className="px-4 py-2 bg-surface-container-low border border-outline-variant hover:bg-surface-container rounded-xl text-xs font-bold text-on-surface transition-all whitespace-nowrap"
                  >
                    Lookup ID
                  </button>
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Select from Recent Audits
                  </label>
                  <select
                    value={selectedReportId}
                    onChange={(e) => setSelectedReportId(e.target.value)}
                    className="block w-full px-3 py-3 border border-outline-variant/80 rounded-xl bg-surface-container text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">-- Choose target credibility report --</option>
                    {reports.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.url} (Overall Score: {r.overallScore})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Input / Choose Flagged Claim */}
              {selectedReportId && (
                <div className="space-y-4 animate-slideDown">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-widest">2. Select Factual Claims Containing Errors</h4>
                  
                  {selectedReportClaims.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        Populate from Video's Flagged Claims:
                      </label>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-1 bg-surface-container rounded-xl border border-outline-variant/30">
                        {selectedReportClaims.map((claim, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setClaimText(claim.claim)}
                            className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                              claimText === claim.claim 
                                ? 'bg-primary/10 border-primary text-primary font-bold' 
                                : 'bg-surface hover:bg-surface-container-low border-outline-variant/50 text-on-surface'
                            }`}
                          >
                            <div className="flex justify-between items-center gap-2 mb-1">
                              <span className="text-[9px] font-black uppercase text-rose-500 tracking-wider">
                                {claim.category} • {claim.status}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed font-medium">{claim.claim}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Factual Claim (Make edits or type manually)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Input the exact claim statement you wish to dispute..."
                      value={claimText}
                      onChange={(e) => setClaimText(e.target.value)}
                      className="appearance-none block w-full px-3.5 py-3 border border-outline-variant/80 rounded-xl bg-surface-container text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-on-surface-variant/40"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Dispute Arguments & Evidence */}
              {selectedReportId && claimText && (
                <div className="space-y-4 animate-slideDown">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-widest">3. Correction Reasoning & Evidence</h4>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Factual Reasoning (min. 20 chars)
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Explain with precise facts why this claim is incorrect. Share official corporate disclosures or correct statements..."
                      value={reasonText}
                      onChange={(e) => setReasonText(e.target.value)}
                      className="appearance-none block w-full px-3.5 py-3 border border-outline-variant/80 rounded-xl bg-surface-container text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all resize-none placeholder:text-on-surface-variant/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        Evidence Links (Website URL, press release, research data)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddEvidence}
                        className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-primary hover:text-primary-hover bg-transparent border-0 p-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Link
                      </button>
                    </div>

                    <div className="space-y-2">
                      {evidenceLinks.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="url"
                            placeholder="e.g. https://yoursite.com/official-response"
                            value={link}
                            onChange={(e) => handleEvidenceChange(index, e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-outline-variant/80 rounded-xl bg-surface-container text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-on-surface-variant/40"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveEvidence(index)}
                            disabled={evidenceLinks.length === 1}
                            className="p-2 border border-outline-variant hover:bg-surface-container text-rose-500 rounded-xl disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4 border-t border-outline-variant/40 justify-end">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-5 py-2.5 bg-transparent border border-outline-variant hover:bg-surface-container rounded-xl text-xs font-bold text-on-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDispute || !selectedReportId || !claimText}
                  className="inline-flex justify-center items-center py-2.5 px-6 border border-transparent rounded-xl shadow-lg shadow-primary/10 text-xs font-bold text-white bg-primary hover:bg-primary-hover transition-all disabled:opacity-60"
                >
                  {isSubmittingDispute ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Submit Dispute <Send className="ml-1.5 w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================== VIEW DISPUTE DETAIL MODAL ==================== */}
      {selectedDisputeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface/50 backdrop-blur-md" onClick={() => setSelectedDisputeDetail(null)} />
          
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl max-w-xl w-full shadow-2xl relative z-10 animate-scaleUp p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4">
              <div>
                <span className="block text-[9px] font-black text-primary uppercase tracking-widest">Dispute Case Details</span>
                <h3 className="text-base font-black text-on-surface uppercase tracking-wider font-display">
                  Platform Challenge
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDisputeDetail(null)}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-left">
              
              {/* Report URL */}
              <div>
                <span className="block text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Target Report Video</span>
                <a 
                  href={selectedDisputeDetail.reportId?.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  {selectedDisputeDetail.reportId?.url} <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Disputed Claim */}
              <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/60">
                <span className="block text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1.5">Disputed Claim Statement</span>
                <p className="text-xs font-semibold text-on-surface leading-relaxed">
                  "{selectedDisputeDetail.claimText}"
                </p>
              </div>

              {/* Correction Reasoning */}
              <div>
                <span className="block text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Official Factual Reasoning</span>
                <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/40">
                  {selectedDisputeDetail.reasonText}
                </p>
              </div>

              {/* Evidence links */}
              {selectedDisputeDetail.evidenceLinks && selectedDisputeDetail.evidenceLinks.length > 0 && (
                <div>
                  <span className="block text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5">Submitted Evidence</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedDisputeDetail.evidenceLinks.map((link, idx) => (
                      <a 
                        key={idx} 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 bg-surface-container border border-outline-variant hover:bg-surface hover:text-primary rounded-xl transition-all"
                      >
                        Source #{idx + 1} <ExternalLink className="w-3 h-3 text-primary" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin decision notes */}
              <div className="pt-4 border-t border-outline-variant/60 space-y-2">
                <span className="block text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Moderator Response Details</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface">Case Status:</span>
                  {selectedDisputeDetail.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600">
                      Pending Approval
                    </span>
                  )}
                  {selectedDisputeDetail.status === 'under-review' && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600">
                      Under Review
                    </span>
                  )}
                  {selectedDisputeDetail.status === 'resolved' && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                      Resolved
                    </span>
                  )}
                  {selectedDisputeDetail.status === 'rejected' && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600">
                      Rejected
                    </span>
                  )}
                </div>

                {selectedDisputeDetail.resolutionNotes ? (
                  <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-xs text-on-surface leading-relaxed italic">
                    "{selectedDisputeDetail.resolutionNotes}"
                  </div>
                ) : (
                  <p className="text-[10px] text-on-surface-variant/70 italic">
                    The platform's fact-checking administrators are currently cross-referencing your correction statements. Check back shortly for notes.
                  </p>
                )}
              </div>

            </div>

            <div className="pt-4 border-t border-outline-variant/40 flex justify-end">
              <button
                onClick={() => setSelectedDisputeDetail(null)}
                className="px-6 py-2 bg-primary hover:bg-primary-hover rounded-xl text-xs font-bold text-white transition-colors"
              >
                Close Case Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default OrganizationDashboard;
