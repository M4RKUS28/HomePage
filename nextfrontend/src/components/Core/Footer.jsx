'use client';
// Client component for Footer with SSR initial data
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from 'next-intl';
import { Github, Linkedin, Mail, Globe, Twitter, Languages } from 'lucide-react';

const LOCALE_LABELS = {
  en: 'English',
  de: 'Deutsch',
  vi: 'Tiếng Việt',
  fr: 'Français',
  it: 'Italiano',
  zh: '中文',
  ja: '日本語',
  es: 'Español',
  pt: 'Português',
};

const Footer = ({ 
  headerText = "Portfolio", 
  socialLinks = [], 
  ownerName = "Portfolio" 
}) => {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { locale, locales, changeLocale, isPending } = useLanguage();
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();
  
  // Map platform names to Lucide icons
  const getIconForPlatform = (platform) => {
    switch (platform.toLowerCase()) {
      case 'github':
        return Github;
      case 'linkedin':
        return Linkedin;
      case 'email':
        return Mail;
      case 'twitter':
        return Twitter;
      case 'website':
      default:
        return Globe;
    }
  };

  // Create social link components
  const socialLinkComponents = socialLinks.map((link, index) => {
    const Icon = getIconForPlatform(link.platform);
    // Coerce url to string - Pydantic v2 HttpUrl objects serialize as non-primitives
    const href = link.url ? String(link.url) : '#';
    return {
      icon: Icon,
      href,
      label: link.platform
    };
  });

  const handleLocaleChange = (newLocale) => {
    changeLocale(newLocale, { userId: currentUser?.id });
  };

  return (
    <footer className={`py-8 border-t transition-colors ${
      theme === 'dark' 
        ? 'bg-gray-800 text-gray-400 border-gray-700' 
        : 'bg-gray-100 text-gray-600 border-gray-200'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <motion.div 
              initial={false}
              whileHover={{ scale: 1.05 }}
              className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
            >
              {headerText}
            </motion.div>
          </div>
          
          <div className="flex items-center space-x-4">
            {socialLinkComponents.length > 0 ? (
              socialLinkComponents.map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={`social-${social.label}-${index}`}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.2, y: -3 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-2 rounded-full transition-colors ${
                      theme === 'dark' 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                    aria-label={social.label}
                  >
                    <Icon size={18} />
                  </motion.a>
                );
              })
            ) : (
              <span className="text-sm opacity-70">{t('noSocialLinks')}</span>
            )}
          </div>
        </div>
        
        {/* Language selector + copyright */}
        <div className={`mt-8 pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Language selector */}
            <div className="flex items-center gap-2">
              <Languages size={16} className="opacity-70" />
              <span className="text-sm opacity-70">{t('language')}:</span>
              <div className="flex gap-1">
                {locales.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleLocaleChange(loc)}
                    disabled={isPending}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      locale === loc
                        ? theme === 'dark'
                          ? 'bg-primary text-white font-semibold'
                          : 'bg-primary text-white font-semibold'
                        : theme === 'dark'
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {LOCALE_LABELS[loc] || loc.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Copyright */}
            <p className="text-sm text-center">
              © {currentYear} {ownerName}. {t('allRightsReserved')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;