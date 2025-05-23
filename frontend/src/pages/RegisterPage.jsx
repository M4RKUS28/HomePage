import React from 'react';
import RegisterForm from '../components/Auth/RegisterForm';
import { motion } from 'framer-motion';

const RegisterPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12" // Adjust min-h as needed
    >
      <RegisterForm />
    </motion.div>
  );
};

export default RegisterPage;