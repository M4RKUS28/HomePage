import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2,
  Edit,
  Trash2,
  RefreshCcw,
  ArrowUp,
  ArrowDown,
  Globe,
  Github,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import DefaultProjectImage from '../../assets/placeholder-project.png';

/* ------------------------------------------------------------------ */
/*  Status chip – a live indicator LED floating on the card image      */
/* ------------------------------------------------------------------ */
const StatusIndicator = ({ status }) => {
  const t = useTranslations('projects');

  const cfg = {
    up:       { label: t('status.up'),       dot: 'status-dot' },
    down:     { label: t('status.down'),     dot: 'status-dot status-dot--red' },
    checking: { label: t('status.checking'), dot: 'status-dot status-dot--accent' },
    unknown:  { label: t('status.unknown'),  dot: 'status-dot status-dot--idle' },
  };

  const s = cfg[status?.toLowerCase()] ?? cfg.unknown;

  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-line bg-[color-mix(in_srgb,var(--app-surface)_82%,transparent)] px-2.5 py-1.5 font-data text-[10px] font-medium uppercase tracking-[0.14em] text-ink backdrop-blur-md">
      <span className={s.dot} />
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
  index = 0,
}) => {
  const t = useTranslations('projects');
  const [imageError, setImageError] = useState(false);

  /* --- animation variants ---
   * Each card drives its own entrance via `whileInView`, so cards added
   * after the initial reveal (e.g. just-created or GitHub-imported projects)
   * animate in on their own instead of staying stuck at the hidden state.
   * A capped, index-based delay preserves the staggered cascade on first load. */
  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: Math.min(i * 0.08, 0.4),
      },
    }),
  };

  const iconBtn =
    'p-1.5 rounded-md text-ink-3 transition-all duration-200 hover:scale-110 active:scale-95';

  /* --- image resolution --- */
  const rawImageUrl   = imageUrl !== undefined ? imageUrl : project.image;
  const resolvedImage = typeof rawImageUrl === 'string' ? rawImageUrl : null;
  const isImgLoading  = imageLoading !== undefined ? imageLoading : false;
  const hasImage      = resolvedImage && !imageError;

  const handleImageError = () => setImageError(true);

  /* Clear the error flag whenever the source URL changes, so swapping a
   * project's image (e.g. a new external URL) reflects immediately instead
   * of staying stuck on the placeholder until a manual reload. */
  useEffect(() => {
    setImageError(false);
  }, [resolvedImage]);

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
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-surface border border-line hover:border-line-strong transition-colors duration-300"
    >
      {/* Corner bracket reveal on hover (top-right registration mark) */}
      <span
        className="pointer-events-none absolute top-3 right-3 z-20 h-4 w-4 border-t-2 border-r-2 border-[var(--app-accent-fill)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* ---- Image area ---- */}
      <div className="relative overflow-hidden aspect-[16/10]">
        {isImgLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-raised">
            <Loader2 size={24} className="animate-spin opacity-40 text-ink-3" />
          </div>
        ) : (
          <img
            src={hasImage ? resolvedImage : (DefaultProjectImage?.src || DefaultProjectImage)}
            alt={project.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            onError={handleImageError}
          />
        )}

        {/* Gradient overlay for status chip legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        {/* Status badge, bottom-left of the image */}
        <div className="absolute bottom-3 left-3 z-10">
          <StatusIndicator status={project.status} />
        </div>
      </div>

      {/* ---- Content ---- */}
      <div className="relative flex flex-col flex-1 p-5">
        <h3 className="font-display text-lg font-bold leading-snug text-ink mb-1">
          {heading}
        </h3>

        {subHeading && (
          <p className="text-sm font-medium text-ink-3 mb-2">
            {subHeading}
          </p>
        )}

        <p className="text-sm leading-relaxed flex-1 mb-4 line-clamp-3 text-ink-2">
          {project.description || 'No description provided.'}
        </p>

        {/* Footer: CTA + Admin */}
        <div className="flex items-center justify-between pt-4 border-t border-line">
          {/* Visit button + optional GitHub source link */}
          <div className="flex items-center gap-3">
            <a
              href={project.link ? String(project.link) : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-data text-xs font-semibold uppercase tracking-[0.14em] text-accent transition-colors hover:brightness-110"
            >
              <Globe size={14} />
              {t('visitProject')}
            </a>

            {project.github_link && (
              <a
                href={String(project.github_link)}
                target="_blank"
                rel="noopener noreferrer"
                title={t('viewSource')}
                className="inline-flex items-center gap-2 font-data text-xs font-semibold uppercase tracking-[0.14em] text-ink-3 transition-colors hover:text-ink"
              >
                <Github size={14} />
                GitHub
              </a>
            )}
          </div>

          {/* Admin controls */}
          {isAdmin && (
            <div className="flex items-center gap-0.5 rounded-lg border border-line bg-raised px-1 py-0.5">
              <button
                onClick={() => onMoveUp(project.id)}
                title={t('moveUp')}
                disabled={isFirst}
                className={`${iconBtn} ${isFirst ? 'opacity-30 cursor-not-allowed' : 'hover:text-ink'}`}
              >
                <ArrowUp size={15} />
              </button>
              <button
                onClick={() => onMoveDown(project.id)}
                title={t('moveDown')}
                disabled={isLast}
                className={`${iconBtn} ${isLast ? 'opacity-30 cursor-not-allowed' : 'hover:text-ink'}`}
              >
                <ArrowDown size={15} />
              </button>

              <span className="w-px h-4 mx-0.5 bg-[var(--app-line-strong)]" />

              <button
                onClick={() => onCheckStatus(project.id)}
                title={t('checkStatus')}
                className={`${iconBtn} hover:text-sky-500`}
              >
                <RefreshCcw size={15} />
              </button>
              <button
                onClick={() => onEdit(project)}
                title={t('editProject')}
                className={`${iconBtn} hover:text-amber-500`}
              >
                <Edit size={15} />
              </button>
              <button
                onClick={() => onDelete(project)}
                title={t('deleteProject')}
                className={`${iconBtn} hover:text-red-500`}
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
