import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  Zap,
  AlertTriangle,
  Loader2,
  Edit,
  Trash2,
  CheckCircle,
  RefreshCcw,
  ArrowUp,
  ArrowDown,
  Globe,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import DefaultProjectImage from '../../assets/placeholder-project.png';
import { useTheme } from '../../hooks/useTheme';

/* ------------------------------------------------------------------ */
/*  Status badge – floating on the card image                         */
/* ------------------------------------------------------------------ */
const StatusIndicator = ({ status }) => {
  const { theme } = useTheme();
  const t = useTranslations('projects');

  const cfg = {
    up:       { icon: Zap,            label: t('status.up'),       dot: 'bg-emerald-400', ring: 'ring-emerald-400/30', bg: theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    down:     { icon: AlertTriangle,  label: t('status.down'),     dot: 'bg-red-400',     ring: 'ring-red-400/30',     bg: theme === 'dark' ? 'bg-red-500/20 text-red-300'       : 'bg-red-50 text-red-700 border border-red-200' },
    checking: { icon: () => <Loader2 size={12} className="animate-spin" />, label: t('status.checking'), dot: 'bg-amber-400', ring: 'ring-amber-400/30', bg: theme === 'dark' ? 'bg-amber-500/20 text-amber-300'   : 'bg-amber-50 text-amber-700 border border-amber-200' },
    unknown:  { icon: CheckCircle,    label: t('status.unknown'),  dot: 'bg-gray-400',    ring: 'ring-gray-400/30',    bg: theme === 'dark' ? 'bg-gray-500/20 text-gray-300'     : 'bg-gray-100 text-gray-600 border border-gray-200' },
  };

  const s = cfg[status?.toLowerCase()] ?? cfg.unknown;
  const Icon = s.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase backdrop-blur-md ${s.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ring-2 ${s.ring}`} />
      <Icon size={12} />
      {s.label}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Project Card                                                       */
/* ------------------------------------------------------------------ */
const ProjectCard = ({
  project,
  isAdmin,
  onEdit,
  onDelete,
  onCheckStatus,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  imageUrl,
  imageLoading,
}) => {
  const { theme } = useTheme();
  const t = useTranslations('projects');
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  /* --- animation variants --- */
  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  const iconBtn =
    'p-1.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95';

  /* --- image resolution --- */
  const rawImageUrl   = imageUrl !== undefined ? imageUrl : project.image;
  const resolvedImage = typeof rawImageUrl === 'string' ? rawImageUrl : null;
  const isImgLoading  = imageLoading !== undefined ? imageLoading : false;
  const hasImage      = resolvedImage && !imageError;

  const handleImageError = () => setImageError(true);

  /* --- heading logic --- */
  const trimmedName  = project?.name?.trim();
  const trimmedTitle = project?.title?.trim();
  const heading      = trimmedName || trimmedTitle || 'Untitled Project';
  const subHeading   =
    trimmedName && trimmedTitle && trimmedName !== trimmedTitle
      ? trimmedTitle
      : null;

  return (
    <motion.div
      variants={cardVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-500 ${
        theme === 'dark'
          ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 hover:border-emerald-500/30 shadow-lg shadow-black/20 hover:shadow-emerald-500/10'
          : 'bg-white/80 backdrop-blur-xl border border-gray-200 hover:border-emerald-500/40 shadow-md shadow-gray-200/60 hover:shadow-xl hover:shadow-emerald-500/10'
      }`}
    >
      {/* Subtle gradient border glow on hover */}
      <div className={`absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-emerald-500/20 via-transparent to-blue-500/20'
          : 'bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10'
      }`} />

      {/* ---- Image area ---- */}
      <div className="relative overflow-hidden aspect-[16/10]">
        {isImgLoading ? (
          <div className={`absolute inset-0 flex items-center justify-center ${
            theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
            <Loader2 size={24} className="animate-spin opacity-40" />
          </div>
        ) : (
          <motion.img
            src={hasImage ? resolvedImage : (DefaultProjectImage?.src || DefaultProjectImage)}
            alt={project.title}
            className="w-full h-full object-cover"
            onError={handleImageError}
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}

        {/* Gradient overlay */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${
          theme === 'dark'
            ? 'bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent'
            : 'bg-gradient-to-t from-black/50 via-black/10 to-transparent'
        }`} />

        {/* Status badge, top-right */}
        <div className="absolute top-3 right-3 z-10">
          <StatusIndicator status={project.status} />
        </div>
      </div>

      {/* ---- Content ---- */}
      <div className="relative flex flex-col flex-1 p-5">
        {/* Title */}
        <h3 className={`text-lg font-bold leading-snug mb-1 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {heading}
        </h3>

        {subHeading && (
          <p className={`text-sm font-medium mb-2 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {subHeading}
          </p>
        )}

        {/* Description */}
        <p className={`text-sm leading-relaxed flex-1 mb-4 line-clamp-3 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {project.description || 'No description provided.'}
        </p>

        {/* Footer: CTA + Admin */}
        <div className={`flex items-center justify-between pt-4 border-t ${
          theme === 'dark' ? 'border-gray-700/50' : 'border-gray-100'
        }`}>
          {/* Visit button */}
          <motion.a
            href={project.link ? String(project.link) : '#'}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.97 }}
            className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors ${
              theme === 'dark'
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-emerald-600 hover:text-emerald-700'
            }`}
          >
            <Globe size={15} />
            {t('visitProject')}
            <ExternalLink size={13} className="opacity-60" />
          </motion.a>

          {/* Admin controls */}
          {isAdmin && (
            <div className={`flex items-center gap-1 rounded-lg px-1 py-0.5 ${
              theme === 'dark' ? 'bg-gray-700/40' : 'bg-gray-100/80'
            }`}>
              <button
                onClick={() => onMoveUp(project.id)}
                title={t('moveUp')}
                disabled={isFirst}
                className={`${iconBtn} ${
                  isFirst
                    ? 'opacity-30 cursor-not-allowed'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                <ArrowUp size={15} />
              </button>
              <button
                onClick={() => onMoveDown(project.id)}
                title={t('moveDown')}
                disabled={isLast}
                className={`${iconBtn} ${
                  isLast
                    ? 'opacity-30 cursor-not-allowed'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                <ArrowDown size={15} />
              </button>

              <span className={`w-px h-4 mx-0.5 ${
                theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
              }`} />

              <button
                onClick={() => onCheckStatus(project.id)}
                title={t('checkStatus')}
                className={`${iconBtn} ${
                  theme === 'dark'
                    ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                    : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                <RefreshCcw size={15} />
              </button>
              <button
                onClick={() => onEdit(project)}
                title={t('editProject')}
                className={`${iconBtn} ${
                  theme === 'dark'
                    ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                    : 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                }`}
              >
                <Edit size={15} />
              </button>
              <button
                onClick={() => onDelete(project)}
                title={t('deleteProject')}
                className={`${iconBtn} ${
                  theme === 'dark'
                    ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                    : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                }`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
