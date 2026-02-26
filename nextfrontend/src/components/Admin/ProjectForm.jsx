// frontend/src/components/Admin/ProjectForm.jsx
import React, { useState, useEffect } from 'react';
import { createProjectApi, updateProjectApi, uploadProjectImageApi } from '../../api/projects';
import { parseApiError } from '../../lib/error-utils';
import Spinner from '../UI/Spinner';
import ImageUpload from '../UI/ImageUpload';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';

const ProjectForm = ({ project, onFormSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    position: '',
  });
  const [healthCheckUrls, setHealthCheckUrls] = useState([]);
  const [imageFile, setImageFile] = useState(null);       // File object for new upload
  const [initialImageUrl, setInitialImageUrl] = useState(''); // presigned URL for display
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [imageError, setImageError] = useState(null);

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        link: project.link || '',
        position: project.position !== undefined ? project.position : '',
      });
      setHealthCheckUrls(project.health_check_urls || []);
      // image_url is a presigned download URL resolved by backend
      setInitialImageUrl(project.image_url || '');
      setImageFile(null);
    } else {
      setFormData({ title: '', description: '', link: '', position: '' });
      setHealthCheckUrls([]);
      setInitialImageUrl('');
      setImageFile(null);
    }
    setApiError(null);
    setImageError(null);
  }, [project]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Health Check URL helpers ---
  const addHealthCheckUrl = () => setHealthCheckUrls(prev => [...prev, '']);
  const removeHealthCheckUrl = (idx) => setHealthCheckUrls(prev => prev.filter((_, i) => i !== idx));
  const updateHealthCheckUrl = (idx, value) =>
    setHealthCheckUrls(prev => prev.map((u, i) => (i === idx ? value : u)));

  /** Called by ImageUpload with a File object (or null on clear). */
  const handleImageChange = (file) => {
    setImageFile(file);
    setImageError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);
    setImageError(null);

    if (!formData.title.trim()) {
      setApiError('Project title is required.');
      setIsLoading(false);
      return;
    }
    if (!formData.link || formData.link.trim() === '') {
      setApiError('Project Link is required.');
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Create or update the project metadata
      const submitData = {
        ...formData,
        health_check_urls: healthCheckUrls.filter(u => u && u.trim() !== ''),
      };

      let savedProject;
      if (project?.id) {
        savedProject = await updateProjectApi(project.id, submitData);
      } else {
        savedProject = await createProjectApi(submitData);
      }

      // Step 2: Upload image if a new file was selected
      if (imageFile) {
        try {
          setUploadingImage(true);
          const { object_name } = await uploadProjectImageApi(savedProject.id, imageFile);

          // Step 3: Persist the object_name reference on the project
          await updateProjectApi(savedProject.id, { image_object_name: object_name });
        } catch (imgError) {
          console.error('Image upload error:', imgError);
          setImageError('Image upload failed, but project was saved. Please try again.');
          setIsLoading(false);
          setUploadingImage(false);
          onFormSubmit(true);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      onFormSubmit(true);
    } catch (err) {
      console.error('ProjectForm Error:', err);
      setApiError(parseApiError(err, 'An error occurred. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && (
        <div className="text-sm text-red-300 bg-red-700/50 p-3 rounded whitespace-pre-line">
          {apiError}
        </div>
      )}
      
      {imageError && (
        <div className="text-sm text-amber-300 bg-amber-700/50 p-3 rounded flex items-start">
          <AlertTriangle className="flex-shrink-0 mt-0.5 mr-2" size={16} />
          <span>{imageError}</span>
        </div>
      )}
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-mode-primary">Title <span className="text-red-400">*</span></label>
        <input
          type="text"
          name="title"
          id="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="input-field mt-1 text-mode-primary placeholder:text-gray-500"
        />
      </div>
      
      <div>
        <label htmlFor="link" className="block text-sm font-medium text-gray-300">Project Link (URL) <span className="text-red-400">*</span></label>
        <input type="url" name="link" id="link" value={formData.link} onChange={handleChange} required className="input-field mt-1" placeholder="https://example.com" />
      </div>

      {/* Health Check URLs */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-300">
            Health Check URLs
            <span className="ml-1 text-xs text-gray-500">(optional - all must be reachable for status to be Online)</span>
          </label>
          <button
            type="button"
            onClick={addHealthCheckUrl}
            className="flex items-center text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Plus size={14} className="mr-1" /> Add URL
          </button>
        </div>
        {healthCheckUrls.length === 0 && (
          <p className="text-xs text-gray-500 italic">No extra health check URLs. Only the main project link will be checked.</p>
        )}
        {healthCheckUrls.map((url, idx) => (
          <div key={idx} className="flex items-center gap-2 mt-1.5">
            <input
              type="url"
              value={url}
              onChange={e => updateHealthCheckUrl(idx, e.target.value)}
              placeholder={`https://api.example.com/health`}
              className="input-field flex-1"
            />
            <button
              type="button"
              onClick={() => removeHealthCheckUrl(idx)}
              className="p-2 text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
              title="Remove URL"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      
      <div>
        <label htmlFor="position" className="block text-sm font-medium text-gray-300">Display Position (Optional)</label>
        <input 
          type="number" 
          name="position" 
          id="position" 
          value={formData.position} 
          onChange={handleChange} 
          min="0"
          className="input-field mt-1" 
          placeholder="Auto-assign to last position"
        />
        <p className="text-xs text-gray-400 mt-1">
          Leave empty to automatically place at the end. Lower numbers display first (0 = first position).
        </p>
      </div>
      
      {/* Image Upload Component */}
      <ImageUpload
        initialImage={initialImageUrl}
        onImageChange={handleImageChange}
        label="Project Image"
        aspectRatio="aspect-video"
        placeholderText="Upload a project screenshot or logo"
        maxSizeMB={2}
      />
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
        <textarea 
          name="description" 
          id="description" 
          rows="3" 
          value={formData.description} 
          onChange={handleChange} 
          className="input-field mt-1"
          placeholder="Describe your project and its key features..."
        ></textarea>
      </div>
      
      <div className="flex justify-end pt-2">
        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={isLoading || uploadingImage}>
          {isLoading || uploadingImage ? (
            <span className="flex items-center">
              <Spinner size="h-5 w-5" color="text-white" className="mr-2"/> 
              {uploadingImage ? 'Uploading Image...' : 'Saving Project...'}
            </span>
          ) : (
            project ? 'Update Project' : 'Create Project'
          )}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;