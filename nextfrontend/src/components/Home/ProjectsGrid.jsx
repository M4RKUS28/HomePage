import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import ProjectCard from './ProjectCard';
import { getProjectsApi, getProjectApi, createProjectApi, deleteProjectApi, checkProjectStatusApi, updateProjectApi } from '../../api/projects';
import { useAuth } from '../../hooks/useAuth';import { useLanguage } from '../../contexts/LanguageContext';import Spinner from '../UI/Spinner';
import ProjectForm from '../Admin/ProjectForm';
import Modal from '../UI/Modal';
import { useToast } from '../../contexts/ToastContext';
import { PlusCircle, FolderOpen, Upload, Download, Github } from 'lucide-react';
import GithubImportModal from '../Admin/GithubImportModal';


const ProjectsGrid = () => {
  const t = useTranslations('projects');
  const { locale } = useLanguage();
  const { showToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectImages, setProjectImages] = useState({});
  const [deletingProject, setDeletingProject] = useState(null);
  const [importing, setImporting] = useState(false);
  const [showGithubImport, setShowGithubImport] = useState(false);
  const fetchedImageIds = useRef(new Set());
  const fileInputRef = useRef(null);

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

  const handleGithubImported = (projectData) => {
    setShowGithubImport(false);
    setEditingProject(projectData);
    setShowModal(true);
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

  /** Download the current language's projects as a JSON file (images excluded). */
  const handleExport = () => {
    if (projects.length === 0) {
      showToast({ type: 'warning', message: t('exportEmpty') });
      return;
    }
    const payload = {
      version: 1,
      exported_at: new Date().toISOString(),
      language: locale,
      projects: [...projects]
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((p) => ({
          title: p.title,
          description: p.description ?? '',
          link: p.link,
          github_link: p.github_link ?? '',
          position: p.position ?? 0,
          health_check_urls: p.health_check_urls ?? [],
        })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projects-${locale}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  /**
   * Read a JSON file containing a list of projects (a bare array or an object
   * with a `projects` array) and create them in the current language. Each
   * created project is flagged for automatic translation into the other languages.
   */
  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so the same file can be picked again
    if (!file) return;

    let items;
    try {
      const parsed = JSON.parse(await file.text());
      items = Array.isArray(parsed) ? parsed : parsed?.projects;
    } catch {
      showToast({ type: 'error', message: t('importError') });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      showToast({ type: 'error', message: t('importError') });
      return;
    }

    setImporting(true);
    let success = 0;
    let failed = 0;
    for (const item of items) {
      if (!item?.title || !item?.link) { failed++; continue; }
      try {
        await createProjectApi({
          title: item.title,
          description: item.description ?? '',
          link: item.link,
          github_link: item.github_link ?? '',
          position: item.position,
          health_check_urls: Array.isArray(item.health_check_urls) ? item.health_check_urls : [],
          language: locale,
        });
        success++;
      } catch (err) {
        console.error('Project import failed:', err);
        failed++;
      }
    }
    setImporting(false);

    if (failed === 0) {
      showToast({ type: 'success', message: t('importSuccess', { count: success }) });
    } else if (success > 0) {
      showToast({ type: 'warning', message: t('importPartial', { success, failed }) });
    } else {
      showToast({ type: 'error', message: t('importError') });
    }

    if (success > 0) fetchProjectsData();
  };

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
  
  const handleModalClose = (savedProject = null) => {
    setShowModal(false);
    setEditingProject(null);
    if (savedProject && typeof savedProject === 'object' && savedProject.id) {
      // Optimistically add/update the project in local state immediately
      setProjects(prev => {
        const exists = prev.some(p => p.id === savedProject.id);
        if (exists) return prev.map(p => p.id === savedProject.id ? { ...p, ...savedProject } : p);
        return [...prev, savedProject];
      });
      // Set the image URL directly from the API response so it shows without a round-trip
      const imageUrl = savedProject.image_url || savedProject.image_external_url || null;
      fetchedImageIds.current.add(savedProject.id);
      setProjectImages(prev => ({
        ...prev,
        [savedProject.id]: { loading: false, url: imageUrl },
      }));
      // Background re-sync from server
      fetchProjectsData();
    }
  }

  if (loading && projects.length === 0) return (
    <div className="flex justify-center items-center py-20"><Spinner size="h-12 w-12" /></div>
  );
  
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
          <div className="mb-12 flex flex-wrap gap-3">
            <motion.button
              onClick={handleAdd}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-ghost text-sm px-6 py-3"
            >
              <PlusCircle size={17} />
              {t('addProject')}
            </motion.button>

            <motion.button
              onClick={handleImportClick}
              disabled={importing}
              whileHover={{ scale: importing ? 1 : 1.03 }}
              whileTap={{ scale: importing ? 1 : 0.97 }}
              className="btn-ghost text-sm px-6 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {importing ? <Spinner size="h-4 w-4" /> : <Upload size={17} />}
              {t('importProjects')}
            </motion.button>

            <motion.button
              onClick={() => setShowGithubImport(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-ghost text-sm px-6 py-3"
            >
              <Github size={17} />
              {t('importFromGithub')}
            </motion.button>

            <motion.button
              onClick={handleExport}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-ghost text-sm px-6 py-3"
            >
              <Download size={17} />
              {t('exportProjects')}
            </motion.button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              className="hidden"
            />
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
                index={index}
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
        </div>
      </div>

      {showGithubImport && (
        <Modal title={t('importFromGithub')} onClose={() => setShowGithubImport(false)}>
          <GithubImportModal
            onImported={handleGithubImported}
            onClose={() => setShowGithubImport(false)}
          />
        </Modal>
      )}

      {showModal && (
        <Modal title={editingProject ? t('editProject') : t('addProject')} onClose={() => handleModalClose()}>
          <ProjectForm project={editingProject} onFormSubmit={handleModalClose} />
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
