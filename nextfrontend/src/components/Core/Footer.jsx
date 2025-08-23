'use client';
// Client component for Footer with SSR initial data
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { Github, Linkedin, Mail, Globe, Twitter } from 'lucide-react';

const Footer = ({ 
  headerText = "Portfolio", 
  socialLinks = [], 
  ownerName = "Portfolio" 
}) => {
  const { theme } = useTheme();
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
    return {
      icon: Icon,
      href: link.url,
      label: link.platform
    };
  });

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
          
          <div className="flex space-x-4">
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
              <span className="text-sm opacity-70">No social links found</span>
            )}
          </div>
        </div>
        
        <div className="mt-8 pt-4 text-center text-sm border-t border-gray-700">
          <p>
            © {currentYear} {ownerName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;