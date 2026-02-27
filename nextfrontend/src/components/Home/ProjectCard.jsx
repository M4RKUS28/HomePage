import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Zap, AlertTriangle, Loader2, Edit, Trash2, CheckCircle, RefreshCcw, ArrowUp, ArrowDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import DefaultProjectImage from '../../assets/placeholder-project.png';
import { useTheme } from '../../hooks/useTheme';

const StatusIndicator = ({ status }) => {
  let color, bgColor, Icon, text;
  const { theme } = useTheme();
  const t = useTranslations('projects');
  
  const darkModeColors = {
    up: 'bg-green-500/80 border-green-400',
    down: 'bg-red-500/80 border-red-400',
    checking: 'bg-yellow-500/80 border-yellow-400',
    unknown: 'bg-gray-500/80 border-gray-400'
  };
  
  const lightModeColors = {
    up: 'bg-green-500/90 border-green-600',
    down: 'bg-red-500/90 border-red-600',
    checking: 'bg-yellow-500/90 border-yellow-600',
    unknown: 'bg-gray-500/90 border-gray-600'
  };
  
  switch (status?.toLowerCase()) {
    case 'up':
      color = theme === 'dark' ? darkModeColors.up : lightModeColors.up;
      bgColor = 'from-green-600 to-emerald-500';
      Icon = Zap;
      text = t('status.up');
      break;
    case 'down':
      color = theme === 'dark' ? darkModeColors.down : lightModeColors.down;
      bgColor = 'from-red-600 to-rose-500';
      Icon = AlertTriangle;
      text = t('status.down');
      break;
    case 'checking':
      color = theme === 'dark' ? darkModeColors.checking : lightModeColors.checking;
      bgColor = 'from-yellow-500 to-amber-400';
      Icon = () => <Loader2 size={14} className="animate-spin" />;
      text = t('status.checking');
      break;
    default:
      color = theme === 'dark' ? darkModeColors.unknown : lightModeColors.unknown;
      bgColor = 'from-gray-500 to-slate-400';
      Icon = CheckCircle;
      text = t('status.unknown');
  }
  
  return (
    <div className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-white rounded-full border shadow-sm bg-gradient-to-r ${bgColor} ${color}`}>
      <Icon size={14} />
      <span>{text}</span>
    </div>
  );
};

const ProjectCard = ({ project, isAdmin, onEdit, onDelete, onCheckStatus, onMoveUp, onMoveDown, isFirst, isLast, imageUrl, imageLoading }) => {
  const { theme } = useTheme();
  const t = useTranslations('projects');
  const [imageError, setImageError] = useState(false);
  
  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
  };
  
  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.1 },
    tap: { scale: 0.9 }
  };

  // Use lazy-loaded imageUrl if provided; fall back to project.image for backwards compatibility
  const rawImageUrl = imageUrl !== undefined ? imageUrl : project.image;
  const resolvedImageUrl = typeof rawImageUrl === 'string' ? rawImageUrl : null;
  const isImageLoading = imageLoading !== undefined ? imageLoading : false;

  // Determine if we have a valid image to display
  const hasValidImage = resolvedImageUrl && !imageError;
  
  // Handle image loading errors
  const handleImageError = () => {
    console.log(`Image failed to load for project: ${project.title}`);
    setImageError(true);
  };

  const trimmedName = project?.name?.trim();
  const trimmedTitle = project?.title?.trim();
  const primaryHeading = trimmedName || trimmedTitle || 'Untitled Project';
  const secondaryHeading = trimmedName && trimmedTitle && trimmedName !== trimmedTitle ? trimmedTitle : null;

  return (
    <motion.div
      variants={cardVariants}
      className={`card flex flex-col justify-between transform transition-all duration-300 hover:shadow-2xl ${
        theme === 'dark'
          ? 'hover:-translate-y-1 hover:bg-gray-750 shadow-black/20'
          : 'hover:-translate-y-1 hover:shadow-xl shadow-gray-200/60'
      }`}
    >
      <div>
        <div className="relative overflow-hidden h-52">
          {isImageLoading ? (
            /* Skeleton loader while image is being fetched */
            <div className={`w-full h-full flex items-center justify-center ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
              <div className="flex flex-col items-center space-y-2 opacity-40">
                <Loader2 size={28} className="animate-spin" />
              </div>
            </div>
          ) : (
            <motion.img 
              src={hasValidImage ? resolvedImageUrl : DefaultProjectImage} 
              alt={project.title} 
              className="w-full h-full object-cover" 
              onError={handleImageError}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5 }}
            />
          )}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="p-5">
          <div className="flex justify-between items-start mb-3 gap-3">
            <div className="flex-1">
              <h3
                className={`text-xl font-semibold leading-tight ${
                  theme === 'dark'
                    ? 'text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]'
                    : 'text-gray-900'
                }`}
              >
                {primaryHeading}
              </h3>
              {secondaryHeading && (
                <p className={`text-sm font-medium mt-1 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {secondaryHeading}
                </p>
              )}
            </div>
            <StatusIndicator status={project.status} />
          </div>
          <div
            className={`text-sm mb-4 min-h-[3.5rem] max-h-32 overflow-y-auto pr-1 whitespace-pre-line scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {project.description || "No description provided."}
          </div>
        </div>
      </div>
      
      <div className={`p-5 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex justify-between items-center">
          <motion.a
            href={project.link ? String(project.link) : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm text-sm !py-1.5 !px-3 inline-flex items-center"
            variants={buttonVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
          >
            {t('visitProject')} <ExternalLink size={14} className="ml-1.5" />
          </motion.a>
          {isAdmin && (
            <div className="flex space-x-2">
              <motion.button 
                onClick={() => onMoveUp(project.id)} 
                title={t('moveUp')} 
                disabled={isFirst}
                className={`p-1.5 transition-colors ${
                  isFirst 
                    ? 'text-gray-500 cursor-not-allowed opacity-50'
                    : theme === 'dark' 
                      ? 'text-gray-400 hover:text-gray-300' 
                      : 'text-gray-500 hover:text-gray-700'
                }`}
                variants={buttonVariants}
                initial="rest"
                whileHover={!isFirst ? "hover" : "rest"}
                whileTap={!isFirst ? "tap" : "rest"}
              >
                <ArrowUp size={18}/>
              </motion.button>
              <motion.button 
                onClick={() => onMoveDown(project.id)} 
                title={t('moveDown')} 
                disabled={isLast}
                className={`p-1.5 transition-colors ${
                  isLast 
                    ? 'text-gray-500 cursor-not-allowed opacity-50'
                    : theme === 'dark' 
                      ? 'text-gray-400 hover:text-gray-300' 
                      : 'text-gray-500 hover:text-gray-700'
                }`}
                variants={buttonVariants}
                initial="rest"
                whileHover={!isLast ? "hover" : "rest"}
                whileTap={!isLast ? "tap" : "rest"}
              >
                <ArrowDown size={18}/>
              </motion.button>
              <motion.button 
                onClick={() => onCheckStatus(project.id)} 
                title={t('checkStatus')} 
                className={`p-1.5 transition-colors ${
                  theme === 'dark' 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-500 hover:text-blue-700'
                }`}
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <RefreshCcw size={18}/>
              </motion.button>
              <motion.button 
                onClick={() => onEdit(project)} 
                title={t('editProject')} 
                className={`p-1.5 transition-colors ${
                  theme === 'dark' 
                    ? 'text-yellow-400 hover:text-yellow-300' 
                    : 'text-yellow-500 hover:text-yellow-700'
                }`}
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <Edit size={18}/>
              </motion.button>
              <motion.button 
                onClick={() => onDelete(project.id)} 
                title={t('deleteProject')} 
                className={`p-1.5 transition-colors ${
                  theme === 'dark' 
                    ? 'text-red-500 hover:text-red-400' 
                    : 'text-red-500 hover:text-red-700'
                }`}
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <Trash2 size={18}/>
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;