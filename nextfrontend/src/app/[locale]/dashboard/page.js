'use client';
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../hooks/useAuth';
import ProtectedRoute from '../../../components/Auth/ProtectedRoute';
import { createMessageApi } from '../../../api/messages';
import { updateUserApi, uploadAvatarApi, deleteSelfApi, getAvatarUrl } from '../../../api/users';
import { Link } from '../../../i18n/navigation';
import { useRouter } from '../../../i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  Send, Home, User, Mail, Shield, MessageSquare, ExternalLink,
  Loader2, Lock, Camera, Trash2, AlertTriangle, Check, X,
  Copy, Pencil, Eye, EyeOff,
} from 'lucide-react';

// ── Animation variants ────────────────────────────────────────────────────────
const containerVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 24 },
  in: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};
const expandVariants = {
  initial: { height: 0, opacity: 0 },
  in: { height: 'auto', opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } },
  out: { height: 0, opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } },
};

// ── Section card wrapper ──────────────────────────────────────────────────────
const DashCard = ({ children, className = '' }) => (
  <motion.div
    variants={itemVariants}
    className={`rounded-2xl shadow-lg overflow-hidden bg-surface border border-line ${className}`}
  >
    {children}
  </motion.div>
);

// ── Inline feedback ───────────────────────────────────────────────────────────
const InlineFeedback = ({ error, success }) => (
  <AnimatePresence>
    {(error || success) && (
      <motion.p
        key={error || success}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`text-xs px-3 py-2 rounded-lg mt-2 ${
          error
            ? 'text-[var(--app-red)] bg-[color-mix(in_srgb,var(--app-red)_10%,transparent)]'
            : 'text-[var(--app-green)] bg-[color-mix(in_srgb,var(--app-green)_10%,transparent)]'
        }`}
      >
        {error || success}
      </motion.p>
    )}
  </AnimatePresence>
);

