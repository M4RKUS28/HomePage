import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Zap, AlertTriangle, Loader2, Edit, Trash2, CheckCircle, RefreshCcw } from 'lucide-react';
import DefaultProjectImage from '../../assets/placeholder-project.png'; // Create this

const StatusIndicator = ({ status }) => {
  let color, Icon, text;
  switch (status?.toLowerCase()) {
    case 'up':
      color = 'bg-green-500 border-green-400'; Icon = Zap; text = 'Online'; break;
    case 'down':
      color = 'bg-red-500 border-red-400'; Icon = AlertTriangle; text = 'Offline'; break;
    case 'checking':
      color = 'bg-yellow-500 border-yellow-400'; Icon = () => <Loader2 size={14} className="animate-spin" />; text = 'Checking'; break;
    default:
      color = 'bg-gray-500 border-gray-400'; Icon = CheckCircle; text = 'Unknown'; // Or 'Unknown' with AlertTriangle
  }
  return (
    <div className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-white rounded-full border ${color}`}>
      <Icon size={14} />
      <span>{text}</span>
    </div>
  );
};

const ProjectCard = ({ project, isAdmin, onEdit, onDelete, onCheckStatus }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={cardVariants}
      className="card flex flex-col justify-between transform hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
    >
      <div>
        <img 
          src={project.image_url || DefaultProjectImage} 
          alt={project.title} 
          className="w-full h-52 object-cover" 
          onError={(e) => e.target.src = DefaultProjectImage} // Fallback image
        />
        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400 leading-tight">
              {project.title}
            </h3>
            <StatusIndicator status={project.status} />
          </div>
          <p className="text-gray-400 text-sm mb-4 min-h-[3.5rem] line-clamp-3">
            {project.description || "No description provided."}
          </p>
        </div>
      </div>
      
      <div className="p-5 border-t border-gray-700">
        <div className="flex justify-between items-center">
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm text-sm !py-1.5 !px-3 inline-flex items-center"
          >
            Visit Site <ExternalLink size={14} className="ml-1.5" />
          </a>
          {isAdmin && (
            <div className="flex space-x-2">
              <button onClick={() => onCheckStatus(project.id)} title="Re-check Status" className="p-1.5 text-blue-400 hover:text-blue-300 transition-colors"><RefreshCcw size={18}/></button>
              <button onClick={() => onEdit(project)} title="Edit Project" className="p-1.5 text-yellow-400 hover:text-yellow-300 transition-colors"><Edit size={18}/></button>
              <button onClick={() => onDelete(project.id)} title="Delete Project" className="p-1.5 text-red-500 hover:text-red-400 transition-colors"><Trash2 size={18}/></button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;