import React, { useState, useEffect } from 'react';
import { createProjectApi, updateProjectApi } from '../../api/projects';
import Spinner from '../UI/Spinner';

const ProjectForm = ({ project, onFormSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    image_url: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null); // Use null for object or string for message

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        link: project.link || '',
        image_url: project.image_url || '',
      });
    } else {
      setFormData({ title: '', description: '', link: '', image_url: '' });
    }
    setApiError(null); // Clear error when project changes or form resets
  }, [project]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null); // Clear previous errors

    // Frontend validation for required fields (example for link)
    if (!formData.link || formData.link.trim() === "") {
        setApiError("Project Link is required.");
        setIsLoading(false);
        return;
    }
    // You can add more frontend validation here for URLs if desired,
    // but backend will catch it anyway.

    const payload = {
      title: formData.title,
      description: formData.description,
      link: formData.link,
      // Only include image_url if it's not empty, to avoid Pydantic validating an empty string.
      // This aligns with "Option B" from above.
      // If you implemented "Option A" in the backend, you can just send:
      // image_url: formData.image_url,
    };
    if (formData.image_url && formData.image_url.trim() !== "") {
      payload.image_url = formData.image_url.trim();
    }


    try {
      if (project && project.id) {
        await updateProjectApi(project.id, payload);
      } else {
        await createProjectApi(payload);
      }
      onFormSubmit(true); // Pass true to indicate success and refresh
    } catch (err) {
      console.error("ProjectForm Error:", err); // Log the full error for debugging
      if (err.response && err.response.data) {
        if (err.response.data.detail && Array.isArray(err.response.data.detail)) {
          // Handle FastAPI validation errors (422)
          const messages = err.response.data.detail.map(d => {
            const field = d.loc && d.loc.length > 1 ? d.loc[1] : 'Field'; // Get field name
            return `${field.toString().replace("_", " ")}: ${d.msg}`; // Capitalize field for display
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
          {/* Render apiError as a string. The whitespace-pre-line will respect newlines if any */}
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
      <div>
        <label htmlFor="image_url" className="block text-sm font-medium text-gray-300">Image URL (Optional)</label>
        <input type="url" name="image_url" id="image_url" value={formData.image_url} onChange={handleChange} className="input-field mt-1" placeholder="https://example.com/image.jpg" />
      </div>
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