// frontend/src/pages/HomePage.jsx (updated)
import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import HeroSection from '../components/Home/HeroSection';
import ProjectsGrid from '../components/Home/ProjectsGrid';
import InteractiveCV from '../components/Home/InteractiveCV';
import RegisterCallout from '../components/Home/RegisterCallout'; // Import new component
import { MessageSquareText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ThemeContext } from '../contexts/ThemeContext';
import BackgroundParticles from '../components/UI/BackgroundParticles';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};
const pageTransition = { type: "tween", ease: "anticipate", duration: 0.5 };

const HomePage = () => {
  const { currentUser } = useAuth();
  const { theme } = useContext(ThemeContext);
  
  return (
    <>
      <BackgroundParticles />
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="overflow-x-hidden" // Important for some animations
      >
        <HeroSection />
        <ProjectsGrid /> {/* id="projects" is inside this component */}
        
        {/* Register Callout - will only show for non-logged in users */}
        <RegisterCallout />
        
        <InteractiveCV /> {/* id="cv" is inside this component */}

        {/* Call to Action for messaging - Example - only show for logged in non-admin users */}
        {currentUser && !currentUser.is_admin && (
          <motion.section 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`py-12 md:py-20 my-10 rounded-lg shadow-lg ${
              theme === 'dark' ? 'bg-gray-800/70' : 'bg-white/70 shadow-xl'
            }`}
          >
            <div className='container mx-auto px-4 text-center'>
              <h3 className={`text-3xl font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Have a question or proposal?
              </h3>
              <p className={`mb-8 max-w-xl mx-auto ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                I'm always open to discussing new projects, creative ideas, or opportunities to be part of something exciting.
              </p>
              <Link 
                to="/dashboard" // Assuming user dashboard is for messages
                className="btn btn-accent inline-flex items-center text-lg px-8 py-3"
              >
                <MessageSquareText size={22} className="mr-2" />
                Send me a Message
              </Link>
            </div>
          </motion.section>
        )}
      </motion.div>
    </>
  );
};

export default HomePage;