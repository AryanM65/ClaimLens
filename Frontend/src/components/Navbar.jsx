import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, User, Scale } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Navbar = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

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

  return (
    <nav className="fixed w-full z-50 top-0 start-0 border-b border-outline-variant bg-surface/85 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between p-4">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2 group">
          <ShieldCheck className="w-8 h-8 text-primary group-hover:text-primary-light transition-colors" />
          <span className="self-center text-2xl font-bold whitespace-nowrap text-on-surface tracking-tight font-display">ClaimLens</span>
        </Link>
        
        <div className="flex md:order-2 items-center gap-3 sm:gap-4">
          {user ? (
            <>
              {/* Dashboard Link */}
              <Link 
                to={user.role === 'organization' ? "/organization-dashboard" : "/dashboard"} 
                className="hidden sm:inline-flex text-xs font-semibold px-4 py-2 border border-outline-variant hover:bg-surface-container rounded-xl transition-all duration-200"
              >
                {user.role === 'organization' ? 'Org Dashboard' : 'Dashboard'}
              </Link>

              {/* Admin Room Link */}
              {user.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl transition-all duration-200"
                >
                  <Scale className="w-3.5 h-3.5" />
                  Admin Room
                </Link>
              )}
              
              {/* Profile Avatar Badge */}
              <Link 
                to="/profile" 
                className="flex items-center gap-2 p-1 pr-3 rounded-full border border-outline-variant hover:bg-surface-container bg-surface-container-low transition-colors group"
                title="View Profile"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold font-display overflow-hidden">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name ? user.name.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <span className="hidden md:inline text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                  @{user.username}
                </span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-surface-container border border-outline-variant text-on-surface-variant hover:text-rose-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-on-surface-variant hover:text-on-surface font-medium rounded-xl text-sm px-4 py-2.5 text-center transition-colors">
                Log In
              </Link>
              <Link to="/signup" className="text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:outline-none focus:ring-primary/30 font-medium rounded-xl text-sm px-5 py-2.5 text-center transition-all duration-300 shadow-md shadow-primary/10 hover:shadow-primary/25 hover:-translate-y-0.5">
                Get Started
              </Link>
            </>
          )}
        </div>

        <div className="hidden w-full md:flex md:w-auto md:order-1">
          <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-outline-variant rounded-xl md:space-x-8 md:flex-row md:mt-0 md:border-0 md:bg-transparent">
            <li>
              <Link to={user ? "/dashboard" : "/"} className="block py-2 px-3 text-primary rounded md:bg-transparent md:p-0">Home</Link>
            </li>
            {!user && (
              <>
                <li>
                  <Link to="/how-it-works" className="block py-2 px-3 text-on-surface-variant rounded hover:bg-surface-container-low md:hover:bg-transparent md:hover:text-primary md:p-0 transition-colors">How it Works</Link>
                </li>
                <li>
                  <Link to="/features" className="block py-2 px-3 text-on-surface-variant rounded hover:bg-surface-container-low md:hover:bg-transparent md:hover:text-primary md:p-0 transition-colors">Features</Link>
                </li>
              </>
            )}
            <li>
              <Link to="/community" className="block py-2 px-3 text-on-surface-variant rounded hover:bg-surface-container-low md:hover:bg-transparent md:hover:text-primary md:p-0 transition-colors">Community</Link>
            </li>
            {user && user.role === 'user' && (
              <li>
                <Link to="/analyze" className="block py-2 px-3 text-on-surface-variant rounded hover:bg-surface-container-low md:hover:bg-transparent md:hover:text-primary md:p-0 transition-colors">Analyze Ad</Link>
              </li>
            )}
            {!user && (
              <li>
                <Link to="/contact" className="block py-2 px-3 text-on-surface-variant rounded hover:bg-surface-container-low md:hover:bg-transparent md:hover:text-primary md:p-0 transition-colors">Contact Us</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
