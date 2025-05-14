import React from 'react';
import { motion } from 'framer-motion';
import AnimatedTextCharacter from '../UI/AnimatedTextCharacter'; // Adjust path if needed
import ProfilePic from '../../assets/placeholder-profile.jpeg'; // Create this image

const HeroSection = () => {
  const scrollToProjects = () => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };
  const scrollToCV = () => {
    document.getElementById('cv')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center px-4 relative overflow-hidden"
    >
      {/* Background elements - be creative! */}
      <div className="absolute inset-0 z-0">
        {/* Example: Animated gradient or particle effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-neutral-dark via-gray-900 to-neutral-dark"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 20,
            ease: "linear",
            repeat: Infinity,
          }}
          style={{ backgroundSize: '400% 400%' }}
        />
      </div>

      <div className="relative z-10 max-w-4xl">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 100 }}
        >
          <img 
            src={ProfilePic} 
            alt="Your Name" 
            className="w-36 h-36 md:w-48 md:h-48 rounded-full mx-auto mb-6 border-4 border-primary shadow-2xl object-cover" 
          />
        </motion.div>
        
        <AnimatedTextCharacter 
          text="Hello, I'm Markus" 
          el="h1" 
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent"
          stagger={0.05}
        />
        <AnimatedTextCharacter 
          text="A Creative Full Stack Developer & Tech Enthusiast" 
          el="p" 
          className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8"
          stagger={0.02}
          delay={0.8}
        />

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.7, ease: "easeOut" }}
          className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row justify-center"
        >
          <button onClick={scrollToProjects} className="btn btn-primary text-lg px-8 py-3">
            View My Work
          </button>
          <button onClick={scrollToCV} className="btn btn-outline text-lg px-8 py-3 border-secondary text-secondary hover:bg-secondary hover:text-white">
            My Journey
          </button>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default HeroSection;