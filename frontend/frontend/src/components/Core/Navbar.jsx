import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogIn, LogOut, UserPlus, LayoutDashboard, ShieldCheck, Menu, X, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // <--- ADD AnimatePresence HERE


const NavLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
  >
    {children}
  </Link>
);

const MobileNavLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
  >
    {children}
  </Link>
);


const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <nav className="bg-gray-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 text-white text-xl font-bold animate-pulse-fast">
              MyPortfolio
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink to="/"><Home size={18} className="inline mr-1"/> Home</NavLink>
              {currentUser ? (
                <>
                  <NavLink to="/dashboard"><LayoutDashboard size={18} className="inline mr-1"/> Dashboard</NavLink>
                  {currentUser.is_admin && (
                    <NavLink to="/admin"><ShieldCheck size={18} className="inline mr-1"/> Admin</NavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
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
          </div>
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
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
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <MobileNavLink to="/" onClick={() => setIsOpen(false)}><Home size={18} className="inline mr-1"/> Home</MobileNavLink>
            {currentUser ? (
              <>
                <MobileNavLink to="/dashboard" onClick={() => setIsOpen(false)}><LayoutDashboard size={18} className="inline mr-1"/> Dashboard</MobileNavLink>
                {currentUser.is_admin && (
                  <MobileNavLink to="/admin" onClick={() => setIsOpen(false)}><ShieldCheck size={18} className="inline mr-1"/> Admin</MobileNavLink>
                )}
                <button
                  onClick={handleLogout}
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors"
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