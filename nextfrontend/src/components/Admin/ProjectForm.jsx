// frontend/src/components/Admin/ProjectForm.jsx (enhanced image upload)
import React, { useState, useEffect } from 'react';
import { createProjectApi, updateProjectApi } from '../../api/projects';
import { uploadImageApi } from '../../api/cv';
import Spinner from '../UI/Spinner';
import ImageUpload from '../UI/ImageUpload';
import { AlertTriangle } from 'lucide-react';

const ProjectForm = ({ project, onFormSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    position: '',  // Empty string means auto-assign position
  });
  const [imageData, setImageData] = useState('');
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
      // Set initial image if it exists
      setImageData(project.image || '');
    } else {
      setFormData({ title: '', description: '', link: '', position: '' });  // Empty position for auto-assign
      setImageData('');
    }
    setApiError(null);
    setImageError(null);
  }, [project]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (imageDataUrl) => {
    setImageData(imageDataUrl);
    setImageError(null); // Clear any previous image errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);
    setImageError(null);

    // Frontend validation
    if (!formData.title.trim()) {
      setApiError("Project title is required.");
      setIsLoading(false);
      return;
    }

    if (!formData.link || formData.link.trim() === "") {
      setApiError("Project Link is required.");
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Create or update the project basic info
      let updatedProject;
      
      if (project && project.id) {
        updatedProject = await updateProjectApi(project.id, formData);
      } else {
        updatedProject = await createProjectApi(formData);
      }
      
      // Step 2: If we have an image, upload it separately
      if (imageData && (imageData !== project?.image || !project)) {
        try {
          setUploadingImage(true);
          await uploadImageApi(
            imageData,
            'project',
            updatedProject.id
          );
        } catch (imgError) {
          console.error("Image upload error:", imgError);
          setImageError("Image upload failed, but project was saved. Please try uploading the image again.");
          setIsLoading(false);
          setUploadingImage(false);
          
          // Still consider form submission successful so project gets saved
          onFormSubmit(true);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      // Success! Notify parent component
      onFormSubmit(true);
    } catch (err) {
      console.error("ProjectForm Error:", err);
      
      // Handle API errors
      if (err.response && err.response.data) {
        if (err.response.data.detail && Array.isArray(err.response.data.detail)) {
          // Handle FastAPI validation errors (422)
          const messages = err.response.data.detail.map(d => {
            const field = d.loc && d.loc.length > 1 ? d.loc[1] : 'Field';
            return `${field.toString().replace("_", " ")}: ${d.msg}`;
          }).join('\n');
          setApiError(messages || "Validation Error. Please check your inputs.");
        } else if (err.response.data.detail) {
          // Handle other FastAPI errors with a 'detail' string
          setApiError(err.response.data.detail);
        } else {
          // Generic error message
          setApiError(err.message || 'An error occurred. Please try again.');
        }
      } else {
        setApiError(err.message || 'A network error occurred. Please try again.');
      }
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-300">Title <span className="text-red-400">*</span></label>
        <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="input-field mt-1" />
      </div>
      
      <div>
        <label htmlFor="link" className="block text-sm font-medium text-gray-300">Project Link (URL) <span className="text-red-400">*</span></label>
        <input type="url" name="link" id="link" value={formData.link} onChange={handleChange} required className="input-field mt-1" placeholder="https://example.com" />
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
        initialImage={project?.image || imageData}
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