// Updated Navbar.jsx to use header text from CV data
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogIn, LogOut, UserPlus, LayoutDashboard, ShieldCheck, Menu, X, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../../contexts/ThemeContext';
import ThemeToggle from '../UI/ThemeToggle';
import { getCVDataApi } from '../../api/cv';

const NavLink = ({ to, children, onClick }) => {
  const { theme } = useContext(ThemeContext);
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`hover:bg-opacity-20 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group overflow-hidden ${
        theme === 'dark' 
          ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
          : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
      }`}
    >
      <span className="relative z-10">{children}</span>
      <motion.span
        className={`absolute bottom-0 left-0 h-0.5 w-0 ${
          theme === 'dark' ? 'bg-primary' : 'bg-secondary'
        }`}
        initial={{ width: '0%' }}
        whileHover={{ width: '100%' }}
        transition={{ duration: 0.3 }}
      />
    </Link>
  );
};

const MobileNavLink = ({ to, children, onClick }) => {
  const { theme } = useContext(ThemeContext);
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
        theme === 'dark' 
          ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
          : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
      }`}
    >
      {children}
    </Link>
  );
};

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [headerText, setHeaderText] = useState('Portfolio');
  
  useEffect(() => {
    const fetchCVData = async () => {
      try {
        const data = await getCVDataApi();
        if (data && data.personalInfo && data.personalInfo.headerText) {
          setHeaderText(data.personalInfo.headerText);
        }
      } catch (err) {
        console.error("Error fetching header text:", err);
        // Keep default header text if there's an error
      }
    };
    
    fetchCVData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <nav className={`shadow-lg sticky top-0 z-50 transition-colors ${
      theme === 'dark' 
        ? 'bg-gray-800' 
        : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className={`flex-shrink-0 text-xl font-bold ${
              theme === 'dark' 
                ? 'text-white' 
                : 'text-gray-900'
            }`}>
              <motion.span 
                className="inline-block"
                initial={false}
                whileHover={{ scale: 1.05 }}
              >
                {headerText}
              </motion.span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-2">
            <div className="flex items-baseline space-x-4">
              <NavLink to="/"><Home size={18} className="inline mr-1"/> Home</NavLink>
              {currentUser ? (
                <>
                  <NavLink to="/dashboard"><LayoutDashboard size={18} className="inline mr-1"/> Dashboard</NavLink>
                  {currentUser.is_admin && (
                    <NavLink to="/admin"><ShieldCheck size={18} className="inline mr-1"/> Admin</NavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      theme === 'dark' 
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                        : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <LogOut size={18} className="inline mr-1"/> Logout ({currentUser.username})
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login"><LogIn size={18} className="inline mr-1"/> Login</NavLink>
                  <NavLink to="/register"><UserPlus size={18} className="inline mr-1"/> Register</NavLink>
                </>
              )}
            </div>
            <div className="ml-4">
              <ThemeToggle />
            </div>
          </div>
          
          <div className="md:hidden flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? <Menu className="block h-6 w-6" /> : <X className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden overflow-hidden" 
          id="mobile-menu"
        >
          <div className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <MobileNavLink to="/" onClick={() => setIsOpen(false)}><Home size={18} className="inline mr-1"/> Home</MobileNavLink>
            {currentUser ? (
              <>
                <MobileNavLink to="/dashboard" onClick={() => setIsOpen(false)}><LayoutDashboard size={18} className="inline mr-1"/> Dashboard</MobileNavLink>
                {currentUser.is_admin && (
                  <MobileNavLink to="/admin" onClick={() => setIsOpen(false)}><ShieldCheck size={18} className="inline mr-1"/> Admin</MobileNavLink>
                )}
                <button
                  onClick={handleLogout}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  <LogOut size={18} className="inline mr-1"/> Logout ({currentUser.username})
                </button>
              </>
            ) : (
              <>
                <MobileNavLink to="/login" onClick={() => setIsOpen(false)}><LogIn size={18} className="inline mr-1"/> Login</MobileNavLink>
                <MobileNavLink to="/register" onClick={() => setIsOpen(false)}><UserPlus size={18} className="inline mr-1"/> Register</MobileNavLink>
              </>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;