'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import HeroSection from '../../components/Home/HeroSection';
import ProjectsGrid from '../../components/Home/ProjectsGrid';
import InteractiveCV from '../../components/Home/InteractiveCV';
import RegisterCallout from '../../components/Home/RegisterCallout';
import { MessageSquareText, ArrowRight } from 'lucide-react';
import { Link } from '../../i18n/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useTranslations } from 'next-intl';
import BackgroundParticles from '../../components/UI/BackgroundParticles';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};
const pageTransition = { type: "tween", ease: "anticipate", duration: 0.5 };

export default function HomePage() {
  const { currentUser } = useAuth();
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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
          <section className="relative py-24">
            <div className="container mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="max-w-2xl mx-auto text-center"
              >
                <span className="eyebrow mb-4 justify-center">
                  <span className="status-dot" />
                  {t('connect.subtitle')}
                </span>
                <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight text-ink mb-5">
                  {t('connect.title')}
                </h2>
                <p className="text-lg text-ink-2 mb-9">
                  {t('connect.description')}
                </p>

                <div className="space-y-4">
                  {!mounted ? (
                    // Show neutral state during hydration to prevent mismatch
                    <div className="space-y-4">
                      <div className="btn-cta text-base px-8 py-3 opacity-50 mx-auto inline-flex">
                        <MessageSquareText size={18} />
                        <span>{t('connect.loading')}</span>
                      </div>
                      <p className="font-data text-xs text-ink-3">
                        {t('common.loadingAuth')}
                      </p>
                    </div>
                  ) : currentUser ? (
                    <Link href="/dashboard" className="btn-cta text-base px-8 py-3 inline-flex">
                      <MessageSquareText size={18} />
                      {t('connect.goToDashboard')}
                      <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <div className="space-y-4">
                      <Link href="/login" className="btn-cta text-base px-8 py-3 inline-flex">
                        <MessageSquareText size={18} />
                        {t('connect.sendMessage')}
                      </Link>
                      <p className="font-data text-xs text-ink-3">
                        {t('connect.registerHint')}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Registration Callout - Only show for non-registered users */}
          {mounted && !currentUser && <RegisterCallout />}
        </div>
      </motion.div>
    </>
  );
}
