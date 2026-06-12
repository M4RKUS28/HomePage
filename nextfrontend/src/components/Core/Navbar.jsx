'use client';
// Client component for Navbar with SSR initial data
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { LogIn, LogOut, UserPlus, LayoutDashboard, ShieldCheck, Menu, X, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import ThemeToggle from '../UI/ThemeToggle';

const navItemClass =
  'group relative inline-flex items-center gap-1.5 px-3 py-2 rounded-md font-data text-[0.72rem] font-medium uppercase tracking-[0.18em] text-ink-2 hover:text-ink transition-colors';

const NavLink = ({ href, children, onClick }) => (
  <Link href={href} onClick={onClick} className={navItemClass}>
    <span className="relative z-10 inline-flex items-center gap-1.5">{children}</span>
    <span className="absolute bottom-0.5 left-3 right-3 h-px origin-left scale-x-0 bg-[var(--app-accent)] transition-transform duration-300 group-hover:scale-x-100" />
  </Link>
);

const MobileNavLink = ({ href, children, onClick }) => (
  <Link
    href={href}
    onClick={onClick}
    className="flex items-center gap-2 px-3 py-3 rounded-lg font-data text-xs font-medium uppercase tracking-[0.18em] text-ink-2 hover:text-ink hover:bg-accent-soft transition-colors"
  >
    {children}
  </Link>
);

const Navbar = ({ initialHeaderText = 'Portfolio' }) => {
  const { currentUser, logout } = useAuth();
  const t = useTranslations('nav');
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsOpen(false);
  };

  return (
    <nav className="nav-glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Wordmark with live status dot */}
          <Link href="/" className="flex-shrink-0 inline-flex items-center gap-2.5">
            <span className="status-dot" />
            <motion.span
              className="inline-block font-display text-lg font-bold tracking-tight text-ink"
              initial={false}
              whileHover={{ scale: 1.04 }}
            >
              {initialHeaderText}
            </motion.span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/"><Home size={14} /> {t('home')}</NavLink>
            {currentUser ? (
              <>
                <NavLink href="/dashboard"><LayoutDashboard size={14} /> {t('dashboard')}</NavLink>
                {currentUser.is_admin && (
                  <NavLink href="/admin"><ShieldCheck size={14} /> {t('admin')}</NavLink>
                )}
                <button onClick={handleLogout} className={navItemClass}>
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    <LogOut size={14} /> {t('logout')} ({currentUser.username})
                  </span>
                  <span className="absolute bottom-0.5 left-3 right-3 h-px origin-left scale-x-0 bg-[var(--app-accent)] transition-transform duration-300 group-hover:scale-x-100" />
                </button>
              </>
            ) : (
              <>
                <NavLink href="/login"><LogIn size={14} /> {t('login')}</NavLink>
                <NavLink href="/register"><UserPlus size={14} /> {t('register')}</NavLink>
              </>
            )}
            <div className="ml-3 flex items-center">
              <ThemeToggle />
            </div>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-lg border border-line-strong text-ink-2 hover:text-accent hover:border-accent transition-colors"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">{t('openMenu')}</span>
              {!isOpen ? <Menu className="block h-5 w-5" /> : <X className="block h-5 w-5" />}
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
            className="md:hidden overflow-hidden border-t border-line"
            id="mobile-menu"
          >
            <div className="px-3 pt-2 pb-4 space-y-1 bg-surface">
              <MobileNavLink href="/" onClick={() => setIsOpen(false)}><Home size={15} /> {t('home')}</MobileNavLink>
              {currentUser ? (
                <>
                  <MobileNavLink href="/dashboard" onClick={() => setIsOpen(false)}><LayoutDashboard size={15} /> {t('dashboard')}</MobileNavLink>
                  {currentUser.is_admin && (
                    <MobileNavLink href="/admin" onClick={() => setIsOpen(false)}><ShieldCheck size={15} /> {t('admin')}</MobileNavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-3 rounded-lg font-data text-xs font-medium uppercase tracking-[0.18em] text-ink-2 hover:text-ink hover:bg-accent-soft transition-colors text-left"
                  >
                    <LogOut size={15} /> {t('logout')} ({currentUser.username})
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink href="/login" onClick={() => setIsOpen(false)}><LogIn size={15} /> {t('login')}</MobileNavLink>
                  <MobileNavLink href="/register" onClick={() => setIsOpen(false)}><UserPlus size={15} /> {t('register')}</MobileNavLink>
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
