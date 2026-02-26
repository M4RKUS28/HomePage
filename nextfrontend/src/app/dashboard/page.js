'use client';
import React, { useContext, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { ThemeContext } from '../../contexts/ThemeContext';
import ProtectedRoute from '../../components/Auth/ProtectedRoute';
import { createMessageApi } from '../../api/messages';
import { updateUserApi, uploadAvatarApi, deleteSelfApi, getAvatarUrl } from '../../api/users';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
const DashCard = ({ children, className = '' }) => {
  const { theme } = useContext(ThemeContext);
  return (
    <motion.div
      variants={itemVariants}
      className={`rounded-2xl shadow-lg overflow-hidden ${
        theme === 'dark'
          ? 'bg-gray-800/80 border border-gray-700/60'
          : 'bg-white border border-gray-200'
      } ${className}`}
    >
      {children}
    </motion.div>
  );
};

// ── Inline feedback ───────────────────────────────────────────────────────────
const InlineFeedback = ({ error, success, theme }) => (
  <AnimatePresence>
    {(error || success) && (
      <motion.p
        key={error || success}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`text-xs px-3 py-2 rounded-lg mt-2 ${
          error
            ? theme === 'dark' ? 'text-red-300 bg-red-900/30' : 'text-red-700 bg-red-50'
            : theme === 'dark' ? 'text-green-300 bg-green-900/30' : 'text-green-700 bg-green-50'
        }`}
      >
        {error || success}
      </motion.p>
    )}
  </AnimatePresence>
);

// ── Interactive Avatar (hero) ─────────────────────────────────────────────────
const HeroAvatar = ({ currentUser, theme, onSuccess }) => {
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
      setError(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => { setFile(null); setPreview(null); setError(''); };

  const avatarSrc = preview || (currentUser?.profile_image_url ? getAvatarUrl(currentUser.id) : null);
  const initials = currentUser?.username ? currentUser.username.slice(0, 2).toUpperCase() : '??';

  return (
    <div className="flex flex-col items-center sm:items-start gap-2">
      {/* Avatar circle */}
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
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg select-none">
            {initials}
          </div>
        )}
        {/* Hover overlay */}
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

      {/* Tooltip hint */}
      <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
        Click to change
      </p>

      {/* Preview confirm row */}
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
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-60 transition-colors"
            >
              <Check size={12} /> Save
            </button>
            <button
              onClick={cancel}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <X size={12} /> Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-red-400 max-w-[140px] text-center sm:text-left">{error}</p>}
    </div>
  );
};

// ── Inline-editable username row ────────────────────────────────────────────
const UsernameRow = ({ currentUser, theme, onSuccess }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentUser?.username ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hovered, setHovered] = useState(false);

  const save = async () => {
    const trimmed = value.trim();
    if (trimmed === currentUser?.username) { setEditing(false); return; }
    if (!trimmed) { setError('Username cannot be empty.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await updateUserApi(currentUser.id, { username: trimmed });
      setSuccess('Username updated!');
      setEditing(false);
      await onSuccess();
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(d || 'Update failed.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const cancel = () => { setValue(currentUser?.username ?? ''); setEditing(false); setError(''); };

  return (
    <div
      className={`py-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <User size={16} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium uppercase tracking-wide ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            Username
          </p>
          {editing ? (
            <input
              type="text"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
              className={`mt-0.5 w-full text-sm font-semibold rounded-md px-2 py-1 outline-none border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-emerald-500 text-gray-100'
                  : 'bg-gray-50 border-emerald-400 text-gray-800'
              }`}
            />
          ) : (
            <p className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
              {currentUser?.username ?? '—'}
            </p>
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
                  <button onClick={save} title="Save" className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                    <Check size={13} />
                  </button>
                  <button onClick={cancel} title="Cancel" className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}>
                    <X size={13} />
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} title="Edit username" className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700'}`}>
                  <Pencil size={13} />
                </button>
              )}
            </motion.div>
          )}
          {loading && <Loader2 size={16} className="animate-spin text-emerald-500 shrink-0" />}
        </AnimatePresence>
      </div>
      <InlineFeedback error={error} success={success} theme={theme} />
    </div>
  );
};

