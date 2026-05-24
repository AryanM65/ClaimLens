import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Building2, Globe, FileText, ChevronRight, CheckCircle, Copy, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';

const RegisterOrganization = () => {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/v1/organizations', {
        organizationName: name,
        website,
        orgCode: orgCode.trim().toLowerCase(),
        description,
      });

      if (response.status === 201) {
        setSuccessCode(response.data.orgCode);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during organization registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(successCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center items-center space-x-2 group mb-6">
          <ShieldCheck className="w-10 h-10 text-primary group-hover:text-primary-light transition-colors" />
          <span className="text-3xl font-black text-on-surface tracking-tight font-display">ClaimLens</span>
        </div>
        <h2 className="mt-2 text-center text-3xl font-black text-on-surface font-display tracking-tight">
          Register Your Organization
        </h2>
        <p className="mt-2 text-center text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
          Create an official organization account to challenge factual claims, view advanced credibility audit trails, and manage disputes.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative">
        <div className="bg-surface-container-lowest/80 backdrop-blur-md py-8 px-6 shadow-2xl border border-outline-variant/60 sm:rounded-3xl sm:px-12 relative z-10">
          
          {!successCode ? (
            <form onSubmit={handleRegister} className="space-y-6">
              
              {error && (
                <div className="bg-error-container border border-error/25 rounded-2xl p-4 text-xs text-error font-medium leading-relaxed text-center animate-shake">
                  {error}
                </div>
              )}

              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                  Organization Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-on-surface-variant" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nestle India"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-4 py-3 border border-outline-variant/80 rounded-2xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                  Corporate Website URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-on-surface-variant" />
                  </div>
                  <input
                    type="url"
                    required
                    placeholder="https://nestle.in"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-4 py-3 border border-outline-variant/80 rounded-2xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Custom Org Code */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                  Desired Organization Code (Unique)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="font-bold text-on-surface-variant text-sm pl-0.5">@</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. nestle-health"
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-4 py-3 border border-outline-variant/80 rounded-2xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-on-surface-variant leading-relaxed">
                  This lowercase slug is unique to your brand and is required by representatives to register or log in.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                  Brief Description & Intent
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3.5 pointer-events-none">
                    <FileText className="h-5 w-5 text-on-surface-variant" />
                  </div>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide a short description of the organization and why you are creating this profile..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-4 py-3 border border-outline-variant/80 rounded-2xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>

              {/* Submit */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center py-3.5 px-6 border border-transparent rounded-2xl shadow-lg shadow-primary/10 text-sm font-bold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Register Organization <ChevronRight className="ml-1.5 w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 space-y-6 animate-fadeIn">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-2">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-black text-on-surface tracking-tight">Organization Registered!</h3>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
                Your organization profile has been successfully drafted. Now, copy this unique code and proceed to create your administrative representative account.
              </p>

              {/* Copyable Org Code Card */}
              <div className="bg-surface-container-low border border-outline-variant/75 rounded-2xl p-4 flex items-center justify-between gap-4 max-w-sm mx-auto">
                <div className="text-left">
                  <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Your Org Code</span>
                  <span className="text-sm font-black text-primary font-mono">{successCode}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="p-2.5 rounded-xl border border-outline-variant hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5"
                  title="Copy Org Code"
                >
                  {copied ? (
                    <span className="text-[10px] font-bold text-emerald-500">Copied!</span>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Proceed Action Button */}
              <div className="pt-4 border-t border-outline-variant/40">
                <Link
                  to={`/signup?orgCode=${successCode}`}
                  className="w-full inline-flex justify-center items-center py-3.5 px-6 border border-transparent rounded-2xl shadow-lg shadow-primary/10 text-sm font-bold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary transition-all hover:-translate-y-0.5"
                >
                  Create Representative Account <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default RegisterOrganization;
