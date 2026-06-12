import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import ProjectCard from './ProjectCard';
import { getProjectsApi, getProjectApi, deleteProjectApi, checkProjectStatusApi, updateProjectApi } from '../../api/projects';
import { useAuth } from '../../hooks/useAuth';import { useLanguage } from '../../contexts/LanguageContext';import Spinner from '../UI/Spinner';
import ProjectForm from '../Admin/ProjectForm';
import Modal from '../UI/Modal';
import { PlusCircle, FolderOpen } from 'lucide-react';


const ProjectsGrid = () => {
  const t = useTranslations('projects');
  const { locale } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectImages, setProjectImages] = useState({});
  const [deletingProject, setDeletingProject] = useState(null);
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
  }, [fetchImageForProject, locale]);

  useEffect(() => {
    fetchProjectsData();
    const intervalId = setInterval(fetchProjectsData, 60000);
    return () => clearInterval(intervalId);
  }, [fetchProjectsData]);

  const handleDelete = async (project) => {
    setDeletingProject(project);
  };

  const confirmDelete = async () => {
    if (!deletingProject) return;
    try {
      await deleteProjectApi(deletingProject.id);
      setProjects(prev => prev.filter(p => p.id !== deletingProject.id));
      setDeletingProject(null);
    } catch (err) {
      alert("Failed to delete project: " + (err.response?.data?.detail || err.message));
      setDeletingProject(null);
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

  const onlineCount = projects.filter(p => p.status?.toLowerCase() === 'up').length;

  return (
    <section id="projects" className="relative py-20 md:py-32">
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header: title left, live system readout right */}
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
          >
            <span className="eyebrow mb-3">
              <span className="status-dot status-dot--accent" />
              {t('subtitle')}
            </span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-ink">
              {t('title')}
            </h2>
          </motion.div>

          {projects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex items-center gap-4 font-data text-xs uppercase tracking-[0.16em] text-ink-3 md:pb-2"
            >
              <span className="text-2xl font-semibold text-ink">{String(projects.length).padStart(2, '0')}</span>
              {onlineCount > 0 && (
                <span className="inline-flex items-center gap-2 rounded-md border border-line px-2.5 py-1.5">
                  <span className="status-dot" />
                  {t('onlineCount', { count: onlineCount })}
                </span>
              )}
            </motion.div>
          )}
        </div>

        {currentUser?.is_admin && (
          <div className="mb-12">
            <motion.button
              onClick={handleAdd}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-ghost text-sm px-6 py-3"
            >
              <PlusCircle size={17} />
              {t('addProject')}
            </motion.button>
          </div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-8 p-4 rounded-xl text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/25"
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
            <FolderOpen size={44} className="mx-auto mb-4 text-ink-3 opacity-60" />
            <p className="text-lg text-ink-3">
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

      {deletingProject && (
        <Modal title={t('deleteProject')} onClose={() => setDeletingProject(null)}>
          <div className="p-2 space-y-6">
            <p className="text-sm text-ink-2">
              Are you sure you want to delete <strong>{deletingProject.title}</strong>? This action cannot be undone and will permanently remove all language variants and images associated with this project.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-line">
              <button
                onClick={() => setDeletingProject(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-raised text-ink-2 hover:text-ink border border-line hover:border-line-strong"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
              >
                Delete Project
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
};

export default ProjectsGrid;
