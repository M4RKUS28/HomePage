import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import ProjectCard from './ProjectCard';
import { getProjectsApi, getProjectApi, deleteProjectApi, checkProjectStatusApi, updateProjectApi } from '../../api/projects';
import { useAuth } from '../../hooks/useAuth';import { useLanguage } from '../../contexts/LanguageContext';import Spinner from '../UI/Spinner';
import ProjectForm from '../Admin/ProjectForm';
import Modal from '../UI/Modal';
import { PlusCircle, FolderOpen } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';


const ProjectsGrid = () => {
  const t = useTranslations('projects');
  const { theme } = useTheme();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectImages, setProjectImages] = useState({});
  const fetchedImageIds = useRef(new Set());

  /**
   * Fetch the full project detail (GET /projects/{id}) which includes
   * `image_url` — a presigned download URL already resolved by the
   * backend.  The list endpoint intentionally omits images for speed.
   */
  const fetchImageForProject = useCallback(async (project) => {
    const projectId = project.id;
    if (fetchedImageIds.current.has(projectId)) return;
    fetchedImageIds.current.add(projectId);

    setProjectImages(prev => ({ ...prev, [projectId]: { loading: true, url: null } }));
    try {
      const detail = await getProjectApi(projectId);
      setProjectImages(prev => ({
        ...prev,
        [projectId]: { loading: false, url: detail.image_url || null },
      }));
    } catch {
      setProjectImages(prev => ({ ...prev, [projectId]: { loading: false, url: null } }));
    }
  }, []);

  const fetchProjectsData = useCallback(async () => {
    try {
      const data = await getProjectsApi(locale);
      setProjects(data);
      setError(null);
      data.forEach(p => fetchImageForProject(p));
    } catch (err) {
      setError('Failed to load projects. The server might be down or an error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchImageForProject]);

  useEffect(() => {
    fetchProjectsData();
    const intervalId = setInterval(fetchProjectsData, 60000);
    return () => clearInterval(intervalId);
  }, [fetchProjectsData]);

  const handleDelete = async (projectId) => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      try {
        await deleteProjectApi(projectId);
        setProjects(prev => prev.filter(p => p.id !== projectId));
      } catch (err) {
        alert("Failed to delete project: " + (err.response?.data?.detail || err.message));
      }
    }
  };
  
  const handleCheckStatus = async (projectId) => {
    try {
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === projectId ? { ...p, status: 'checking' } : p)
      );
      const updatedProject = await checkProjectStatusApi(projectId);
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
      );
    } catch (err) {
      alert("Failed to trigger status check: " + (err.response?.data?.detail || err.message));
      fetchProjectsData();
    }
  };

  const handleEdit = async (project) => {
    try {
      const detail = await getProjectApi(project.id);
      setEditingProject(detail);
    } catch {
      setEditingProject(project);
    }
    setShowModal(true);
  }
  const handleAdd = () => { setEditingProject(null); setShowModal(true); }
  
  const moveProjectUp = async (projectId) => {
    const sortedProjects = [...projects].sort((a, b) => {
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      return (a.id || 0) - (b.id || 0);
    });
    
    const currentIndex = sortedProjects.findIndex(p => p.id === projectId);
    if (currentIndex <= 0) return;
    
    try {
      const currentProject = sortedProjects[currentIndex];
      const previousProject = sortedProjects[currentIndex - 1];
      
      const updatedCurrentProject = { 
        ...currentProject, 
        position: previousProject.position !== undefined ? previousProject.position : currentIndex - 1 
      };
      const updatedPreviousProject = { 
        ...previousProject, 
        position: currentProject.position !== undefined ? currentProject.position : currentIndex 
      };
      
      await Promise.all([
        updateProjectApi(updatedCurrentProject.id, updatedCurrentProject),
        updateProjectApi(updatedPreviousProject.id, updatedPreviousProject)
      ]);
      
      setProjects(prev => prev.map(p => {
        if (p.id === updatedCurrentProject.id) return updatedCurrentProject;
        if (p.id === updatedPreviousProject.id) return updatedPreviousProject;
        return p;
      }));
    } catch (err) {
      alert("Failed to move project: " + (err.response?.data?.detail || err.message));
    }
  };

  const moveProjectDown = async (projectId) => {
    const sortedProjects = [...projects].sort((a, b) => {
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      return (a.id || 0) - (b.id || 0);
    });
    
    const currentIndex = sortedProjects.findIndex(p => p.id === projectId);
    if (currentIndex < 0 || currentIndex >= sortedProjects.length - 1) return;
    
    try {
      const currentProject = sortedProjects[currentIndex];
      const nextProject = sortedProjects[currentIndex + 1];
      
      const updatedCurrentProject = { 
        ...currentProject, 
        position: nextProject.position !== undefined ? nextProject.position : currentIndex + 1 
      };
      const updatedNextProject = { 
        ...nextProject, 
        position: currentProject.position !== undefined ? currentProject.position : currentIndex 
      };
      
      await Promise.all([
        updateProjectApi(updatedCurrentProject.id, updatedCurrentProject),
        updateProjectApi(updatedNextProject.id, updatedNextProject)
      ]);
      
      setProjects(prev => prev.map(p => {
        if (p.id === updatedCurrentProject.id) return updatedCurrentProject;
        if (p.id === updatedNextProject.id) return updatedNextProject;
        return p;
      }));
    } catch (err) {
      alert("Failed to move project: " + (err.response?.data?.detail || err.message));
    }
  };
  
  const handleModalClose = (refresh = false) => { 
    setShowModal(false);
    if (editingProject && refresh) {
      fetchedImageIds.current.delete(editingProject.id);
    }
    setEditingProject(null);
    if (refresh) fetchProjectsData();
  }

  if (loading && projects.length === 0) return (
    <div className="flex justify-center items-center py-20"><Spinner size="h-12 w-12" /></div>
  );
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.15 },
    },
  };

  return (
    <section id="projects" className="relative py-20 md:py-32 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl ${
          theme === 'dark' ? 'bg-emerald-500/5' : 'bg-emerald-500/8'
        }`} />
        <div className={`absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl ${
          theme === 'dark' ? 'bg-blue-500/5' : 'bg-blue-500/8'
        }`} />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
          >
            <span className={`inline-block text-sm font-semibold tracking-widest uppercase mb-3 ${
              theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
            }`}>
              {t('subtitle')}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-blue-500">
              {t('title')}
            </h2>
            <div className={`mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500`} />
          </motion.div>
        </div>
        
        {currentUser?.is_admin && (
          <div className="text-center mb-12">
            <motion.button
              onClick={handleAdd}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400/50'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
              }`}
            >
              <PlusCircle size={18} />
              {t('addProject')}
            </motion.button>
          </div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-center mb-8 p-4 rounded-xl text-sm font-medium ${
              theme === 'dark'
                ? 'text-red-300 bg-red-500/10 border border-red-500/20'
                : 'text-red-700 bg-red-50 border border-red-200'
            }`}
          >
            {error}
          </motion.p>
        )}

        {projects.length === 0 && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <FolderOpen size={48} className={`mx-auto mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {t('noProjects')}
            </p>
          </motion.div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {projects
            .sort((a, b) => {
              if (a.position !== undefined && b.position !== undefined) {
                return a.position - b.position;
              }
              return (a.id || 0) - (b.id || 0);
            })
            .map((project, index, sortedArray) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                isAdmin={currentUser?.is_admin}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onCheckStatus={handleCheckStatus}
                onMoveUp={moveProjectUp}
                onMoveDown={moveProjectDown}
                isFirst={index === 0}
                isLast={index === sortedArray.length - 1}
                imageUrl={projectImages[project.id]?.url ?? null}
                imageLoading={projectImages[project.id]?.loading ?? true}
              />
            ))
          }
        </motion.div>
      </div>

      {showModal && (
        <Modal title={editingProject ? t('editProject') : t('addProject')} onClose={() => handleModalClose(false)}>
          <ProjectForm project={editingProject} onFormSubmit={() => handleModalClose(true)} />
        </Modal>
      )}
    </section>
  );
};

export default ProjectsGrid;
