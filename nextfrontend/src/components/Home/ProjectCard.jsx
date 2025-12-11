// frontend/src/components/Home/ProjectCard.jsx (improved image handling)
import React, { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Zap, AlertTriangle, Loader2, Edit, Trash2, CheckCircle, RefreshCcw, ArrowUp, ArrowDown } from 'lucide-react';
import DefaultProjectImage from '../../assets/placeholder-project.png';
import { ThemeContext } from '../../contexts/ThemeContext';

const StatusIndicator = ({ status }) => {
  let color, bgColor, Icon, text;
  const { theme } = useContext(ThemeContext);
  
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
      text = 'Online';
      break;
    case 'down':
      color = theme === 'dark' ? darkModeColors.down : lightModeColors.down;
      bgColor = 'from-red-600 to-rose-500';
      Icon = AlertTriangle;
      text = 'Offline';
      break;
    case 'checking':
      color = theme === 'dark' ? darkModeColors.checking : lightModeColors.checking;
      bgColor = 'from-yellow-500 to-amber-400';
      Icon = () => <Loader2 size={14} className="animate-spin" />;
      text = 'Checking';
      break;
    default:
      color = theme === 'dark' ? darkModeColors.unknown : lightModeColors.unknown;
      bgColor = 'from-gray-500 to-slate-400';
      Icon = CheckCircle;
      text = 'Unknown';
  }
  
  return (
    <div className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-white rounded-full border shadow-sm bg-gradient-to-r ${bgColor} ${color}`}>
      <Icon size={14} />
      <span>{text}</span>
    </div>
  );
};

const ProjectCard = ({ project, isAdmin, onEdit, onDelete, onCheckStatus, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const { theme } = useContext(ThemeContext);
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

  // Determine if we have a valid image to display
  const hasValidImage = project.image && !imageError;
  
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
          <motion.img 
            src={hasValidImage ? project.image : DefaultProjectImage} 
            alt={project.title} 
            className="w-full h-full object-cover" 
            onError={handleImageError}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5 }}
          />
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
              <h3 className={`text-xl font-semibold leading-tight text-transparent bg-clip-text bg-gradient-to-r ${
                theme === 'dark'
                  ? 'from-primary to-teal-400'
                  : 'from-teal-600 to-primary'
              }`}>
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
          <div className={`text-sm mb-4 min-h-[3.5rem] max-h-40 overflow-y-auto pr-1 whitespace-pre-line ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {project.description || "No description provided."}
          </div>
        </div>
      </div>
      
      <div className={`p-5 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex justify-between items-center">
          <motion.a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm text-sm !py-1.5 !px-3 inline-flex items-center"
            variants={buttonVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
          >
            Visit Site <ExternalLink size={14} className="ml-1.5" />
          </motion.a>
          {isAdmin && (
            <div className="flex space-x-2">
              <motion.button 
                onClick={() => onMoveUp(project.id)} 
                title="Move Up" 
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
                title="Move Down" 
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
                title="Re-check Status" 
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
                title="Edit Project" 
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
                title="Delete Project" 
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