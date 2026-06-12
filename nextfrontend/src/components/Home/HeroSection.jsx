import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ProfilePicPlaceholderImport from '../../assets/placeholder-profile.jpeg';
import { getCVDataApi } from '../../api/cv';
import Spinner from '../UI/Spinner';
import { AlertTriangle, ArrowRight, ChevronDown } from 'lucide-react';
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

/* Word-by-word rise reveal; the last word carries the accent color. */
const WordRise = ({ text, el: Wrapper = 'h1', className, accentLast = false, delay = 0 }) => {
  const words = String(text || '').split(' ').filter(Boolean);
  return (
    <Wrapper className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
          <motion.span
            className={`inline-block ${accentLast && i === words.length - 1 ? 'text-accent' : ''}`}
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: delay + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </Wrapper>
  );
};

/* Registration-mark corner brackets, the visual signature of the redesign. */
const CornerTicks = ({ className = '' }) => (
  <div className={`pointer-events-none absolute -inset-2 ${className}`} aria-hidden="true">
    <span className="absolute top-0 left-0 h-5 w-5 border-t-2 border-l-2 border-[var(--app-accent-fill)]" />
    <span className="absolute top-0 right-0 h-5 w-5 border-t-2 border-r-2 border-[var(--app-accent-fill)]" />
    <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-[var(--app-accent-fill)]" />
    <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-[var(--app-accent-fill)]" />
  </div>
);

const HeroSection = () => {
  const [loading, setLoading] = useState(true);
  const [cvData, setCvData] = useState(null);
  const [error, setError] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const t = useTranslations('hero');
  const tp = useTranslations('projects');
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
        <p className="mt-4 font-data text-sm text-ink-3">{t('loadingProfile')}</p>
      </section>
    );
  }

  const ctaButtons = (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.1, duration: 0.6, ease: "easeOut" }}
      className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
    >
      <button onClick={scrollToProjects} className="btn-cta text-base px-8 py-3.5">
        {t('scrollToProjects')}
        <ArrowRight size={17} />
      </button>
      <button onClick={scrollToCV} className="btn-ghost text-base px-8 py-3.5">
        {t('scrollToCV')}
      </button>
    </motion.div>
  );

  // If error or no data, show placeholder with error
  if (error || !cvData || !cvData.personalInfo) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center px-4 overflow-hidden"
      >
        <div className="relative z-10 max-w-3xl">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative w-36 h-36 md:w-44 md:h-44 mx-auto mb-10">
              <CornerTicks />
              {(imageLoading || !ProfilePicPlaceholder) && (
                <div className="absolute inset-0 rounded-2xl bg-raised animate-pulse"></div>
              )}
              <img
                src={ProfilePicPlaceholder}
                className="w-full h-full rounded-2xl object-cover border border-line-strong"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                alt="Profile"
              />
            </div>
          </motion.div>

          {error ? (
            <div className="mb-8 p-5 panel border-red-500/40 bg-red-500/10">
              <div className="flex justify-center items-center mb-2">
                <AlertTriangle size={22} className="text-red-400 mr-2" />
                <h3 className="text-xl font-semibold text-red-400">{t('errorTitle')}</h3>
              </div>
              <p className="text-red-300">{error}</p>
            </div>
          ) : (
            <>
              <WordRise
                text={t('welcomeFallback')}
                el="h1"
                accentLast
                className="font-display text-[clamp(2.4rem,6.5vw,4.5rem)] font-black leading-[1.02] tracking-tight text-ink mb-5"
              />
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="text-lg md:text-xl text-ink-2 mb-10"
              >
                {t('completeFallback')}
              </motion.p>
            </>
          )}

          <div className="flex justify-center">{ctaButtons}</div>
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
      className="relative min-h-[calc(100vh-4rem)] flex items-center py-16 lg:py-8"
    >
      <div className="w-full grid lg:grid-cols-[7fr_5fr] gap-14 lg:gap-16 items-center">
        {/* ---- Type stack ---- */}
        <div className="text-center lg:text-left order-2 lg:order-1">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="eyebrow mb-6"
          >
            <span className="status-dot" />
            {tp('subtitle')}
          </motion.span>

          <WordRise
            text={profileName}
            el="h1"
            accentLast
            delay={0.15}
            className="font-display text-[clamp(2.6rem,6.5vw,5rem)] font-black leading-[1.02] tracking-tight text-ink mb-6"
          />

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.6, ease: "easeOut" }}
            className="text-lg md:text-xl text-ink-2 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-10"
          >
            {profileTitle}
          </motion.p>

          {ctaButtons}
        </div>

        {/* ---- Portrait ---- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="order-1 lg:order-2 flex justify-center lg:justify-end"
        >
          <div className="relative w-56 sm:w-64 lg:w-80 aspect-[4/5]">
            {/* Offset frame behind the portrait */}
            <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-2xl border border-line-strong" aria-hidden="true" />
            <CornerTicks />
            {(imageLoading || !displayImage) && (
              <div className="absolute inset-0 rounded-2xl bg-raised animate-pulse"></div>
            )}
            <img
              src={displayImage}
              className={`relative w-full h-full rounded-2xl object-cover border border-line-strong shadow-2xl transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
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
      </div>

      {/* Scroll cue */}
      <motion.button
        onClick={scrollToProjects}
        aria-label={t('scrollToProjects')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center text-ink-3 hover:text-accent transition-colors"
      >
        <motion.span
          animate={{ y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="flex flex-col items-center"
        >
          <span className="w-px h-8 bg-[var(--app-line-strong)]" />
          <ChevronDown size={16} />
        </motion.span>
      </motion.button>
    </motion.section>
  );
};

export default HeroSection;
