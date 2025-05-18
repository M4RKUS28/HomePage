// frontend/src/components/Admin/ProjectForm.jsx (updated with image upload)
import React, { useState, useEffect } from 'react';
import { createProjectApi, updateProjectApi } from '../../api/projects';
import { uploadImageApi } from '../../api/cv'; // Import the image upload API
import Spinner from '../UI/Spinner';
import ImageUpload from '../UI/ImageUpload'; // Import the new ImageUpload component

const ProjectForm = ({ project, onFormSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    image_url: '',
  });
  const [imageData, setImageData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        link: project.link || '',
        image_url: project.image_url || '',
      });
      // Set initial image if it exists
      setImageData(project.image_url || '');
    } else {
      setFormData({ title: '', description: '', link: '', image_url: '' });
      setImageData('');
    }
    setApiError(null);
  }, [project]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (imageDataUrl) => {
    // Store the image data for later upload
    setImageData(imageDataUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);

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

    // Prepare payload for project
    const payload = {
      title: formData.title,
      description: formData.description,
      link: formData.link,
    };

    try {
      // Step 1: Create or update the project
      let updatedProject;
      
      if (project && project.id) {
        updatedProject = await updateProjectApi(project.id, payload);
      } else {
        updatedProject = await createProjectApi(payload);
      }

      // Step 2: If we have an image, upload it
      if (imageData && imageData !== project?.image_url) {
        await uploadImageApi(
          imageData,  // This is the full base64 string
          'project',
          updatedProject.id
        );
      }

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
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300">Title <span className="text-red-400">*</span></label>
        <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="input-field mt-1" />
      </div>
      <div>
        <label htmlFor="link" className="block text-sm font-medium text-gray-300">Project Link (URL) <span className="text-red-400">*</span></label>
        <input type="url" name="link" id="link" value={formData.link} onChange={handleChange} required className="input-field mt-1" placeholder="https://example.com" />
      </div>
      
      {/* Image Upload Component */}
      <ImageUpload
        initialImage={project?.image_url || ''}
        onImageChange={handleImageChange}
        label="Project Image"
        aspectRatio="aspect-video"
        placeholderText="Upload a project screenshot or logo"
        maxSizeMB={5}
      />
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
        <textarea name="description" id="description" rows="3" value={formData.description} onChange={handleChange} className="input-field mt-1"></textarea>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={isLoading}>
          {isLoading ? <Spinner size="h-5 w-5" color="text-white"/> : (project ? 'Update Project' : 'Create Project')}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;