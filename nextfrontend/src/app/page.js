'use client';
import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import HeroSection from '../components/Home/HeroSection';
import ProjectsGrid from '../components/Home/ProjectsGrid';
import InteractiveCV from '../components/Home/InteractiveCV';
import RegisterCallout from '../components/Home/RegisterCallout';
import { MessageSquareText } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { ThemeContext } from '../contexts/ThemeContext';
import BackgroundParticles from '../components/UI/BackgroundParticles';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};
const pageTransition = { type: "tween", ease: "anticipate", duration: 0.5 };

export default function HomePage() {
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
        className="min-h-screen"
      >
        <div className="relative">
          <HeroSection />
          <ProjectsGrid />
          <InteractiveCV />
          
          {/* Message Section - Show for everyone, but prioritize registered users */}
          <section className="relative py-16 bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="container mx-auto px-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="max-w-2xl mx-auto"
              >
                <MessageSquareText className="w-16 h-16 mx-auto mb-6 text-primary" />
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                  Let&apos;s Connect
                </h2>
                <p className="text-lg mb-8 text-gray-600 dark:text-gray-300">
                  Have a project in mind? Want to collaborate? I&apos;d love to hear from you.
                </p>
                
                <div className="space-y-4">
                  {currentUser ? (
                    <Link 
                      href="/dashboard"
                      className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                      <MessageSquareText className="w-5 h-5" />
                      Go to Dashboard
                    </Link>
                  ) : (
                    <div className="space-y-4">
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-medium transition-colors mr-4"
                      >
                        <MessageSquareText className="w-5 h-5" />
                        Send Message
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Register for a personalized experience and direct messaging
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </section>
          
          {/* Registration Callout - Only show for non-registered users */}
          {!currentUser && <RegisterCallout />}
        </div>
      </motion.div>
    </>
  );
}