// ── Inline-editable email row ─────────────────────────────────────────────────
const EmailRow = ({ currentUser, theme, onSuccess }) => {
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
      setSuccess('Email updated!');
      setEditing(false);
      await onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const cancel = () => { setValue(currentUser?.email ?? ''); setEditing(false); setError(''); };

  return (
    <div
      className={`py-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <Mail size={16} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium uppercase tracking-wide ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            Email
          </p>
          {editing ? (
            <input
              type="email"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
              className={`mt-0.5 w-full text-sm font-semibold rounded-md px-2 py-1 outline-none border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-emerald-500 text-gray-100'
                  : 'bg-gray-50 border-emerald-400 text-gray-800'
              }`}
            />
          ) : (
            <p className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
              {currentUser?.email ?? '—'}
            </p>
          )}
        </div>

        {/* Action buttons */}
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
                  <button onClick={save} title="Save" className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                    <Check size={13} />
                  </button>
                  <button onClick={cancel} title="Cancel" className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}>
                    <X size={13} />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={copy} title={copied ? 'Copied!' : 'Copy email'} className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700'}`}>
                    {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                  <button onClick={() => setEditing(true)} title="Edit email" className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700'}`}>
                    <Pencil size={13} />
                  </button>
                </>
              )}
            </motion.div>
          )}
          {loading && <Loader2 size={16} className="animate-spin text-emerald-500 shrink-0" />}
        </AnimatePresence>
      </div>
      <InlineFeedback error={error} success={success} theme={theme} />
    </div>
  );
};

