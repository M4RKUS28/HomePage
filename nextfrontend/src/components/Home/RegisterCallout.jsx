// frontend/src/components/Home/RegisterCallout.jsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { Link } from '../../i18n/navigation';
import { UserPlus, MessageSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslations } from 'next-intl';

const RegisterCallout = () => {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const t = useTranslations('registerCallout');
  
  // Don't show this component if user is already logged in
  if (currentUser) return null;
  
  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`py-16 px-4 my-16 rounded-lg backdrop-blur-lg ${
        theme === 'dark' ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80' : 'bg-gradient-to-br from-white/90 to-gray-100/90 shadow-xl'
      }`}
    >
      <div className='container mx-auto max-w-4xl text-center'>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <MessageSquare size={50} className="mx-auto mb-6 text-primary" />
        </motion.div>
        
        <motion.h3 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={`text-3xl md:text-4xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          {t('title')}
        </motion.h3>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className={`text-lg max-w-2xl mx-auto mb-8 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {t('description')}
        </motion.p>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <Link 
            href="/register" 
            className="btn btn-primary text-lg px-6 py-3 flex items-center justify-center"
          >
            <UserPlus size={20} className="mr-2" />
            {t('createAccount')}
          </Link>
          <Link 
            href="/login" 
            className={`btn text-lg px-6 py-3 flex items-center justify-center ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <MessageSquare size={20} className="mr-2" />
            {t('signIn')}
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default RegisterCallout;