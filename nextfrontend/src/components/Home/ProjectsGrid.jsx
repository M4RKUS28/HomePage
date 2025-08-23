import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import ProjectCard from './ProjectCard';
import { getProjectsApi, deleteProjectApi, checkProjectStatusApi, updateProjectApi } from '../../api/projects';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../UI/Spinner';
import ProjectForm from '../Admin/ProjectForm'; // For add/edit modal
import Modal from '../UI/Modal'; // Generic Modal
import { PlusCircle, ArrowUp, ArrowDown } from 'lucide-react';


const ProjectsGrid = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const fetchProjectsData = useCallback(async () => {
    // Don't set loading to true on interval refresh to avoid UI flicker
    // setLoading(true); 
    try {
      const data = await getProjectsApi();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError('Failed to load projects. The server might be down or an error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectsData();
    const intervalId = setInterval(fetchProjectsData, 60000); // Every minute
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
      // Optimistic update to "checking"
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === projectId ? { ...p, status: 'checking' } : p)
      );
      const updatedProject = await checkProjectStatusApi(projectId);
      // Update with actual status from API response
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
      );
    } catch (err) {
      alert("Failed to trigger status check: " + (err.response?.data?.detail || err.message));
      // Revert optimistic update on error or refetch
      fetchProjectsData();
    }
  };

  const handleEdit = (project) => { setEditingProject(project); setShowModal(true); }
  const handleAdd = () => { setEditingProject(null); setShowModal(true); }
  
  const moveProjectUp = async (projectId) => {
    const sortedProjects = [...projects].sort((a, b) => {
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      return (a.id || 0) - (b.id || 0);
    });
    
    const currentIndex = sortedProjects.findIndex(p => p.id === projectId);
    if (currentIndex <= 0) return; // Can't move up if it's already first
    
    try {
      const currentProject = sortedProjects[currentIndex];
      const previousProject = sortedProjects[currentIndex - 1];
      
      // Swap positions
      const updatedCurrentProject = { 
        ...currentProject, 
        position: previousProject.position !== undefined ? previousProject.position : currentIndex - 1 
      };
      const updatedPreviousProject = { 
        ...previousProject, 
        position: currentProject.position !== undefined ? currentProject.position : currentIndex 
      };
      
      // Update both projects in the API
      await Promise.all([
        updateProjectApi(updatedCurrentProject.id, updatedCurrentProject),
        updateProjectApi(updatedPreviousProject.id, updatedPreviousProject)
      ]);
      
      // Update local state
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
    if (currentIndex < 0 || currentIndex >= sortedProjects.length - 1) return; // Can't move down if it's already last
    
    try {
      const currentProject = sortedProjects[currentIndex];
      const nextProject = sortedProjects[currentIndex + 1];
      
      // Swap positions
      const updatedCurrentProject = { 
        ...currentProject, 
        position: nextProject.position !== undefined ? nextProject.position : currentIndex + 1 
      };
      const updatedNextProject = { 
        ...nextProject, 
        position: currentProject.position !== undefined ? currentProject.position : currentIndex 
      };
      
      // Update both projects in the API
      await Promise.all([
        updateProjectApi(updatedCurrentProject.id, updatedCurrentProject),
        updateProjectApi(updatedNextProject.id, updatedNextProject)
      ]);
      
      // Update local state
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
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  return (
    <section id="projects" className="py-16 md:py-24 bg-gray-800/30 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity:0, y:20 }}
          whileInView={{ opacity:1, y:0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold text-center mb-12 projects-gradient"
        >
          My Creations and Projects
        </motion.h2>
        
        {currentUser?.is_admin && (
          <div className="text-center mb-10">
            <button onClick={handleAdd} className="btn btn-primary inline-flex items-center">
              <PlusCircle size={20} className="mr-2"/> Add New Project
            </button>
          </div>
        )}

        {error && <p className="text-red-400 text-center mb-8 bg-red-900/50 p-3 rounded-md">{error}</p>}

        {projects.length === 0 && !loading && !error && (
          <p className="text-center text-gray-400 text-xl py-10">
            No projects to display yet. {currentUser?.is_admin ? "Click 'Add New Project' to get started!" : "Check back soon!"}
          </p>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {projects
            .sort((a, b) => {
              // Sort by position if available, otherwise by id
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
              />
            ))
          }
        </motion.div>
      </div>
      {showModal && (
        <Modal title={editingProject ? "Edit Project" : "Add New Project"} onClose={() => handleModalClose(false)}>
          <ProjectForm project={editingProject} onFormSubmit={() => handleModalClose(true)} />
        </Modal>
      )}
    </section>
  );
};

export default ProjectsGrid;