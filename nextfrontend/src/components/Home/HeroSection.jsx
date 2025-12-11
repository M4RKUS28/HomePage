// Updated HeroSection.jsx to properly handle backend data
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedTextCharacter from '../UI/AnimatedTextCharacter';
import ProfilePicPlaceholder from '../../assets/placeholder-profile.jpeg';
import { getCVDataApi } from '../../api/cv';
import Spinner from '../UI/Spinner';
import { AlertTriangle } from 'lucide-react';

const HeroSection = () => {
  const [loading, setLoading] = useState(true);
  const [cvData, setCvData] = useState(null);
  const [error, setError] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setImageLoading(true);
      setImageFailed(false);
      try {
        // Fetch CV data
        const data = await getCVDataApi();
        setCvData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching hero section data:", err);
        setError('Failed to load profile data.');
        setImageLoading(false);
        setImageFailed(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!cvData?.personalInfo) {
      setImageLoading(false);
      setImageFailed(false);
      return;
    }

    const imageUrl = cvData.personalInfo.profileImage;

    if (!imageUrl) {
      setImageLoading(false);
      setImageFailed(false);
      return;
    }

    let cancelled = false;

    setImageFailed(false);
    setImageLoading(true);

    const img = new Image();

    img.onload = () => {
      if (!cancelled) {
        setImageLoading(false);
      }
    };

    img.onerror = () => {
      if (!cancelled) {
        console.warn("Failed to preload hero profile image, falling back to placeholder.");
        setImageFailed(true);
        setImageLoading(false);
      }
    };

    img.src = imageUrl;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [cvData?.personalInfo?.profileImage]);

  const scrollToProjects = () => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const scrollToCV = () => {
    document.getElementById('cv')?.scrollIntoView({ behavior: 'smooth' });
  };

  const hasProfileImage = Boolean(cvData?.personalInfo?.profileImage);
  const shouldWaitForImage = !error && imageLoading && hasProfileImage && !imageFailed;

  // Keep loading UI active until data and profile image are ready
  if (loading || shouldWaitForImage) {
    return (
      <section className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center">
        <Spinner size="h-12 w-12" />
        <p className="mt-4 text-gray-400">Loading profile data...</p>
      </section>
    );
  }

  // If error or no data, show placeholder with error
  if (error || !cvData || !cvData.personalInfo) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center px-4 relative overflow-hidden"
      >
        <div className="relative z-10 max-w-4xl">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 100 }}
          >
            <div className="relative w-36 h-36 md:w-48 md:h-48 mx-auto mb-6">
              {(imageLoading || !ProfilePicPlaceholder) && (
                <div className="absolute inset-0 rounded-full bg-gray-700 animate-pulse"></div>
              )}
              <img 
                src={ProfilePicPlaceholder}
                className={`w-full h-full rounded-full border-4 border-primary shadow-2xl object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`} 
                onLoad={() => setImageLoading(false)}
                onError={(e) => {
                  e.target.src = ProfilePicPlaceholder;
                  setImageLoading(false);
                }}
                alt="Profile"
              />
            </div>
          </motion.div>
          
          {error ? (
            <div className="mb-8 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <div className="flex justify-center items-center mb-2">
                <AlertTriangle size={24} className="text-red-400 mr-2" />
                <h3 className="text-xl font-semibold text-red-400">Error Loading Profile</h3>
              </div>
              <p className="text-red-300">{error}</p>
            </div>
          ) : (
            <>
              <AnimatedTextCharacter 
                text="Welcome to My Portfolio" 
                el="h1" 
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent"
                stagger={0.05}
              />
              <AnimatedTextCharacter 
                text="Complete your profile in the admin dashboard" 
                el="p" 
                className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8"
                stagger={0.02}
                delay={0.8}
              />
            </>
          )}

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
  }

  // Extract profile data
  const { personalInfo } = cvData;
  const profileName = personalInfo?.name || 'Hello, I\'m Markus';
  const profileTitle = personalInfo?.title || 'A Creative Full Stack Developer & Tech Enthusiast';
  const profileImage = personalInfo?.profileImage;
  const displayImage = !imageFailed && profileImage ? profileImage : ProfilePicPlaceholder;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center px-4 relative overflow-hidden"
    >

      <div className="max-w-4xl">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 100 }}
        >
          <div className="relative w-36 h-36 md:w-48 md:h-48 mx-auto mb-6">
            {(imageLoading || !displayImage) && (
              <div className="absolute inset-0 rounded-full bg-gray-700 animate-pulse"></div>
            )}
            <img 
              src={displayImage}
              className={`w-full h-full rounded-full border-4 border-primary shadow-2xl object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`} 
              onLoad={() => setImageLoading(false)}
              onError={(e) => {
                e.target.src = ProfilePicPlaceholder;
                setImageFailed(true);
                setImageLoading(false);
              }}
              alt="Profile"
            />
          </div>
        </motion.div>
        <AnimatedTextCharacter 
          text={profileName} 
          el="h1" 
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent"
          stagger={0.05}
        />
        <AnimatedTextCharacter 
          text={profileTitle} 
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