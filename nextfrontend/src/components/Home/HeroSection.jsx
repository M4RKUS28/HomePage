import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedTextCharacter from '../UI/AnimatedTextCharacter';
import ProfilePicPlaceholderImport from '../../assets/placeholder-profile.jpeg';
import { getCVDataApi } from '../../api/cv';
import Spinner from '../UI/Spinner';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLanguage } from '../../contexts/LanguageContext';

// Next.js static imports return an object {src, width, height} - extract the plain string.
const ProfilePicPlaceholder =
  typeof ProfilePicPlaceholderImport === 'string'
    ? ProfilePicPlaceholderImport
    : ProfilePicPlaceholderImport?.src ?? '';

/**
 * Extract a usable image URL from whatever the backend returns.
 * Pydantic v2 HttpUrl fields serialise as URL objects → String() = "[object Object]".
 * We only accept values that are plain strings starting with http(s) or /.
 */
function toValidUrl(val) {
  if (!val) return null;
  if (typeof val !== 'string') return null;
  if (!val.startsWith('http') && !val.startsWith('/')) return null;
  return val;
}

const HeroSection = () => {
  const [loading, setLoading] = useState(true);
  const [cvData, setCvData] = useState(null);
  const [error, setError] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const t = useTranslations('hero');
  const { locale } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setImageLoading(false);
      setImageFailed(false);
      try {
        const data = await getCVDataApi(locale);
        setCvData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching hero section data:", err);
        setError(t('errorLoadProfile'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locale]);

  // Derive a validated URL - null if missing or not a real URL string
  const profileImageUrl = toValidUrl(cvData?.personalInfo?.profileImage);

  useEffect(() => {
    if (!profileImageUrl) {
      setImageLoading(false);
      setImageFailed(false);
      return;
    }

    let cancelled = false;
    setImageFailed(false);
    setImageLoading(true);

    const img = new Image();
    img.onload = () => { if (!cancelled) setImageLoading(false); };
    img.onerror = () => {
      if (!cancelled) {
        console.warn("Hero profile image failed to load, using placeholder.");
        setImageFailed(true);
        setImageLoading(false);
      }
    };
    img.src = profileImageUrl;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [profileImageUrl]);

  const scrollToProjects = () => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const scrollToCV = () => {
    document.getElementById('cv')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Use the already-validated URL (computed above the preload effect)
  const shouldWaitForImage = !error && imageLoading && Boolean(profileImageUrl) && !imageFailed;

  // Keep loading UI active until data and profile image are ready
  if (loading || shouldWaitForImage) {
    return (
      <section className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center">
        <Spinner size="h-12 w-12" />
        <p className="mt-4 text-gray-400">{t('loadingProfile')}</p>
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
                className="w-full h-full rounded-full border-4 border-primary shadow-2xl object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                alt="Profile"
              />
            </div>
          </motion.div>
          
          {error ? (
            <div className="mb-8 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <div className="flex justify-center items-center mb-2">
                <AlertTriangle size={24} className="text-red-400 mr-2" />
                <h3 className="text-xl font-semibold text-red-400">{t('errorTitle')}</h3>
              </div>
              <p className="text-red-300">{error}</p>
            </div>
          ) : (
            <>
              <AnimatedTextCharacter 
                text={t('welcomeFallback')} 
                el="h1" 
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent"
                stagger={0.05}
              />
              <AnimatedTextCharacter 
                text={t('completeFallback')} 
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
              {t('scrollToProjects')}
            </button>
            <button onClick={scrollToCV} className="btn btn-outline text-lg px-8 py-3 border-secondary text-secondary hover:bg-secondary hover:text-white">
              {t('scrollToCV')}
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
  // profileImageUrl is already validated by toValidUrl() above the preload effect
  const displayImage = !imageFailed && profileImageUrl ? profileImageUrl : ProfilePicPlaceholder;

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
                // Null the handler immediately to prevent any further error loops
                e.currentTarget.onerror = null;
                e.currentTarget.src = ProfilePicPlaceholder;
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
            {t('scrollToProjects')}
          </button>
          <button onClick={scrollToCV} className="btn btn-outline text-lg px-8 py-3 border-secondary text-secondary hover:bg-secondary hover:text-white">
            {t('scrollToCV')}
          </button>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default HeroSection;