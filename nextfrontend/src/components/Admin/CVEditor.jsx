// frontend/src/components/Admin/CVEditor.jsx
import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';
import Spinner from '../UI/Spinner';
import Modal from '../UI/Modal';
import { 
  Plus, Edit, Trash2, Save, RefreshCw, Award, Briefcase, 
  GraduationCap, Code, User, Link, Users, Zap, Download
} from 'lucide-react';
import { getCVDataApi, updateCVDataApi } from '../../api/cv';

import ImageUpload from '../UI/ImageUpload'; // Import the new ImageUpload component
import { uploadImageApi } from '../../api/cv'; // Import the image upload API

// Component for editing CV sections
const CVEditor = () => {
  const [cvData, setCVData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('summary');
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentSectionKey, setCurrentSectionKey] = useState(null);
  const [rawDataText, setRawDataText] = useState('');
  const { showToast } = useToast();

  // Initial data load
  useEffect(() => {
    fetchCVData();
    }, []);

    const fetchCVData = useCallback(async () => {
    setLoading(true);
    try {
        const data = await getCVDataApi();
        
        // Initialize the CV data structure with empty arrays if they don't exist
        const initializedData = {
        summary: data?.summary || "",
        experience: data?.experience || [],
        education: data?.education || [],
        projectsHighlight: data?.projectsHighlight || [],
        awards: data?.awards || [],
        skills: data?.skills || [],
        volunteering: data?.volunteering || [],
        languages: data?.languages || [],
        personalInfo: data?.personalInfo || {
            name: "",
            title: "",
            profileImage: "",
            headerText: "",
            socialLinks: []
        }
        };
        
        // Ensure personalInfo structure is complete
        if (!initializedData.personalInfo.socialLinks) {
        initializedData.personalInfo.socialLinks = [];
        }
        
        setCVData(initializedData);
        setError(null);
    } catch (err) {
        console.error("Error fetching CV data:", err);
        setError('Failed to load CV data. Please try again.');
        
        // Initialize with an empty structure if fetch fails
        setCVData({
        summary: "",
        experience: [],
        education: [],
        projectsHighlight: [],
        awards: [],
        skills: [],
        volunteering: [],
        languages: [],
        personalInfo: {
            name: "",
            title: "",
            profileImage: "",
            headerText: "",
            socialLinks: []
        }
        });
    } finally {
        setLoading(false);
    }
    }, []);

  // Sync raw data text with cvData changes
  useEffect(() => {
    if (cvData) {
      setRawDataText(JSON.stringify(cvData, null, 2));
    }
  }, [cvData]);

  const saveCV = async () => {
    setSaving(true);
    try {
      await updateCVDataApi(cvData);
      showToast({ 
        type: 'success', 
        message: 'CV data saved successfully'
      });
    } catch (err) {
      console.error("Error saving CV data:", err);
      showToast({ 
        type: 'error', 
        message: 'Failed to save CV data. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSummaryChange = (e) => {
    setCVData(prev => ({
      ...prev,
      summary: e.target.value
    }));
  };

  const handlePersonalInfoChange = (field, value) => {
    setCVData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const handleSocialLinkChange = (index, field, value) => {
    const updatedLinks = [...cvData.personalInfo.socialLinks];
    updatedLinks[index] = {
      ...updatedLinks[index],
      [field]: value
    };
    
    setCVData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        socialLinks: updatedLinks
      }
    }));
  };

  const addSocialLink = () => {
    setCVData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        socialLinks: [
          ...prev.personalInfo.socialLinks,
          { platform: "", url: "" }
        ]
      }
    }));
  };

  const removeSocialLink = (index) => {
    const updatedLinks = [...cvData.personalInfo.socialLinks];
    updatedLinks.splice(index, 1);
    
    setCVData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        socialLinks: updatedLinks
      }
    }));
  };

  const addItem = (sectionKey) => {
    setCurrentSectionKey(sectionKey);
    
    // Create a new blank item based on section type
    let newItem = { id: Date.now() }; // Temporary id for frontend
    
    switch(sectionKey) {
      case 'experience':
        newItem = { ...newItem, role: "", company: "", period: "", details: "" };
        break;
      case 'education':
        newItem = { ...newItem, degree: "", institution: "", period: "", details: "" };
        break;
      case 'projectsHighlight':
        newItem = { ...newItem, name: "", period: "", description: "", links: [] };
        break;
      case 'awards':
        newItem = { ...newItem, name: "", date: "", awardingBody: "", details: "", links: [] };
        break;
      case 'skills':
        newItem = { ...newItem, name: "", level: 50 };
        break;
      case 'volunteering':
        newItem = { ...newItem, role: "", organization: "", period: "", details: "" };
        break;
      case 'languages':
        newItem = { ...newItem, name: "", level: "" };
        break;
      default:
        break;
    }
    
    setCurrentItem(newItem);
    setShowItemModal(true);
  };

  const editItem = (sectionKey, item) => {
    setCurrentSectionKey(sectionKey);
    setCurrentItem({...item}); // Clone to avoid direct mutation
    setShowItemModal(true);
  };

  const removeItem = async (sectionKey, itemId) => {
    if (!window.confirm('Are you sure you want to remove this item?')) return;
    
    // Update state and get the new data
    const updatedCVData = await new Promise((resolve) => {
      setCVData(prev => {
        const newData = {
          ...prev,
          [sectionKey]: prev[sectionKey].filter(item => item.id !== itemId)
        };
        resolve(newData);
        return newData;
      });
    });
    
    // Automatically save to backend
    try {
      await updateCVDataApi(updatedCVData);
      showToast({ 
        type: 'success', 
        message: 'Item removed and synced successfully'
      });
    } catch (err) {
      console.error("Error auto-saving CV data after removal:", err);
      showToast({ 
        type: 'error', 
        message: 'Item removed locally but failed to sync. Please try "Save All Changes" manually.'
      });
    }
  };

  const handleItemSave = async () => {
    if (!currentItem || !currentSectionKey) return;
    
    // Update existing or add new
    const updatedCVData = await new Promise((resolve) => {
      setCVData(prev => {
        const existingItemIndex = prev[currentSectionKey].findIndex(item => item.id === currentItem.id);
        
        let newData;
        if (existingItemIndex >= 0) {
          // Update existing
          const updatedItems = [...prev[currentSectionKey]];
          updatedItems[existingItemIndex] = currentItem;
          newData = {
            ...prev,
            [currentSectionKey]: updatedItems
          };
        } else {
          // Add new
          newData = {
            ...prev,
            [currentSectionKey]: [...prev[currentSectionKey], currentItem]
          };
        }
        
        resolve(newData);
        return newData;
      });
    });
    
    // Automatically save to backend
    try {
      await updateCVDataApi(updatedCVData);
      showToast({ 
        type: 'success', 
        message: 'Item saved and synced successfully'
      });
    } catch (err) {
      console.error("Error auto-saving CV data:", err);
      showToast({ 
        type: 'error', 
        message: 'Item saved locally but failed to sync. Please try "Save All Changes" manually.'
      });
    }
    
    setShowItemModal(false);
    setCurrentItem(null);
  };

  const handleItemChange = (field, value) => {
    setCurrentItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLinkChange = (index, field, value) => {
    if (!currentItem.links) {
      setCurrentItem(prev => ({
        ...prev,
        links: [{ text: "", url: "" }]
      }));
      return;
    }
    
    const updatedLinks = [...currentItem.links];
    if (!updatedLinks[index]) {
      updatedLinks[index] = { text: "", url: "" };
    }
    
    updatedLinks[index] = {
      ...updatedLinks[index],
      [field]: value
    };
    
    setCurrentItem(prev => ({
      ...prev,
      links: updatedLinks
    }));
  };

  const addLink = () => {
    setCurrentItem(prev => ({
      ...prev,
      links: [...(prev.links || []), { text: "", url: "" }]
    }));
  };

  const removeLink = (index) => {
    const updatedLinks = [...currentItem.links];
    updatedLinks.splice(index, 1);
    
    setCurrentItem(prev => ({
      ...prev,
      links: updatedLinks
    }));
  };

  // Loading state
  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="h-12 w-12" /></div>;
  }

  // Error state
  if (error && !cvData) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 text-red-300 p-4 rounded-lg text-center">
        <p>{error}</p>
        <button 
          onClick={fetchCVData} 
          className="mt-2 px-4 py-2 bg-red-500/30 hover:bg-red-500/50 rounded-md transition-colors flex items-center mx-auto"
        >
          <RefreshCw size={16} className="mr-2" /> Try Again
        </button>
      </div>
    );
  }

  if (!cvData) return null;

  const renderSectionNav = () => (
    <div className="mb-8 flex gap-2">
      <button 
        onClick={() => setActiveSection('personalInfo')}
        className={`nav-button text-sm px-3 py-2.5 flex-1 ${activeSection === 'personalInfo' ? 'active' : ''}`}
      >
        <User size={15} className="mr-1.5" /> Personal
      </button>
      <button 
        onClick={() => setActiveSection('summary')}
        className={`nav-button text-sm px-3 py-2.5 flex-1 ${activeSection === 'summary' ? 'active' : ''}`}
      >
        <User size={15} className="mr-1.5" /> Summary
      </button>
      <button 
        onClick={() => setActiveSection('skills')}
        className={`nav-button text-sm px-3 py-2.5 flex-1 ${activeSection === 'skills' ? 'active' : ''}`}
      >
        <Zap size={15} className="mr-1.5" /> Skills
      </button>
      <button 
        onClick={() => setActiveSection('experience')}
        className={`nav-button text-sm px-3 py-2.5 flex-1 ${activeSection === 'experience' ? 'active' : ''}`}
      >
        <Briefcase size={15} className="mr-1.5" /> Experience
      </button>
      <button 
        onClick={() => setActiveSection('education')}
        className={`nav-button text-sm px-3 py-2.5 flex-1 ${activeSection === 'education' ? 'active' : ''}`}
      >
        <GraduationCap size={15} className="mr-1.5" /> Education
      </button>
      <button 
        onClick={() => setActiveSection('projectsHighlight')}
        className={`nav-button text-sm px-3 py-2.5 flex-1 ${activeSection === 'projectsHighlight' ? 'active' : ''}`}
      >
        <Code size={15} className="mr-1.5" /> Projects
      </button>
      <button 
        onClick={() => setActiveSection('awards')}
        className={`nav-button text-sm px-3 py-2.5 flex-1 ${activeSection === 'awards' ? 'active' : ''}`}
      >
        <Award size={15} className="mr-1.5" /> Awards
      </button>
      <button 
        onClick={() => setActiveSection('volunteering')}
        className={`nav-button text-sm px-3 py-2.5 flex-1 ${activeSection === 'volunteering' ? 'active' : ''}`}
      >
        <Users size={15} className="mr-1.5" /> Volunteering
      </button>
      <button 
        onClick={() => setActiveSection('rawData')}
        className={`nav-button text-sm px-3 py-2.5 flex-1 ${activeSection === 'rawData' ? 'active' : ''}`}
      >
        <Code size={15} className="mr-1.5" /> Raw Data
      </button>
    </div>
  );

  
    const renderPersonalInfoSection = () => (
    <div className="section-card">
        <h3 className="section-title">Personal Information</h3>
        <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <label className="form-label">Name</label>
            <input
                type="text"
                className="input-field"
                value={cvData.personalInfo?.name || ''}
                onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
            />
            </div>
            <div>
            <label className="form-label">Title/Headline</label>
            <input
                type="text"
                className="input-field"
                value={cvData.personalInfo?.title || ''}
                onChange={(e) => handlePersonalInfoChange('title', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">This appears under your name in the hero section</p>
            </div>
        </div>
        
        {/* Profile Image Upload */}
        <div>
            <label className="form-label">Profile Image</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUpload
                initialImage={cvData.personalInfo?.profileImage || ''}
                onImageChange={(imageData) => handleProfileImageChange(imageData)}
                className="w-full max-w-[250px]" // Reduced size
                aspectRatio="aspect-square"
                placeholderText="Upload profile picture"
                maxSizeMB={2}
                maxWidth={200}
                maxHeight={200}
                />
                <div className="flex flex-col justify-center">
                <p className="text-sm text-gray-200">
                    This image will appear in the hero section of your portfolio.
                    <br /><br />
                    • Recommended: Square image, at least 300x300 pixels
                    <br />
                    • Max file size: 2MB
                    <br />
                    • Supported formats: JPG, PNG, GIF
                </p>
                </div>
            </div>
            </div>
        
        <div>
            <label className="form-label">Header Text</label>
            <input
            type="text"
            className="input-field"
            value={cvData.personalInfo?.headerText || ''}
            onChange={(e) => handlePersonalInfoChange('headerText', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">This appears in the top-left corner of the site (currently "M4RKUS28")</p>
        </div>
        
        <div>
            <div className="flex justify-between items-center mb-2">
            <label className="form-label mb-0">Social Links</label>
            <button
                type="button"
                onClick={addSocialLink}
                className="btn btn-sm bg-gray-700 text-gray-200 hover:bg-gray-600 flex items-center"
            >
                <Plus size={14} className="mr-1" /> Add Link
            </button>
            </div>
            
            <div className="space-y-3">
            {cvData.personalInfo?.socialLinks?.map((link, index) => (
                <div key={index} className="flex space-x-2">
                <select
                    className="input-field w-1/3"
                    value={link.platform || ''}
                    onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                >
                    <option value="">Select Platform</option>
                    <option value="github">GitHub</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter</option>
                    <option value="email">Email</option>
                    <option value="website">Website</option>
                </select>
                <input
                    type="text"
                    className="input-field flex-1"
                    placeholder="URL"
                    value={link.url || ''}
                    onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                />
                <button
                    type="button"
                    onClick={() => removeSocialLink(index)}
                    className="btn btn-sm bg-red-900/50 text-red-300 hover:bg-red-900/70"
                    title="Remove Link"
                >
                    <Trash2 size={14} />
                </button>
                </div>
            ))}
            </div>
        </div>
        </div>
    </div>
    );
    // Add this new function to handle profile image changes
    const handleProfileImageChange = async (imageData) => {
    // Update the CV data state
    setCVData(prev => ({
        ...prev,
        personalInfo: {
        ...prev.personalInfo,
        profileImage: imageData
        }
    }));
    
    };

  const renderSummarySection = () => (
    <div className="section-card">
      <h3 className="section-title">Summary</h3>
      <textarea
        className="input-field w-full h-40"
        value={cvData.summary}
        onChange={handleSummaryChange}
        placeholder="Write a brief professional summary..."
      />
    </div>
  );

  const renderListSection = (sectionKey, title, itemRenderer) => {
    const items = cvData[sectionKey] || [];
    
    return (
      <div className="section-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="section-title mb-0">{title}</h3>
          <button
            type="button"
            onClick={() => addItem(sectionKey)}
            className="btn btn-sm btn-primary flex items-center"
          >
            <Plus size={14} className="mr-1" /> Add Item
          </button>
        </div>
        
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="border border-gray-700 rounded-md p-4 bg-gray-800/50">
                {itemRenderer(item)}
                <div className="flex justify-end space-x-2 mt-3">
                  <button
                    type="button"
                    onClick={() => editItem(sectionKey, item)}
                    className="btn btn-sm bg-blue-900/50 text-blue-300 hover:bg-blue-900/70 flex items-center"
                  >
                    <Edit size={14} className="mr-1" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(sectionKey, item.id)}
                    className="btn btn-sm bg-red-900/50 text-red-300 hover:bg-red-900/70 flex items-center"
                  >
                    <Trash2 size={14} className="mr-1" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-6">No items yet. Click "Add Item" to get started.</p>
        )}
      </div>
    );
  };

  const renderExperienceItem = (item) => (
    <>
      <div className="flex justify-between">
        <h4 className="text-lg font-medium text-white">{item.role || "Untitled Role"}</h4>
        <span className="text-sm text-gray-400">{item.period || "No Date"}</span>
      </div>
      <div className="text-primary">{item.company || "Untitled Company"}</div>
      <div className="mt-2 text-sm text-gray-300 whitespace-pre-line">{item.details || "No details"}</div>
    </>
  );

  const renderEducationItem = (item) => (
    <>
      <div className="flex justify-between">
        <h4 className="text-lg font-medium text-white">{item.degree || "Untitled Degree"}</h4>
        <span className="text-sm text-gray-400">{item.period || "No Date"}</span>
      </div>
      <div className="text-primary">{item.institution || "Untitled Institution"}</div>
      {item.details && <div className="mt-2 text-sm text-gray-300">{item.details}</div>}
    </>
  );

  const renderProjectItem = (item) => (
    <>
      <div className="flex justify-between">
        <div className="flex items-center">
          {item.logo && (
            <img 
              src={item.logo} 
              alt={`${item.name} logo`} 
              className="w-8 h-8 object-contain mr-3 rounded"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <h4 className="text-lg font-medium text-white">{item.name || "Untitled Project"}</h4>
        </div>
        <span className="text-sm text-gray-400">{item.period || "No Date"}</span>
      </div>
      <div className="mt-2 text-sm text-gray-300 whitespace-pre-line">{item.description || "No description"}</div>
      {item.links && item.links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {item.links.map((link, idx) => (
            <a 
              key={idx} 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-700 text-white"
            >
              <Link size={12} className="mr-1" /> {link.text || "Link"}
            </a>
          ))}
        </div>
      )}
    </>
  );

  const renderAwardItem = (item) => (
    <>
      <div className="flex justify-between">
        <h4 className="text-lg font-medium text-white">{item.name || "Untitled Award"}</h4>
        <span className="text-sm text-gray-400">{item.date || "No Date"}</span>
      </div>
      <div className="text-primary">{item.awardingBody || "Untitled Organization"}</div>
      {item.details && <div className="mt-2 text-sm text-gray-300">{item.details}</div>}
      {item.links && item.links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {item.links.map((link, idx) => (
            <a 
              key={idx} 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-700 text-white"
            >
              <Link size={12} className="mr-1" /> {link.text || "Link"}
            </a>
          ))}
        </div>
      )}
    </>
  );

  const renderVolunteeringItem = (item) => (
    <>
      <div className="flex justify-between">
        <div className="flex items-center">
          {item.logo && (
            <img 
              src={item.logo} 
              alt={`${item.organization} logo`} 
              className="w-8 h-8 object-contain mr-3 rounded"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <h4 className="text-lg font-medium text-white">{item.role || "Untitled Role"}</h4>
        </div>
        <span className="text-sm text-gray-400">{item.period || "No Date"}</span>
      </div>
      <div className="text-primary">{item.organization || "Untitled Organization"}</div>
      <div className="mt-2 text-sm text-gray-300 whitespace-pre-line">{item.details || "No details"}</div>
    </>
  );

  const renderSkillsSection = () => (
    <div className="section-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="section-title mb-0">Skills</h3>
        <button
          type="button"
          onClick={() => addItem('skills')}
          className="btn btn-sm btn-primary flex items-center"
        >
          <Plus size={14} className="mr-1" /> Add Skill
        </button>
      </div>
      
      {cvData.skills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cvData.skills.map(skill => (
            <div key={skill.id || skill.name} className="border border-gray-700 rounded-md p-3 bg-gray-800/50">
              <div className="flex justify-between items-center">
                <span className="font-medium text-white">{skill.name || "Untitled Skill"}</span>
                <span className="text-primary text-sm">{skill.level}%</span>
              </div>
              <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-primary h-full rounded-full" 
                  style={{ width: `${skill.level}%` }}
                ></div>
              </div>
              <div className="flex justify-end space-x-2 mt-3">
                <button
                  type="button"
                  onClick={() => editItem('skills', skill)}
                  className="btn btn-sm bg-blue-900/50 text-blue-300 hover:bg-blue-900/70 flex items-center"
                >
                  <Edit size={14} className="mr-1" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeItem('skills', skill.id)}
                  className="btn btn-sm bg-red-900/50 text-red-300 hover:bg-red-900/70 flex items-center"
                >
                  <Trash2 size={14} className="mr-1" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-6">No skills added yet. Click "Add Skill" to get started.</p>
      )}
    </div>
  );

  const handleRawDataChange = (value) => {
    setRawDataText(value);
  };

  const applyRawDataChanges = () => {
    try {
      // Trim whitespace and check if empty
      const trimmedText = rawDataText.trim();
      if (!trimmedText) {
        showToast({ 
          type: 'error', 
          message: 'JSON data cannot be empty'
        });
        return;
      }

      // Parse JSON with detailed error handling
      const parsedData = JSON.parse(trimmedText);
      
      // Basic structure validation
      if (typeof parsedData !== 'object' || parsedData === null) {
        showToast({ 
          type: 'error', 
          message: 'JSON must be a valid object structure'
        });
        return;
      }

      setCVData(parsedData);
      showToast({ 
        type: 'success', 
        message: 'Raw data applied successfully'
      });
    } catch (error) {
      let errorMessage = 'Invalid JSON format';
      
      // Provide more specific error messages
      if (error.message.includes('Unexpected token')) {
        errorMessage = `JSON Syntax Error: ${error.message}`;
      } else if (error.message.includes('Unexpected end')) {
        errorMessage = 'JSON Error: Unexpected end of data - missing closing bracket or quote';
      } else if (error.message.includes('position')) {
        errorMessage = `JSON Error: ${error.message}`;
      }
      
      showToast({ 
        type: 'error', 
        message: errorMessage,
        duration: 6000 // Longer duration for error messages
      });
    }
  };

  const downloadRawData = () => {
    const dataStr = JSON.stringify(cvData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cv-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast({ 
      type: 'success', 
      message: 'CV data downloaded successfully'
    });
  };

  const renderRawDataSection = () => (
    <div className="section-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="section-title mb-0">Raw CV Data</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={applyRawDataChanges}
            className="btn btn-sm bg-blue-900/50 text-blue-300 hover:bg-blue-900/70 flex items-center"
          >
            <Save size={14} className="mr-1" /> Apply Changes
          </button>
          <button
            type="button"
            onClick={downloadRawData}
            className="btn btn-sm bg-green-900/50 text-green-300 hover:bg-green-900/70 flex items-center"
          >
            <Download size={14} className="mr-1" /> Download JSON
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Edit the raw JSON data directly. Be careful with the syntax - invalid JSON will be rejected.
        </p>
        
        <textarea
          className="input-field w-full min-h-[800px] font-mono text-sm resize-y"
          value={rawDataText}
          onChange={(e) => handleRawDataChange(e.target.value)}
          placeholder="Loading CV data..."
          spellCheck={false}
          style={{ height: '800px' }}
        />
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>Use Ctrl+A to select all, Ctrl+C to copy</span>
          <span>Lines: {rawDataText.split('\n').length} | Characters: {rawDataText.length}</span>
        </div>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'personalInfo':
        return renderPersonalInfoSection();
      case 'summary':
        return renderSummarySection();
      case 'experience':
        return renderListSection('experience', 'Experience', renderExperienceItem);
      case 'education':
        return renderListSection('education', 'Education', renderEducationItem);
      case 'projectsHighlight':
        return renderListSection('projectsHighlight', 'Projects', renderProjectItem);
      case 'awards':
        return renderListSection('awards', 'Awards & Achievements', renderAwardItem);
      case 'skills':
        return renderSkillsSection();
      case 'volunteering':
        return renderListSection('volunteering', 'Volunteering', renderVolunteeringItem);
      case 'rawData':
        return renderRawDataSection();
      default:
        return <p>Select a section to edit</p>;
    }
  };

  const renderExperienceForm = () => (
    <>
      <div className="space-y-4">
        <div>
          <label className="form-label">Role/Position</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.role || ''}
            onChange={(e) => handleItemChange('role', e.target.value)}
            placeholder="e.g. Software Engineer"
            required
          />
        </div>
        <div>
          <label className="form-label">Company/Organization</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.company || ''}
            onChange={(e) => handleItemChange('company', e.target.value)}
            placeholder="e.g. Google"
            required
          />
        </div>
        <div>
          <label className="form-label">Time Period</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.period || ''}
            onChange={(e) => handleItemChange('period', e.target.value)}
            placeholder="e.g. Jan 2020 - Present"
          />
        </div>
        <div>
          <label className="form-label">Details</label>
          <textarea
            className="input-field h-32"
            value={currentItem.details || ''}
            onChange={(e) => handleItemChange('details', e.target.value)}
            placeholder="Describe your responsibilities and achievements..."
          />
          <p className="text-xs text-gray-400 mt-1">
            Use markdown-style formatting: lines starting with "- " will be shown as bullet points
          </p>
        </div>

        {/* Add this new field for logo */}
        <div>
          <label className="form-label">Company Logo URL (Optional)</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.logo || ''}
            onChange={(e) => handleItemChange('logo', e.target.value)}
            placeholder="e.g. https://example.com/company-logo.png"
          />
        </div>

      </div>
    </>
  );

  const renderEducationForm = () => (
    <>
      <div className="space-y-4">
        <div>
          <label className="form-label">Degree/Certificate</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.degree || ''}
            onChange={(e) => handleItemChange('degree', e.target.value)}
            placeholder="e.g. B.Sc. Computer Science"
            required
          />
        </div>
        <div>
          <label className="form-label">Institution</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.institution || ''}
            onChange={(e) => handleItemChange('institution', e.target.value)}
            placeholder="e.g. Stanford University"
            required
          />
        </div>
        <div>
          <label className="form-label">Time Period</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.period || ''}
            onChange={(e) => handleItemChange('period', e.target.value)}
            placeholder="e.g. 2018 - 2022"
          />
        </div>
        <div>
          <label className="form-label">Details (Optional)</label>
          <textarea
            className="input-field h-24"
            value={currentItem.details || ''}
            onChange={(e) => handleItemChange('details', e.target.value)}
            placeholder="Additional information about your education..."
          />
        </div>

        {/* Add this new field for logo */}
        <div>
          <label className="form-label">Logo URL (Optional)</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.logo || ''}
            onChange={(e) => handleItemChange('logo', e.target.value)}
            placeholder="e.g. https://example.com/logo.png"
          />
          <p className="text-xs text-gray-400 mt-1">
            Enter a URL for the institution's logo if available
          </p>
        </div>

      </div>
    </>
  );

  const renderProjectForm = () => (
    <>
      <div className="space-y-4">
        <div>
          <label className="form-label">Project Name</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.name || ''}
            onChange={(e) => handleItemChange('name', e.target.value)}
            placeholder="e.g. Portfolio Website"
            required
          />
        </div>
        <div>
          <label className="form-label">Time Period</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.period || ''}
            onChange={(e) => handleItemChange('period', e.target.value)}
            placeholder="e.g. Mar 2023 - Present"
          />
        </div>
        <div>
          <label className="form-label">Description</label>
          <textarea
            className="input-field h-32"
            value={currentItem.description || ''}
            onChange={(e) => handleItemChange('description', e.target.value)}
            placeholder="Describe your project..."
          />
          <p className="text-xs text-gray-400 mt-1">
            Use markdown-style formatting: lines starting with "- " will be shown as bullet points
          </p>
        </div>

        <div>
          <label className="form-label">Project Logo/Icon URL (Optional)</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.logo || ''}
            onChange={(e) => handleItemChange('logo', e.target.value)}
            placeholder="e.g. https://example.com/project-icon.png"
          />
          <p className="text-xs text-gray-400 mt-1">
            Enter a URL for the project's logo or icon if available
          </p>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="form-label mb-0">Links</label>
            <button
              type="button"
              onClick={addLink}
              className="btn btn-sm bg-gray-700 text-gray-200 hover:bg-gray-600 flex items-center"
            >
              <Plus size={14} className="mr-1" /> Add Link
            </button>
          </div>
          
          <div className="space-y-3">
            {currentItem.links?.map((link, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  className="input-field w-1/3"
                  placeholder="Text"
                  value={link.text || ''}
                  onChange={(e) => handleLinkChange(index, 'text', e.target.value)}
                />
                <input
                  type="text"
                  className="input-field flex-1"
                  placeholder="URL"
                  value={link.url || ''}
                  onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="btn btn-sm bg-red-900/50 text-red-300 hover:bg-red-900/70"
                  title="Remove Link"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const renderAwardForm = () => (
    <>
      <div className="space-y-4">
        <div>
          <label className="form-label">Award Name</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.name || ''}
            onChange={(e) => handleItemChange('name', e.target.value)}
            placeholder="e.g. Best Paper Award"
            required
          />
        </div>
        <div>
          <label className="form-label">Awarding Organization</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.awardingBody || ''}
            onChange={(e) => handleItemChange('awardingBody', e.target.value)}
            placeholder="e.g. ACM SIGCHI"
          />
        </div>
        <div>
          <label className="form-label">Date</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.date || ''}
            onChange={(e) => handleItemChange('date', e.target.value)}
            placeholder="e.g. May 2023"
          />
        </div>
        <div>
          <label className="form-label">Details (Optional)</label>
          <textarea
            className="input-field h-24"
            value={currentItem.details || ''}
            onChange={(e) => handleItemChange('details', e.target.value)}
            placeholder="Additional information about the award..."
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="form-label mb-0">Links (Optional)</label>
            <button
              type="button"
              onClick={addLink}
              className="btn btn-sm bg-gray-700 text-gray-200 hover:bg-gray-600 flex items-center"
            >
              <Plus size={14} className="mr-1" /> Add Link
            </button>
          </div>

          <div className="space-y-3">
            {currentItem.links?.map((link, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  className="input-field w-1/3"
                  placeholder="Text"
                  value={link.text || ''}
                  onChange={(e) => handleLinkChange(index, 'text', e.target.value)}
                />
                <input
                  type="text"
                  className="input-field flex-1"
                  placeholder="URL"
                  value={link.url || ''}
                  onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="btn btn-sm bg-red-900/50 text-red-300 hover:bg-red-900/70"
                  title="Remove Link"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const renderSkillForm = () => (
    <>
      <div className="space-y-4">
        <div>
          <label className="form-label">Skill Name</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.name || ''}
            onChange={(e) => handleItemChange('name', e.target.value)}
            placeholder="e.g. JavaScript"
            required
          />
        </div>
        <div>
          <label className="form-label">Proficiency Level (0-100%)</label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            className="w-full accent-primary"
            value={currentItem.level || 50}
            onChange={(e) => handleItemChange('level', parseInt(e.target.value))}
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Beginner</span>
            <span>{currentItem.level || 50}%</span>
            <span>Expert</span>
          </div>
        </div>
      </div>
    </>
  );

  const renderVolunteeringForm = () => (
    <>
      <div className="space-y-4">
        <div>
          <label className="form-label">Role/Position</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.role || ''}
            onChange={(e) => handleItemChange('role', e.target.value)}
            placeholder="e.g. Volunteer Coordinator"
            required
          />
        </div>
        <div>
          <label className="form-label">Organization</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.organization || ''}
            onChange={(e) => handleItemChange('organization', e.target.value)}
            placeholder="e.g. Red Cross"
            required
          />
        </div>
        <div>
          <label className="form-label">Time Period</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.period || ''}
            onChange={(e) => handleItemChange('period', e.target.value)}
            placeholder="e.g. Jun 2021 - Present"
          />
        </div>
        <div>
          <label className="form-label">Details</label>
          <textarea
            className="input-field h-32"
            value={currentItem.details || ''}
            onChange={(e) => handleItemChange('details', e.target.value)}
            placeholder="Describe your responsibilities and achievements..."
          />
          <p className="text-xs text-gray-400 mt-1">
            Use markdown-style formatting: lines starting with "- " will be shown as bullet points
          </p>
        </div>

        {/* Add this new field for logo */}
        <div>
          <label className="form-label">Organization Logo URL (Optional)</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.logo || ''}
            onChange={(e) => handleItemChange('logo', e.target.value)}
            placeholder="e.g. https://example.com/org-logo.png"
          />
        </div>

      </div>
    </>
  );

  const renderLanguageForm = () => (
    <>
      <div className="space-y-4">
        <div>
          <label className="form-label">Language</label>
          <input
            type="text"
            className="input-field"
            value={currentItem.name || ''}
            onChange={(e) => handleItemChange('name', e.target.value)}
            placeholder="e.g. English"
            required
          />
        </div>
        <div>
          <label className="form-label">Proficiency Level</label>
          <select
            className="input-field"
            value={currentItem.level || ''}
            onChange={(e) => handleItemChange('level', e.target.value)}
            required
          >
            <option value="">Select Level</option>
            <option value="A1">A1 (Beginner)</option>
            <option value="A2">A2 (Elementary)</option>
            <option value="B1">B1 (Intermediate)</option>
            <option value="B2">B2 (Upper Intermediate)</option>
            <option value="C1">C1 (Advanced)</option>
            <option value="C2">C2 (Proficient)</option>
            <option value="Native">Native</option>
          </select>
        </div>
      </div>
    </>
  );

  const renderFormForSection = () => {
    if (!currentSectionKey || !currentItem) return null;
    
    switch(currentSectionKey) {
      case 'experience':
        return renderExperienceForm();
      case 'education':
        return renderEducationForm();
      case 'projectsHighlight':
        return renderProjectForm();
      case 'awards':
        return renderAwardForm();
      case 'skills':
        return renderSkillForm();
      case 'volunteering':
        return renderVolunteeringForm();
      case 'languages':
        return renderLanguageForm();
      default:
        return <p>Unknown section type</p>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-mode-primary">CV Editor</h2>
        <button 
          onClick={saveCV} 
          className="btn btn-primary flex items-center"
          disabled={saving}
        >
          {saving ? <Spinner size="h-5 w-5" /> : <><Save size={18} className="mr-2" /> Save All Changes</>}
        </button>
      </div>

      {renderSectionNav()}
      {renderActiveSection()}

      {/* Edit Item Modal */}
      {showItemModal && currentItem && (
        <Modal 
          title={`${currentItem.id ? 'Edit' : 'Add'} ${currentSectionKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`}
          onClose={() => setShowItemModal(false)}
        >
          {renderFormForSection()}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setShowItemModal(false)}
              className="btn text-gray-300 bg-gray-700 hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleItemSave}
              className="btn btn-primary flex items-center"
            >
              <Save size={16} className="mr-1" /> Save
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CVEditor;