import React from 'react';
import { motion } from 'framer-motion';
import MessageForm from '../components/User/MessageForm';
import { useAuth } from '../hooks/useAuth';

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
};
const pageTransition = { type: "tween", ease: "anticipate", duration: 0.5 };

const UserDashboardPage = () => {
  const { currentUser } = useAuth();

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
        <h1 className="text-4xl font-bold text-white">Welcome, <span className="text-primary">{currentUser?.username}!</span></h1>
        <p className="text-lg text-gray-400 mt-2">This is your personal dashboard.</p>
      </div>
      
      <MessageForm />

      {/* You could add other user-specific features here later, e.g., view past messages, profile settings */}
    </motion.div>
  );
};

export default UserDashboardPage;