'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../hooks/useAuth';
import ProjectsGrid from '../../../components/Home/ProjectsGrid';
import MessageList from '../../../components/Admin/MessageList';
import UserManagement from '../../../components/Admin/UserManagement';
import CVEditor from '../../../components/Admin/CVEditor';
import AccessLog from '../../../components/Admin/AccessLog';
import AdminSettings from '../../../components/Admin/Settings';
import { Briefcase, MessageCircle, UserCog, FileEdit, MapPin, Cog } from 'lucide-react';
import AdminRoute from '../../../components/Auth/AdminRoute';
import { useTranslations } from 'next-intl';

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
};
const pageTransition = { type: "tween", ease: "anticipate", duration: 0.5 };

const TabButton = ({ children, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2.5 font-medium text-sm rounded-md transition-all duration-300 ${isActive ? 'nav-button active' : 'nav-button'}`}
    >
        {children}
    </button>
);

export default function AdminDashboardPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('projects');
  const t = useTranslations('admin');

  const renderContent = () => {
    switch (activeTab) {
      case 'projects':  return <ProjectsGrid />;
      case 'messages':  return <MessageList />;
      case 'users':     return <UserManagement />;
      case 'cv':        return <CVEditor />;
      case 'access':    return <AccessLog />;
      case 'settings':  return <AdminSettings />;
      default:          return null;
    }
  };

  return (
    <AdminRoute>
      <motion.div
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="py-8"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold text-ink">Admin Dashboard</h1>
          <p className="text-lg text-ink-2 mt-2">{t('subtitle', { name: currentUser?.username })}</p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2 p-2 bg-raised border border-line rounded-lg max-w-2xl mx-auto">
          <TabButton onClick={() => setActiveTab('projects')} isActive={activeTab === 'projects'}>
            <Briefcase size={16} className="inline mr-1.5" /> {t('tabs.projects')}
          </TabButton>
          <TabButton onClick={() => setActiveTab('messages')} isActive={activeTab === 'messages'}>
            <MessageCircle size={16} className="inline mr-1.5" /> {t('tabs.messages')}
          </TabButton>
          <TabButton onClick={() => setActiveTab('users')} isActive={activeTab === 'users'}>
            <UserCog size={16} className="inline mr-1.5" /> {t('tabs.users')}
          </TabButton>
          <TabButton onClick={() => setActiveTab('cv')} isActive={activeTab === 'cv'}>
            <FileEdit size={16} className="inline mr-1.5" /> {t('tabs.cv')}
          </TabButton>
          <TabButton onClick={() => setActiveTab('access')} isActive={activeTab === 'access'}>
            <MapPin size={16} className="inline mr-1.5" /> {t('tabs.access')}
          </TabButton>
          <TabButton onClick={() => setActiveTab('settings')} isActive={activeTab === 'settings'}>
            <Cog size={16} className="inline mr-1.5" /> {t('tabs.settings')}
          </TabButton>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
          >
              {renderContent()}
          </motion.div>
        </AnimatePresence>

      </motion.div>
    </AdminRoute>
  );
}
