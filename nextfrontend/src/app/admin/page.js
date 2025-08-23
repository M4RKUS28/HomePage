'use client';
import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import ProjectsGrid from '../../components/Home/ProjectsGrid';
import MessageList from '../../components/Admin/MessageList';
import UserManagement from '../../components/Admin/UserManagement';
import CVEditor from '../../components/Admin/CVEditor';
import { Briefcase, MessageCircle, UserCog, FileEdit } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import AdminRoute from '../../components/Auth/AdminRoute';

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
};
const pageTransition = { type: "tween", ease: "anticipate", duration: 0.5 };

const TabButton = ({ children, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2.5 font-medium text-sm rounded-md transition-all duration-300
                    ${isActive 
                        ? 'nav-button active' 
                        : 'nav-button'
                    }`}
    >
        {children}
    </button>
);

export default function AdminDashboardPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('projects');
  const { theme } = useContext(ThemeContext);
  
  const renderContent = () => {
    switch (activeTab) {
      case 'projects':
        return <ProjectsGrid />;
      case 'messages':
        return <MessageList />;
      case 'users':
        return <UserManagement />;
      case 'cv':
        return <CVEditor />;
      default:
        return null;
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
          <h1
             className={`
                text-4xl 
                font-bold 
                ${theme === 'dark' ? 'text-white' : 'text-gray-800'}
              `}
            >Admin Dashboard</h1>
          <p className="text-lg text-gray-400 mt-2">Manage your site, {currentUser?.username}.</p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2 p-2 bg-gray-800/50 rounded-lg max-w-2xl mx-auto">
          <TabButton onClick={() => setActiveTab('projects')} isActive={activeTab === 'projects'}>
            <Briefcase size={16} className="inline mr-1.5" /> Projects
          </TabButton>
          <TabButton onClick={() => setActiveTab('messages')} isActive={activeTab === 'messages'}>
            <MessageCircle size={16} className="inline mr-1.5" /> Messages
          </TabButton>
          <TabButton onClick={() => setActiveTab('users')} isActive={activeTab === 'users'}>
            <UserCog size={16} className="inline mr-1.5" /> Users
          </TabButton>
          <TabButton onClick={() => setActiveTab('cv')} isActive={activeTab === 'cv'}>
            <FileEdit size={16} className="inline mr-1.5" /> CV & Profile
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
