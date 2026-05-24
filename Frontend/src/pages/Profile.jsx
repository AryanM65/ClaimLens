import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  User, Mail, Shield, Award, Edit2, Save, X, AlertTriangle, 
  CheckCircle, Loader2, Sparkles, LogOut, Key, BarChart, Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Profile data fetch state
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status alerts state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/v1/users/profile');
      setProfile(response.data);
      setName(response.data.name);
      setEmail(response.data.email);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setErrorMsg('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Name and email cannot be empty.');
      return;
    }

    if (password && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = { name, email };
      if (password) {
        payload.password = password;
      }

      const response = await axios.put('/api/v1/users/profile', payload);
      
      // Update local states
      setProfile(response.data);
      setUser(response.data); // Update AuthContext user details dynamically!
      setPassword('');
      setConfirmPassword('');
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMsg(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (max 5MB)
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size cannot exceed 5MB.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await axios.post('/api/v1/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setProfile(response.data);
      setUser(response.data); // Dynamic sync globally
      setSuccessMsg('Avatar updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Avatar upload error:', error);
      setErrorMsg(error.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/v1/auth/logout');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-background flex flex-col items-center justify-center text-on-surface-variant">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-sm font-medium">Loading your ClaimLens profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background py-16 transition-all duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl mb-4 font-display flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            Your <span className="text-primary font-display">Profile</span>
          </h1>
          <p className="text-lg text-on-surface-variant">
            Manage your account settings, credentials, subscription plans, and review your audit usage statistics.
          </p>
        </div>

        {/* Dynamic Alerts */}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl p-4 mb-8 text-sm flex gap-2 items-center animate-fadeIn">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-2xl p-4 mb-8 text-sm flex gap-2 items-center animate-fadeIn">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Left Block - Quick Metadata and Avatar */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 shadow-sm flex flex-col items-center text-center">
            
            {/* Interactive Profile Photo Container */}
            <div className="relative group mb-4 cursor-pointer" onClick={handleAvatarClick}>
              <div className="h-28 w-28 rounded-full bg-primary/10 border-2 border-outline-variant overflow-hidden flex items-center justify-center text-primary font-bold text-4xl shadow-sm transition-all duration-300 group-hover:opacity-95 group-hover:border-primary">
                {uploading ? (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                ) : profile?.profilePicture ? (
                  <img 
                    src={profile.profilePicture} 
                    alt={profile.name} 
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  />
                ) : (
                  profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              
              {/* Photo Input (Hidden) */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              
              {/* Camera Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-on-surface font-display leading-tight">{profile?.name}</h2>
            <p className="text-sm text-primary font-semibold mt-1">@{profile?.username}</p>

            <hr className="w-full border-outline-variant/60 my-6" />

            <div className="w-full space-y-4 text-sm text-left">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">Account Role:</span>
                <span className="capitalize font-bold text-on-surface flex items-center gap-1">
                  <Shield className="h-4 w-4 text-primary" />
                  {profile?.role || 'User'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">Current Plan:</span>
                <span className="text-primary font-extrabold uppercase tracking-wide bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-md text-[10px]">
                  {profile?.plan || 'Free'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">Audits Done:</span>
                <span className="font-bold text-on-surface flex items-center gap-1">
                  <BarChart className="h-4 w-4 text-outline" />
                  {profile?.analysisCount || 0} Reports
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-8 w-full inline-flex items-center justify-center gap-2 py-3 px-4 border border-outline-variant hover:bg-surface-container rounded-xl text-sm font-semibold text-on-surface-variant transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          {/* Right Block - Profile details or Edit view */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 shadow-md">
            
            {!isEditing ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-outline-variant pb-4">
                  <h3 className="text-2xl font-bold text-on-surface font-display">Account Information</h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-outline-variant hover:bg-surface-container text-xs font-bold text-on-surface rounded-xl transition-all"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit Profile
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5">
                    <span className="text-[11px] text-on-surface-variant font-semibold block mb-1">Full Name</span>
                    <span className="text-base font-bold text-on-surface block flex items-center gap-2">
                      <User className="h-4.5 w-4.5 text-primary" />
                      {profile?.name}
                    </span>
                  </div>

                  <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5">
                    <span className="text-[11px] text-on-surface-variant font-semibold block mb-1">Email Address</span>
                    <span className="text-base font-bold text-on-surface block flex items-center gap-2 truncate">
                      <Mail className="h-4.5 w-4.5 text-primary" />
                      {profile?.email}
                    </span>
                  </div>

                  <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5">
                    <span className="text-[11px] text-on-surface-variant font-semibold block mb-1">Audit Plan Limits</span>
                    <span className="text-base font-bold text-on-surface block flex items-center gap-2">
                      <Award className="h-4.5 w-4.5 text-primary" />
                      100 Audits / Month
                    </span>
                  </div>

                  <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5">
                    <span className="text-[11px] text-on-surface-variant font-semibold block mb-1">Password Status</span>
                    <span className="text-base font-bold text-on-surface block flex items-center gap-2">
                      <Key className="h-4.5 w-4.5 text-primary" />
                      ••••••••••••
                    </span>
                  </div>
                </div>

                {/* Pro Tier Pitch */}
                <div className="bg-gradient-to-r from-primary/10 to-surface-container border border-primary/20 rounded-2xl p-6 mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-primary animate-bounce" />
                    <h4 className="font-bold text-primary font-display">Upgrade to ClaimLens Pro</h4>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                    Unlock programmatic video API auditing, continuous dashboard campaigns, visual AI deception markers, and unlimited parallel video transcriber downloads.
                  </p>
                  <button className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-sm transition-all">
                    Upgrade Plan
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="flex items-center justify-between border-b border-outline-variant pb-4">
                  <h3 className="text-2xl font-bold text-on-surface font-display">Edit Profile</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setName(profile.name);
                      setEmail(profile.email);
                      setPassword('');
                      setConfirmPassword('');
                      setIsEditing(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant hover:bg-surface-container text-xs font-bold text-on-surface-variant rounded-xl transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-2 appearance-none block w-full px-4 py-3 border border-outline-variant rounded-xl shadow-sm bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-on-surface">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2 appearance-none block w-full px-4 py-3 border border-outline-variant rounded-xl shadow-sm bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                    />
                  </div>
                </div>

                <div className="border-t border-outline-variant/60 pt-6 mt-6">
                  <h4 className="font-bold text-on-surface text-sm mb-4 flex items-center gap-1.5">
                    <Key className="h-4.5 w-4.5 text-primary" />
                    Change Password (Optional)
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-on-surface">New Password</label>
                      <input
                        type="password"
                        placeholder="Leave blank to keep unchanged"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-2 appearance-none block w-full px-4 py-3 border border-outline-variant rounded-xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-on-surface">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Leave blank to keep unchanged"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-2 appearance-none block w-full px-4 py-3 border border-outline-variant rounded-xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-outline-variant/60 pt-6 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 rounded-xl border border-outline-variant text-sm font-medium hover:bg-surface-container transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-sm transition-all"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
