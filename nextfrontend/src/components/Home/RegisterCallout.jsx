// frontend/src/components/Home/RegisterCallout.jsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from '../../i18n/navigation';
import { UserPlus, MessageSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslations } from 'next-intl';

const RegisterCallout = () => {
  const { currentUser } = useAuth();
  const t = useTranslations('registerCallout');

  // Don't show this component if user is already logged in
  if (currentUser) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="my-20"
    >
      <div className="container mx-auto max-w-4xl">
        <div className="panel relative overflow-hidden px-6 py-14 md:px-14 text-center">
          {/* Corner registration marks */}
          <span className="pointer-events-none absolute top-4 left-4 h-5 w-5 border-t-2 border-l-2 border-[var(--app-accent-fill)] opacity-60" aria-hidden="true" />
          <span className="pointer-events-none absolute bottom-4 right-4 h-5 w-5 border-b-2 border-r-2 border-[var(--app-accent-fill)] opacity-60" aria-hidden="true" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-xl border border-line bg-accent-soft text-accent"
          >
            <MessageSquare size={24} />
          </motion.div>

          <motion.h3
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="font-display text-3xl md:text-4xl font-black tracking-tight text-ink mb-4"
          >
            {t('title')}
          </motion.h3>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-lg text-ink-2 max-w-2xl mx-auto mb-9"
          >
            {t('description')}
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link href="/register" className="btn-cta text-base px-7 py-3">
              <UserPlus size={18} />
              {t('createAccount')}
            </Link>
            <Link href="/login" className="btn-ghost text-base px-7 py-3">
              <MessageSquare size={18} />
              {t('signIn')}
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default RegisterCallout;