// ── Inline-editable password row ──────────────────────────────────────────────
const PasswordRow = ({ currentUser, theme }) => {
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
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await updateUserApi(currentUser.id, { password: newPw });
      setSuccess('Password changed!');
      setEditing(false); setNewPw(''); setConfirmPw('');
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(Array.isArray(d) ? d.map(e => e.msg).join(' ') : (d || 'Update failed.'));
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const cancel = () => { setEditing(false); setNewPw(''); setConfirmPw(''); setError(''); };

  return (
    <div
      className={`py-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <Lock size={16} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium uppercase tracking-wide ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            Password
          </p>
          <p className={`text-sm font-semibold tracking-widest ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
            ••••••••
          </p>
        </div>
        <AnimatePresence>
          {(hovered || editing) && !loading && !editing && (
            <motion.div initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <button onClick={() => setEditing(true)} title="Change password" className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700'}`}>
                <Pencil size={13} />
              </button>
            </motion.div>
          )}
          {loading && <Loader2 size={16} className="animate-spin text-emerald-500 shrink-0" />}
        </AnimatePresence>
      </div>

      {/* Expand password form */}
      <AnimatePresence>
        {editing && (
          <motion.div variants={expandVariants} initial="initial" animate="in" exit="out" className="overflow-hidden">
            <div className="pt-3 space-y-2">
              {/* New password */}
              <div className={`flex items-center gap-2 rounded-md border px-2 py-1 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <input
                  type={showNew ? 'text' : 'password'}
                  autoFocus
                  placeholder="New password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className={`flex-1 text-sm bg-transparent outline-none ${theme === 'dark' ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className={`${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {/* Confirm password */}
              <div className={`flex items-center gap-2 rounded-md border px-2 py-1 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
                  className={`flex-1 text-sm bg-transparent outline-none ${theme === 'dark' ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className={`${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={!newPw || !confirmPw} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 transition-colors">
                  <Check size={12} /> Save
                </button>
                <button onClick={cancel} className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                  <X size={12} /> Cancel
                </button>
              </div>
              <InlineFeedback error={error} success={success} theme={theme} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!editing && <InlineFeedback error="" success={success} theme={theme} />}
    </div>
  );
};

// ── Static row ────────────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, theme, last = false }) => (
  <div className={`flex items-center gap-3 py-3 ${!last ? `border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}` : ''}`}>
    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
      <Icon size={16} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-xs font-medium uppercase tracking-wide ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
      <p className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{value}</p>
    </div>
  </div>
);

// ── Account type row (with inline delete for non-admins) ─────────────────────
const AccountTypeRow = ({ currentUser, theme, onDelete, last = false }) => {
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
      setError(err.response?.data?.detail || 'Delete failed.');
      setLoading(false);
    }
  };

  const toggle = () => { setOpen(o => !o); setConfirmed(false); setError(''); };

  return (
    <div
      className={`py-3 ${(!last || open) ? `border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}` : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <Shield size={16} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium uppercase tracking-wide ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Account type</p>
          <p className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
            {isAdmin ? 'Administrator' : 'User'}
          </p>
        </div>
        {!isAdmin && (
          <AnimatePresence>
            {hovered && (
              <motion.div initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}>
                <button
                  onClick={toggle}
                  title={open ? 'Close' : 'Delete account'}
                  className={`p-1.5 rounded-lg transition-colors ${
                    open
                      ? theme === 'dark' ? 'bg-red-900/60 text-red-300' : 'bg-red-100 text-red-600'
                      : theme === 'dark' ? 'bg-red-900/30 hover:bg-red-900/60 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-500'
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
              <div className={`mt-3 rounded-xl border p-3 space-y-3 ${theme === 'dark' ? 'border-red-900/50 bg-red-950/20' : 'border-red-100 bg-red-50/50'}`}>
                <div className={`flex gap-2 p-3 rounded-lg ${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'}`}>
                  <AlertTriangle size={15} className={`mt-0.5 shrink-0 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} />
                  <p className={`text-xs ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                    <strong>Permanent</strong> — all your data will be deleted and this cannot be undone.
                  </p>
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="accent-red-500 w-4 h-4" />
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>I understand this is irreversible</span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={!confirmed || loading}
                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : <><Trash2 size={14} /> Delete my account</>}
                  </button>
                  <button
                    onClick={toggle}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
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
const DashMessageForm = ({ theme }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) { setError('Message cannot be empty.'); return; }
    setIsLoading(true); setError(''); setSuccess('');
    try {
      await createMessageApi(content);
      setSuccess('Message sent successfully!');
      setContent('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send message.');
    } finally {
      setIsLoading(false);
      setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-emerald-900/40' : 'bg-emerald-50'}`}>
          <MessageSquare size={20} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Send a Message</h3>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Got something on your mind? Drop the site owner a message.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className={`text-sm p-3 rounded-lg ${theme === 'dark' ? 'text-red-300 bg-red-900/30' : 'text-red-700 bg-red-50'}`}>{error}</p>}
        {success && <p className={`text-sm p-3 rounded-lg ${theme === 'dark' ? 'text-green-300 bg-green-900/30' : 'text-green-700 bg-green-50'}`}>{success}</p>}
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Your Message</label>
          <textarea rows="4" className="input-field w-full resize-none" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type your message here..." required />
        </div>
        <button type="submit" disabled={isLoading} className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
          {isLoading ? <><Loader2 size={18} className="animate-spin" /> Sending…</> : <><Send size={18} /> Send</>}
        </button>
      </form>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function UserDashboardPage() {
  const { currentUser, refreshUser, logout } = useAuth();
  const { theme } = useContext(ThemeContext);
  const router = useRouter();

  const joinedDate = currentUser?.created_at
    ? new Date(currentUser.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : null;

  const handleDeleteSuccess = async () => { logout(); router.push('/'); };

  return (
    <ProtectedRoute>
      <motion.div variants={containerVariants} initial="initial" animate="in" className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Hero / Welcome banner ─────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-10">
          <div className={`relative rounded-3xl overflow-hidden px-8 py-10 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-800/90 via-gray-800 to-gray-900 border border-gray-700'
              : 'bg-gradient-to-br from-emerald-50 via-white to-blue-50 border border-gray-200'
          } shadow-xl`}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-br from-emerald-500/10 to-blue-600/10 -translate-y-16 translate-x-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gradient-to-tr from-blue-500/10 to-emerald-400/10 translate-y-12 -translate-x-12 pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <HeroAvatar currentUser={currentUser} theme={theme} onSuccess={refreshUser} />
              <div className="text-center sm:text-left">
                <p className={`text-sm font-medium uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  Welcome back
                </p>
                <h1 className={`text-3xl md:text-4xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {currentUser?.username}
                  {currentUser?.is_admin && (
                    <span className="ml-3 inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 text-white align-middle">
                      <Shield size={12} /> Admin
                    </span>
                  )}
                </h1>
                <p className={`mt-2 text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Great to see you! Here is your personal space.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── 2-column grid ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Account Info + inline settings */}
          <DashCard>
            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Account</h2>
            </div>
            <div className="px-6 py-2">
              <UsernameRow currentUser={currentUser} theme={theme} onSuccess={refreshUser} />
              <EmailRow currentUser={currentUser} theme={theme} onSuccess={refreshUser} />
              <PasswordRow currentUser={currentUser} theme={theme} />
              <AccountTypeRow currentUser={currentUser} theme={theme} onDelete={handleDeleteSuccess} last={!joinedDate} />
              {joinedDate && <InfoRow icon={User} label="Member since" value={joinedDate} theme={theme} last />}
            </div>
          </DashCard>

          {/* Quick Links */}
          <DashCard>
            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Quick Links</h2>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <Link
                href="/"
                className={`flex items-center gap-3 p-4 rounded-xl transition-all group border ${
                  theme === 'dark'
                    ? 'border-gray-700 hover:border-emerald-500/50 hover:bg-emerald-900/20'
                    : 'border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/60'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-700 group-hover:bg-emerald-900/50' : 'bg-gray-100 group-hover:bg-emerald-100'}`}>
                  <Home size={18} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Visit Portfolio</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Browse the projects and CV on the homepage.</p>
                </div>
                <ExternalLink size={14} className={theme === 'dark' ? 'text-gray-600' : 'text-gray-400'} />
              </Link>
            </div>
          </DashCard>

          {/* Message Form – spans full width */}
          <DashCard className="md:col-span-2">
            <DashMessageForm theme={theme} />
          </DashCard>

        </div>
      </motion.div>
    </ProtectedRoute>
  );
}

