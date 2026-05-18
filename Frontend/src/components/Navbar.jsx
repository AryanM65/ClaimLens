import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="fixed w-full z-50 top-0 start-0 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between p-4">
        <Link to="/" className="flex items-center space-x-2 group">
          <ShieldCheck className="w-8 h-8 text-indigo-500 group-hover:text-indigo-400 transition-colors" />
          <span className="self-center text-2xl font-bold whitespace-nowrap text-white tracking-tight">ClaimLens</span>
        </Link>
        <div className="flex md:order-2 space-x-3 md:space-x-4">
          {user ? (
            <Link to="/dashboard" className="text-white bg-indigo-600 hover:bg-indigo-500 focus:ring-4 focus:outline-none focus:ring-indigo-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-all duration-300 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white font-medium rounded-lg text-sm px-4 py-2.5 text-center transition-colors">
                Log In
              </Link>
              <Link to="/signup" className="text-white bg-indigo-600 hover:bg-indigo-500 focus:ring-4 focus:outline-none focus:ring-indigo-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-all duration-300 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5">
                Get Started
              </Link>
            </>
          )}
        </div>
        <div className="hidden w-full md:flex md:w-auto md:order-1">
          <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-800 rounded-lg md:space-x-8 md:flex-row md:mt-0 md:border-0 md:bg-transparent">
            <li>
              <Link to="/" className="block py-2 px-3 text-white rounded md:bg-transparent md:text-indigo-400 md:p-0">Home</Link>
            </li>
            <li>
              <a href="#how-it-works" className="block py-2 px-3 text-gray-400 rounded hover:bg-gray-800 md:hover:bg-transparent md:hover:text-indigo-300 md:p-0 transition-colors">How it Works</a>
            </li>
            <li>
              <a href="#features" className="block py-2 px-3 text-gray-400 rounded hover:bg-gray-800 md:hover:bg-transparent md:hover:text-indigo-300 md:p-0 transition-colors">Features</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
