import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

const pageVariants = {
    initial: { opacity: 0, scale: 0.8 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 0.8 }
};
const pageTransition = { type: "spring", stiffness: 200, damping: 20, duration: 0.5 };

const NotFoundPage = () => {
  return (
    <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4 py-12"
    >
      <AlertTriangle className="w-24 h-24 text-yellow-400 mb-8 animate-bounce" />
      <h1 className="text-6xl font-extrabold text-white mb-4">404</h1>
      <h2 className="text-3xl font-semibold text-gray-300 mb-6">Oops! Page Not Found.</h2>
      <p className="text-lg text-gray-400 mb-8 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="btn btn-primary inline-flex items-center text-lg px-8 py-3"
      >
        <Home size={20} className="mr-2" />
        Go to Homepage
      </Link>
    </motion.div>
  );
};

export default NotFoundPage;