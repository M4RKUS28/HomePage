import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import ProjectsGrid from '../components/Home/ProjectsGrid'; // Re-using for project management
import MessageList from '../components/Admin/MessageList';
import { Briefcase, MessageCircle, Settings } from 'lucide-react'; // Example icons for tabs

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
                        ? 'bg-primary text-white shadow-lg' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
    >
        {children}
    </button>
);

const AdminDashboardPage = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('projects'); // 'projects', 'messages', 'settings'

  const renderContent = () => {
    switch (activeTab) {
      case 'projects':
        return <ProjectsGrid />; // Already has admin controls (add/edit/delete)
      case 'messages':
        return <MessageList />;
      case 'settings':
        return <div className="p-6 bg-gray-800 rounded-lg shadow-xl"><h3 className="text-xl font-semibold text-white">Site Settings</h3><p className="text-gray-400 mt-2">User management, site configuration, etc. (To be implemented)</p></div>;
      default:
        return null;
    }
  };

  return (
    <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="py-8"
    >
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-lg text-gray-400 mt-2">Manage your site, {currentUser?.username}.</p>
      </div>

      <div className="mb-8 flex justify-center space-x-2 sm:space-x-4 p-2 bg-gray-800/50 rounded-lg max-w-md mx-auto">
        <TabButton onClick={() => setActiveTab('projects')} isActive={activeTab === 'projects'}>
          <Briefcase size={16} className="inline mr-1.5" /> Projects
        </TabButton>
        <TabButton onClick={() => setActiveTab('messages')} isActive={activeTab === 'messages'}>
          <MessageCircle size={16} className="inline mr-1.5" /> Messages
        </TabButton>
        {/* <TabButton onClick={() => setActiveTab('settings')} isActive={activeTab === 'settings'}>
          <Settings size={16} className="inline mr-1.5" /> Settings
        </TabButton> */}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
            key={activeTab} // Important for AnimatePresence to detect change
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
        >
            {renderContent()}
        </motion.div>
      </AnimatePresence>
      
    </motion.div>
  );
};

export default AdminDashboardPage;