// ── Interactive Avatar (hero) ─────────────────────────────────────────────────
const HeroAvatar = ({ currentUser, onSuccess, t }) => {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      await uploadAvatarApi(file);
      setFile(null); setPreview(null);
      await onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || t('uploadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => { setFile(null); setPreview(null); setError(''); };

  const avatarSrc = preview || (currentUser?.profile_image_url ? getAvatarUrl(currentUser.id) : null);
  const initials = currentUser?.username ? currentUser.username.slice(0, 2).toUpperCase() : '??';

  return (
    <div className="flex flex-col items-center sm:items-start gap-2">
      <div
        className="relative cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => !loading && fileRef.current?.click()}
        title="Click to change profile picture"
      >
        {avatarSrc ? (
          <img src={avatarSrc} alt={currentUser?.username} className="w-20 h-20 rounded-full object-cover shadow-lg" />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-[var(--app-on-accent-fill)] text-2xl font-bold shadow-lg select-none"
            style={{ background: 'linear-gradient(135deg, var(--app-accent-fill), var(--app-cyan))' }}
          >
            {initials}
          </div>
        )}
        <AnimatePresence>
          {hovered && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full bg-black/55 flex flex-col items-center justify-center gap-0.5"
            >
              <Camera size={18} className="text-white" />
              <span className="text-white text-[9px] font-semibold leading-tight">Change</span>
            </motion.div>
          )}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center"
            >
              <Loader2 size={20} className="text-white animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <p className="text-[10px] text-ink-3">{t('clickToChange')}</p>

      <AnimatePresence>
        {file && (
          <motion.div
            variants={expandVariants}
            initial="initial" animate="in" exit="out"
            className="flex gap-2 overflow-hidden"
          >
            <button
              onClick={handleUpload}
              disabled={loading}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[var(--app-accent-fill)] text-[var(--app-on-accent-fill)] font-semibold disabled:opacity-60 transition-all hover:brightness-105"
            >
              <Check size={12} /> {t('save')}
            </button>
            <button
              onClick={cancel}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors bg-raised border border-line text-ink-2 hover:border-line-strong"
            >
              <X size={12} /> {t('cancel')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-[var(--app-red)] max-w-[140px] text-center sm:text-left">{error}</p>}
    </div>
  );
};

// ── Inline-editable username row ──────────────────────────────────────────────
const UsernameRow = ({ currentUser, onSuccess, t }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentUser?.username ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hovered, setHovered] = useState(false);

  const save = async () => {
    const trimmed = value.trim();
    if (trimmed === currentUser?.username) { setEditing(false); return; }
    if (!trimmed) { setError(t('usernameEmpty')); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await updateUserApi(currentUser.id, { username: trimmed });
      setSuccess(t('usernameUpdated'));
      setEditing(false);
      await onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || t('updateFailed'));
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const cancel = () => { setValue(currentUser?.username ?? ''); setEditing(false); setError(''); };

  return (
    <div
      className="py-3 border-b border-line"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg shrink-0 bg-raised">
          <User size={16} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{t('username')}</p>
          {editing ? (
            <input
              type="text"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
              className="mt-0.5 w-full text-sm font-semibold rounded-md px-2 py-1 outline-none border bg-raised border-[var(--app-accent-fill)] text-ink"
            />
          ) : (
            <p className="text-sm font-semibold truncate text-ink">{currentUser?.username ?? '—'}</p>
          )}
        </div>
        <AnimatePresence>
          {(hovered || editing) && !loading && (
            <motion.div
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              className="flex items-center gap-1 shrink-0"
            >
              {editing ? (
                <>
                  <button onClick={save} title={t('save')} className="p-1.5 rounded-lg bg-[var(--app-accent-fill)] text-[var(--app-on-accent-fill)] transition-all hover:brightness-105">
                    <Check size={13} />
                  </button>
                  <button onClick={cancel} title={t('cancel')} className="p-1.5 rounded-lg transition-colors bg-raised border border-line text-ink-3 hover:text-ink hover:border-line-strong">
                    <X size={13} />
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} title="Edit username" className="p-1.5 rounded-lg transition-colors bg-raised border border-line text-ink-3 hover:text-accent hover:border-[var(--app-accent)]">
                  <Pencil size={13} />
                </button>
              )}
            </motion.div>
          )}
          {loading && <Loader2 size={16} className="animate-spin text-accent shrink-0" />}
        </AnimatePresence>
      </div>
      <InlineFeedback error={error} success={success} />
    </div>
  );
};

// ── Inline-editable email row ──────────────────────────────────────────────────
const EmailRow = ({ currentUser, onSuccess, t }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentUser?.email ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(currentUser?.email ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const save = async () => {
    if (value === currentUser?.email) { setEditing(false); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await updateUserApi(currentUser.id, { email: value });
      setSuccess(t('emailUpdated'));
      setEditing(false);
      await onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || t('updateFailed'));
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const cancel = () => { setValue(currentUser?.email ?? ''); setEditing(false); setError(''); };

  return (
    <div
      className="py-3 border-b border-line"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg shrink-0 bg-raised">
          <Mail size={16} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{t('email')}</p>
          {editing ? (
            <input
              type="email"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
              className="mt-0.5 w-full text-sm font-semibold rounded-md px-2 py-1 outline-none border bg-raised border-[var(--app-accent-fill)] text-ink"
            />
          ) : (
            <p className="text-sm font-semibold truncate text-ink">{currentUser?.email ?? '—'}</p>
          )}
        </div>
        <AnimatePresence>
          {(hovered || editing) && !loading && (
            <motion.div
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              className="flex items-center gap-1 shrink-0"
            >
              {editing ? (
                <>
                  <button onClick={save} title={t('save')} className="p-1.5 rounded-lg bg-[var(--app-accent-fill)] text-[var(--app-on-accent-fill)] transition-all hover:brightness-105">
                    <Check size={13} />
                  </button>
                  <button onClick={cancel} title={t('cancel')} className="p-1.5 rounded-lg transition-colors bg-raised border border-line text-ink-3 hover:text-ink hover:border-line-strong">
                    <X size={13} />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={copy} title={copied ? t('copied') : t('copyEmail')} className="p-1.5 rounded-lg transition-colors bg-raised border border-line text-ink-3 hover:text-accent hover:border-[var(--app-accent)]">
                    {copied ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
                  </button>
                  <button onClick={() => setEditing(true)} title="Edit email" className="p-1.5 rounded-lg transition-colors bg-raised border border-line text-ink-3 hover:text-accent hover:border-[var(--app-accent)]">
                    <Pencil size={13} />
                  </button>
                </>
              )}
            </motion.div>
          )}
          {loading && <Loader2 size={16} className="animate-spin text-accent shrink-0" />}
        </AnimatePresence>
      </div>
      <InlineFeedback error={error} success={success} />
    </div>
  );
};

// ── Inline-editable password row ──────────────────────────────────────────────
const PasswordRow = ({ currentUser, t }) => {
  const [editing, setEditing] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hovered, setHovered] = useState(false);

  const save = async () => {
    if (newPw !== confirmPw) { setError(t('passwordMismatch')); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await updateUserApi(currentUser.id, { password: newPw });
      setSuccess(t('passwordChanged'));
      setEditing(false); setNewPw(''); setConfirmPw('');
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(Array.isArray(d) ? d.map(e => e.msg).join(' ') : (d || t('updateFailed')));
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const cancel = () => { setEditing(false); setNewPw(''); setConfirmPw(''); setError(''); };

  return (
    <div
      className="py-3 border-b border-line"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg shrink-0 bg-raised">
          <Lock size={16} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{t('password')}</p>
          <p className="text-sm font-semibold tracking-widest text-ink-3">••••••••</p>
        </div>
        <AnimatePresence>
          {(hovered || editing) && !loading && !editing && (
            <motion.div initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <button onClick={() => setEditing(true)} title="Change password" className="p-1.5 rounded-lg transition-colors bg-raised border border-line text-ink-3 hover:text-accent hover:border-[var(--app-accent)]">
                <Pencil size={13} />
              </button>
            </motion.div>
          )}
          {loading && <Loader2 size={16} className="animate-spin text-accent shrink-0" />}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div variants={expandVariants} initial="initial" animate="in" exit="out" className="overflow-hidden">
            <div className="pt-3 space-y-2">
              <div className="flex items-center gap-2 rounded-md border px-2 py-1 bg-raised border-line-strong">
                <input
                  type={showNew ? 'text' : 'password'}
                  autoFocus
                  placeholder={t('newPassword')}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="flex-1 text-sm bg-transparent outline-none text-ink placeholder:text-ink-3"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="text-ink-3 hover:text-ink transition-colors">
                  {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-md border px-2 py-1 bg-raised border-line-strong">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder={t('confirmPassword')}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
                  className="flex-1 text-sm bg-transparent outline-none text-ink placeholder:text-ink-3"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-ink-3 hover:text-ink transition-colors">
                  {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={!newPw || !confirmPw} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[var(--app-accent-fill)] text-[var(--app-on-accent-fill)] font-semibold disabled:opacity-50 transition-all hover:brightness-105">
                  <Check size={12} /> {t('save')}
                </button>
                <button onClick={cancel} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors bg-raised border border-line text-ink-2 hover:border-line-strong">
                  <X size={12} /> {t('cancel')}
                </button>
              </div>
              <InlineFeedback error={error} success={success} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!editing && <InlineFeedback error="" success={success} />}
    </div>
  );
};

// ── Static row ────────────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, last = false }) => (
  <div className={`flex items-center gap-3 py-3 ${!last ? 'border-b border-line' : ''}`}>
    <div className="p-2 rounded-lg bg-raised">
      <Icon size={16} className="text-accent" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</p>
      <p className="text-sm font-semibold truncate text-ink">{value}</p>
    </div>
  </div>
);

// ── Account type row (with inline delete for non-admins) ──────────────────────
const AccountTypeRow = ({ currentUser, onDelete, last = false, t }) => {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState(false);
  const isAdmin = currentUser?.is_admin;

  const handleDelete = async () => {
    setLoading(true); setError('');
    try {
      await deleteSelfApi();
      await onDelete();
    } catch (err) {
      setError(err.response?.data?.detail || t('deleteFailed'));
      setLoading(false);
    }
  };

  const toggle = () => { setOpen(o => !o); setConfirmed(false); setError(''); };

  return (
    <div
      className={`py-3 ${(!last || open) ? 'border-b border-line' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg shrink-0 bg-raised">
          <Shield size={16} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{t('accountType')}</p>
          <p className="text-sm font-semibold truncate text-ink">
            {isAdmin ? t('roleAdmin') : t('roleUser')}
          </p>
        </div>
        {!isAdmin && (
          <AnimatePresence>
            {hovered && (
              <motion.div initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}>
                <button
                  onClick={toggle}
                  title={open ? t('cancel') : t('deleteAccount')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    open
                      ? 'bg-[color-mix(in_srgb,var(--app-red)_20%,transparent)] text-[var(--app-red)]'
                      : 'bg-[color-mix(in_srgb,var(--app-red)_10%,transparent)] text-[var(--app-red)] hover:bg-[color-mix(in_srgb,var(--app-red)_20%,transparent)]'
                  }`}
                >
                  {open ? <X size={13} /> : <Trash2 size={13} />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {!isAdmin && (
        <AnimatePresence>
          {open && (
            <motion.div variants={expandVariants} initial="initial" animate="in" exit="out" className="overflow-hidden">
              <div className="mt-3 rounded-xl border p-3 space-y-3 border-[color-mix(in_srgb,var(--app-red)_25%,transparent)] bg-[color-mix(in_srgb,var(--app-red)_5%,transparent)]">
                <div className="flex gap-2 p-3 rounded-lg bg-[color-mix(in_srgb,var(--app-red)_8%,transparent)]">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[var(--app-red)]" />
                  <p className="text-xs text-[var(--app-red)]">
                    <strong>{t('deleteWarningPermanent')}</strong> — {t('deleteWarningText')}
                  </p>
                </div>
                {error && <p className="text-xs text-[var(--app-red)]">{error}</p>}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="accent-[var(--app-red)] w-4 h-4" />
                  <span className="text-xs text-ink-2">{t('deleteConfirmLabel')}</span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={!confirmed || loading}
                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-[var(--app-red)] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-110"
                  >
                    {loading ? <><Loader2 size={14} className="animate-spin" /> {t('deleteAccountDeleting')}</> : <><Trash2 size={14} /> {t('deleteMyAccount')}</>}
                  </button>
                  <button
                    onClick={toggle}
                    className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors bg-raised border border-line text-ink-2 hover:border-line-strong"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

// ── Message form ──────────────────────────────────────────────────────────────
const DashMessageForm = ({ t }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) { setError(t('messageEmpty')); return; }
    setIsLoading(true); setError(''); setSuccess('');
    try {
      await createMessageApi(content);
      setSuccess(t('messageSuccess'));
      setContent('');
    } catch (err) {
      setError(err.response?.data?.detail || t('messageFailed'));
    } finally {
      setIsLoading(false);
      setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-accent-soft">
          <MessageSquare size={20} className="text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-ink">{t('sendMessage')}</h3>
          <p className="text-xs text-ink-2">{t('messageSubtitle')}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className="text-sm p-3 rounded-lg text-[var(--app-red)] bg-[color-mix(in_srgb,var(--app-red)_10%,transparent)]">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm p-3 rounded-lg text-[var(--app-green)] bg-[color-mix(in_srgb,var(--app-green)_10%,transparent)]">
            {success}
          </p>
        )}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-ink-2">{t('messageLabel')}</label>
          <textarea rows="4" className="input-field w-full resize-none" value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('messagePlaceholder')} required />
        </div>
        <button type="submit" disabled={isLoading} className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
          {isLoading ? <><Loader2 size={18} className="animate-spin" /> {t('messageSending')}</> : <><Send size={18} /> {t('messageSend')}</>}
        </button>
      </form>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function UserDashboardPage() {
  const { currentUser, refreshUser, logout } = useAuth();
  const router = useRouter();
  const t = useTranslations('dashboard');

  const joinedDate = currentUser?.created_at
    ? new Date(currentUser.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : null;

  const handleDeleteSuccess = async () => { await logout(); router.push('/'); };

  return (
    <ProtectedRoute>
      <motion.div variants={containerVariants} initial="initial" animate="in" className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Hero / Welcome banner ──────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-10">
          <div className="relative rounded-3xl overflow-hidden px-8 py-10 bg-surface border border-line shadow-xl">
            {/* Ambient glows matching landing page */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-16 translate-x-16 pointer-events-none"
                 style={{ background: 'radial-gradient(circle, var(--app-glow-a), transparent 70%)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full translate-y-12 -translate-x-12 pointer-events-none"
                 style={{ background: 'radial-gradient(circle, var(--app-glow-b), transparent 70%)' }} />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <HeroAvatar currentUser={currentUser} onSuccess={refreshUser} t={t} />
              <div className="text-center sm:text-left">
                <p className="eyebrow mb-1">{t('welcome')}</p>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-ink">
                  {currentUser?.username}
                  {currentUser?.is_admin && (
                    <span
                      className="ml-3 inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-0.5 rounded-full text-[var(--app-on-accent-fill)] align-middle"
                      style={{ background: 'linear-gradient(90deg, var(--app-accent-fill), var(--app-cyan))' }}
                    >
                      <Shield size={12} /> Admin
                    </span>
                  )}
                </h1>
                <p className="mt-2 text-base text-ink-2">{t('personalSpace')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── 2-column grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Account Info + inline settings */}
          <DashCard>
            <div className="px-6 py-4 border-b border-line">
              <h2 className="text-base font-semibold text-ink">{t('account')}</h2>
            </div>
            <div className="px-6 py-2">
              <UsernameRow currentUser={currentUser} onSuccess={refreshUser} t={t} />
              <EmailRow currentUser={currentUser} onSuccess={refreshUser} t={t} />
              <PasswordRow currentUser={currentUser} t={t} />
              <AccountTypeRow currentUser={currentUser} onDelete={handleDeleteSuccess} last={!joinedDate} t={t} />
              {joinedDate && <InfoRow icon={User} label={t('memberSince')} value={joinedDate} last />}
            </div>
          </DashCard>

          {/* Quick Links */}
          <DashCard>
            <div className="px-6 py-4 border-b border-line">
              <h2 className="text-base font-semibold text-ink">{t('quickLinks')}</h2>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <Link
                href="/"
                className="flex items-center gap-3 p-4 rounded-xl transition-all group border border-line hover:border-[var(--app-accent)] hover:bg-accent-soft"
              >
                <div className="p-2 rounded-lg transition-colors bg-raised group-hover:bg-accent-soft">
                  <Home size={18} className="text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">{t('visitPortfolio')}</p>
                  <p className="text-xs text-ink-3">{t('visitPortfolioDesc')}</p>
                </div>
                <ExternalLink size={14} className="text-ink-3" />
              </Link>
            </div>
          </DashCard>

          {/* Message Form - spans full width */}
          <DashCard className="md:col-span-2">
            <DashMessageForm t={t} />
          </DashCard>

        </div>
      </motion.div>
    </ProtectedRoute>
  );
}
