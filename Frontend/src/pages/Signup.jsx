import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User, AtSign, Loader2, ArrowRight, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Signup = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRepresentative, setIsRepresentative] = useState(false);
  const [orgCode, setOrgCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    const code = searchParams.get('orgCode');
    if (code) {
      setOrgCode(code);
      setIsRepresentative(true);
    }
  }, [searchParams]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setIsSubmitting(true);

    try {
      const payload = { name, username, email, password };
      if (isRepresentative && orgCode) {
        payload.orgCode = orgCode;
      }
      
      const response = await axios.post('/api/v1/auth/signup', payload);

      if (response.status === 201) {
        setUser(response.data);
        if (response.data.role === 'organization') {
          navigate('/organization-dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while signing up. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center space-x-2 group mb-6">
          <ShieldCheck className="w-10 h-10 text-primary group-hover:text-primary-light transition-colors" />
          <span className="text-3xl font-bold text-on-surface tracking-tight font-display">ClaimLens</span>
        </Link>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-on-surface font-display">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-hover transition-colors">
            Log in instead
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-on-surface-variant">
          Representing a brand?{' '}
          <Link to="/register-organization" className="font-bold text-amber-600 hover:text-amber-700 transition-colors">
            Register your organization first
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-container-lowest py-8 px-4 shadow-xl border border-outline-variant sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSignup}>
            
            {error && (
              <div className="bg-error-container border border-error/20 rounded-xl p-3 text-sm text-error text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-on-surface">
                Full Name
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-on-surface-variant" />
                </div>
                <input
                  type="text"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface">
                Username
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSign className="h-5 w-5 text-on-surface-variant" />
                </div>
                <input
                  type="text"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface">
                Email address
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-on-surface-variant" />
                </div>
                <input
                  type="email"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface">
                Password
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-on-surface-variant" />
                </div>
                <input
                  type="password"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface">
                Confirm Password
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-on-surface-variant" />
                </div>
                <input
                  type="password"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Organization Representative Selection */}
            <div className="flex items-center gap-2.5 py-1.5 border-t border-outline-variant/30 mt-2">
              <input
                id="isRepresentative"
                type="checkbox"
                checked={isRepresentative}
                onChange={(e) => setIsRepresentative(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-outline-variant text-primary focus:ring-primary/30 focus:ring-2 cursor-pointer bg-surface-container"
              />
              <label htmlFor="isRepresentative" className="text-xs font-bold text-on-surface cursor-pointer select-none">
                I am an official Organization Representative
              </label>
            </div>

            {isRepresentative && (
              <div className="animate-fadeIn p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Representative Portal</span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  Enter the unique code provided to register under your organization's administrative profile.
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Organization Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. nestle-health"
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value)}
                    className="appearance-none block w-full px-3 py-2.5 border border-outline-variant rounded-xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md shadow-primary/10 text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign up <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
