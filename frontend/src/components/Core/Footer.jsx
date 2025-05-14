// frontend/frontend/src/components/Core/Footer.jsx (updated)
import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Github, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  const { theme } = useContext(ThemeContext);
  const currentYear = new Date().getFullYear();
  
  const socialLinks = [
    { icon: Github, href: 'https://github.com/M4RKUS28', label: 'GitHub' },
    { icon: Linkedin, href: 'https://www.linkedin.com/in/markus-huber-0132282bb/', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:markus28.huber@tum.de', label: 'Email' }
  ];
  
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
              MyPortfolio
            </motion.div>
            <p className="mt-2 text-sm">
              Showcasing my work and skills in web development
            </p>
          </div>
          
          <div className="flex space-x-4">
            {socialLinks.map((social, index) => {
              const Icon = social.icon;
              return (
                <motion.a
                  key={index}
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
            })}
          </div>
        </div>
        
        <div className="mt-8 pt-4 text-center text-sm border-t border-gray-700">
          <p>
            © {currentYear} [Your Name]. All rights reserved.
          </p>
          <p className="mt-2">
            Built with React, Tailwind CSS, and FastAPI
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;