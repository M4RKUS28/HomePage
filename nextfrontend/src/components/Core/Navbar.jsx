'use client';
// Client component for Navbar with SSR initial data
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { LogIn, LogOut, UserPlus, LayoutDashboard, ShieldCheck, Menu, X, Home, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import ThemeToggle from '../UI/ThemeToggle';
import { useLanguage } from '../../contexts/LanguageContext';

const NavLink = ({ href, children, onClick }) => {
  const { theme } = useTheme();
  
  return (
    <Link
      href={href}
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

const MobileNavLink = ({ href, children, onClick }) => {
  const { theme } = useTheme();
  
  return (
    <Link
      href={href}
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

const Navbar = ({ initialHeaderText = 'Portfolio' }) => {
  const { currentUser, logout } = useAuth();
  const { theme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsOpen(false);
  };

  const LanguageToggle = ({ mobile }) => (
    <button
      onClick={() => setLanguage(language === 'en' ? 'de' : 'en')}
      title="Toggle language"
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border transition-colors ${
        theme === 'dark'
          ? 'border-gray-600 text-gray-300 hover:border-primary hover:text-primary'
          : 'border-gray-300 text-gray-600 hover:border-secondary hover:text-secondary'
      } ${mobile ? 'w-full justify-center py-2 text-sm mt-1' : ''}`}
    >
      <Globe size={14} />
      {language === 'en' ? 'DE' : 'EN'}
    </button>
  );

  return (
    <nav className={`shadow-lg sticky top-0 z-50 transition-colors ${
      theme === 'dark' 
        ? 'bg-gray-800' 
        : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className={`flex-shrink-0 text-xl font-bold ${
              theme === 'dark' 
                ? 'text-white' 
                : 'text-gray-900'
            }`}>
              <motion.span 
                className="inline-block"
                initial={false}
                whileHover={{ scale: 1.05 }}
              >
                {initialHeaderText}
              </motion.span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-2">
            <div className="flex items-baseline space-x-4">
              <NavLink href="/"><Home size={18} className="inline mr-1"/> {t('nav', 'home')}</NavLink>
              {currentUser ? (
                <>
                  <NavLink href="/dashboard"><LayoutDashboard size={18} className="inline mr-1"/> {t('nav', 'dashboard')}</NavLink>
                  {currentUser.is_admin && (
                    <NavLink href="/admin"><ShieldCheck size={18} className="inline mr-1"/> {t('nav', 'admin')}</NavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      theme === 'dark' 
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                        : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <LogOut size={18} className="inline mr-1"/> {t('nav', 'logout')} ({currentUser.username})
                  </button>
                </>
              ) : (
                <>
                  <NavLink href="/login"><LogIn size={18} className="inline mr-1"/> {t('nav', 'login')}</NavLink>
                  <NavLink href="/register"><UserPlus size={18} className="inline mr-1"/> {t('nav', 'register')}</NavLink>
                </>
              )}
            </div>
            <div className="ml-4 flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
          
          <div className="md:hidden flex items-center space-x-2">
            <LanguageToggle />
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
              <MobileNavLink href="/" onClick={() => setIsOpen(false)}><Home size={18} className="inline mr-1"/> {t('nav', 'home')}</MobileNavLink>
              {currentUser ? (
                <>
                  <MobileNavLink href="/dashboard" onClick={() => setIsOpen(false)}><LayoutDashboard size={18} className="inline mr-1"/> {t('nav', 'dashboard')}</MobileNavLink>
                  {currentUser.is_admin && (
                    <MobileNavLink href="/admin" onClick={() => setIsOpen(false)}><ShieldCheck size={18} className="inline mr-1"/> {t('nav', 'admin')}</MobileNavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      theme === 'dark' 
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                        : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <LogOut size={18} className="inline mr-1"/> {t('nav', 'logout')} ({currentUser.username})
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink href="/login" onClick={() => setIsOpen(false)}><LogIn size={18} className="inline mr-1"/> {t('nav', 'login')}</MobileNavLink>
                  <MobileNavLink href="/register" onClick={() => setIsOpen(false)}><UserPlus size={18} className="inline mr-1"/> {t('nav', 'register')}</MobileNavLink>
                </>
              )}
              <LanguageToggle mobile />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;