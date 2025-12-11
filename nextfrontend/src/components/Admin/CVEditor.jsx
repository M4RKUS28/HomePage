import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../hooks/useTheme';
import Spinner from '../UI/Spinner';
import {
  Save,
  RefreshCw,
  Award,
  Briefcase,
  GraduationCap,
  Code,
  User,
  Link,
  Users,
  Zap,
  Globe2,
} from 'lucide-react';
import { getCVDataApi, updateCVDataApi } from '../../api/cv';
import CVSectionNav from './CVEditorParts/CVSectionNav';
import PersonalInfoSection from './CVEditorParts/PersonalInfoSection';
import SummarySection from './CVEditorParts/SummarySection';
import ListSection from './CVEditorParts/ListSection';
import SkillsSection from './CVEditorParts/SkillsSection';
import RawDataSection from './CVEditorParts/RawDataSection';
import EditItemModal from './CVEditorParts/EditItemModal';
import ItemForms from './CVEditorParts/ItemForms';

const navItems = [
  { key: 'personalInfo', label: 'Personal', icon: User },
  { key: 'summary', label: 'Summary', icon: User },
  { key: 'skills', label: 'Skills', icon: Zap },
  { key: 'experience', label: 'Experience', icon: Briefcase },
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'projectsHighlight', label: 'Projects', icon: Code },
  { key: 'awards', label: 'Awards', icon: Award },
  { key: 'volunteering', label: 'Volunteering', icon: Users },
  { key: 'languages', label: 'Languages', icon: Globe2 },
  { key: 'rawData', label: 'Raw Data', icon: Code },
];

const defaultCVData = {
  summary: '',
  personalInfo: {
    name: '',
    title: '',
    profileImage: '',
    headerText: '',
    socialLinks: [],
  },
  experience: [],
  education: [],
  projectsHighlight: [],
  awards: [],
  skills: [],
  volunteering: [],
  languages: [],
};

const normalizeSection = (items, sectionKey, mapper) => {
  const safeItems = Array.isArray(items) ? items : [];

  return safeItems.map((item = {}, index) => {
    const baseItem = {
      id: item.id ?? `${sectionKey}-${index}-${Date.now()}`,
      position: index,
      ...item,
    };

    const mapped = mapper ? mapper(baseItem, index) : baseItem;
    return { ...mapped, position: index };
  });
};

const normalizeLinks = (links) => {
  if (!Array.isArray(links)) return [];
  return links.map((link = {}) => ({ text: link.text || '', url: link.url || '' }));
};

const normalizeCVData = (data) => {
  const safeData = data || defaultCVData;

  const personalInfo = {
    name: safeData.personalInfo?.name || '',
    title: safeData.personalInfo?.title || '',
    profileImage: safeData.personalInfo?.profileImage || '',
    headerText: safeData.personalInfo?.headerText || '',
    socialLinks: Array.isArray(safeData.personalInfo?.socialLinks)
      ? safeData.personalInfo.socialLinks.map((link = {}) => ({
          platform: link.platform || '',
          url: link.url || '',
        }))
      : [],
  };

  return {
    summary: safeData.summary || '',
    personalInfo,
    experience: normalizeSection(safeData.experience, 'experience', (item) => ({
      ...item,
      role: item.role || '',
      company: item.company || '',
      period: item.period || '',
      details: item.details || '',
    })),
    education: normalizeSection(safeData.education, 'education', (item) => ({
      ...item,
      degree: item.degree || '',
      institution: item.institution || '',
      period: item.period || '',
      details: item.details || '',
      logo: item.logo || '',
    })),
    projectsHighlight: normalizeSection(safeData.projectsHighlight, 'projectsHighlight', (item) => ({
      ...item,
      name: item.name || '',
      period: item.period || '',
      description: item.description || '',
      logo: item.logo || '',
      links: normalizeLinks(item.links),
    })),
    awards: normalizeSection(safeData.awards, 'awards', (item) => ({
      ...item,
      name: item.name || '',
      date: item.date || '',
      awardingBody: item.awardingBody || '',
      details: item.details || '',
      logo: item.logo || '',
      links: normalizeLinks(item.links),
    })),
    skills: normalizeSection(safeData.skills, 'skills', (item) => ({
      ...item,
      name: item.name || '',
      level: typeof item.level === 'number' ? item.level : Number(item.level) || 0,
    })),
    volunteering: normalizeSection(safeData.volunteering, 'volunteering', (item) => ({
      ...item,
      role: item.role || '',
      organization: item.organization || '',
      period: item.period || '',
      details: item.details || '',
      logo: item.logo || '',
    })),
    languages: normalizeSection(safeData.languages, 'languages', (item) => ({
      ...item,
      name: item.name || '',
      level: item.level || 'Fluent',
    })),
  };
};

const buildNewItem = (sectionKey, position = 0) => {
  switch (sectionKey) {
    case 'experience':
      return { id: Date.now(), position, role: '', company: '', period: '', details: '' };
    case 'education':
      return { id: Date.now(), position, degree: '', institution: '', period: '', details: '', logo: '' };
    case 'projectsHighlight':
      return { id: Date.now(), position, name: '', period: '', description: '', links: [], logo: '' };
    case 'awards':
      return { id: Date.now(), position, name: '', date: '', awardingBody: '', details: '', links: [], logo: '' };
    case 'skills':
      return { id: Date.now(), position, name: '', level: 50 };
    case 'volunteering':
      return { id: Date.now(), position, role: '', organization: '', period: '', details: '', logo: '' };
    case 'languages':
      return { id: Date.now(), position, name: '', level: 'Fluent' };
    default:
      return { id: Date.now(), position };
  }
};

const reorderList = (items, fromIndex, toIndex) => {
  const list = [...items];
  const [moved] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, moved);
  return list.map((item, idx) => ({ ...item, position: idx }));
};

const CVEditor = () => {
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [cvData, setCVData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('summary');
  const [rawDataText, setRawDataText] = useState('');
  const [modalState, setModalState] = useState({ open: false, sectionKey: null });
  const [currentItem, setCurrentItem] = useState(null);

  const setNormalizedData = (data) => {
    const normalized = normalizeCVData(data);
    setCVData(normalized);
    setRawDataText(JSON.stringify(normalized, null, 2));
  };

  const fetchCVData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCVDataApi();
      setNormalizedData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching CV data:', err);
      setError('Failed to load CV data. Please try again.');
      setNormalizedData(defaultCVData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCVData();
  }, [fetchCVData]);

  const saveCV = async () => {
    if (!cvData) return;
    setSaving(true);
    try {
      const normalized = normalizeCVData(cvData);
      setNormalizedData(normalized);
      await updateCVDataApi(normalized);
      showToast({ type: 'success', message: 'CV data saved successfully' });
    } catch (err) {
      console.error('Error saving CV data:', err);
      showToast({ type: 'error', message: 'Failed to save CV data. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const updatePersonalInfo = (field, value) => {
    setCVData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  const updateSummary = (value) => {
    setCVData((prev) => ({ ...prev, summary: value }));
  };

  const updateSocialLink = (index, field, value) => {
    setCVData((prev) => {
      const links = [...(prev.personalInfo.socialLinks || [])];
      links[index] = { ...links[index], [field]: value };
      return { ...prev, personalInfo: { ...prev.personalInfo, socialLinks: links } };
    });
  };

  const addSocialLink = () => {
    setCVData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        socialLinks: [...(prev.personalInfo.socialLinks || []), { platform: '', url: '' }],
      },
    }));
  };

  const removeSocialLink = (index) => {
    setCVData((prev) => {
      const links = [...(prev.personalInfo.socialLinks || [])];
      links.splice(index, 1);
      return { ...prev, personalInfo: { ...prev.personalInfo, socialLinks: links } };
    });
  };

  const openItemModal = (sectionKey, item) => {
    setModalState({ open: true, sectionKey });
    setCurrentItem(item);
  };

  const addItem = (sectionKey) => {
    const currentItems = cvData?.[sectionKey] || [];
    const newItem = buildNewItem(sectionKey, currentItems.length);
    openItemModal(sectionKey, newItem);
  };

  const editItem = (sectionKey, item) => {
    openItemModal(sectionKey, { ...item });
  };

  const closeModal = () => {
    setModalState({ open: false, sectionKey: null });
    setCurrentItem(null);
  };

  const mutateAndSync = async (producer, successMessage) => {
    const nextData = normalizeCVData(producer(cvData));
    setNormalizedData(nextData);
    try {
      await updateCVDataApi(nextData);
      showToast({ type: 'success', message: successMessage });
    } catch (err) {
      console.error('Error syncing CV data:', err);
      showToast({
        type: 'error',
        message: `${successMessage} locally, but sync failed. Try "Save All Changes" manually.`,
      });
    }
  };

  const handleItemSave = async () => {
    if (!currentItem || !modalState.sectionKey) return;

    await mutateAndSync(
      (prev) => {
        const list = [...(prev[modalState.sectionKey] || [])];
        const existingIndex = list.findIndex((item) => item.id === currentItem.id);
        if (existingIndex >= 0) {
          list[existingIndex] = currentItem;
        } else {
          list.push(currentItem);
        }
        return { ...prev, [modalState.sectionKey]: list };
      },
      'Item saved and synced successfully'
    );

    closeModal();
  };

  const removeItem = async (sectionKey, itemId) => {
    if (!window.confirm('Are you sure you want to remove this item?')) return;

    await mutateAndSync(
      (prev) => ({
        ...prev,
        [sectionKey]: (prev[sectionKey] || []).filter((item, idx) => item.id !== itemId && `${sectionKey}-${idx}` !== itemId),
      }),
      'Item removed and synced successfully'
    );
  };

  const moveItem = async (sectionKey, itemId, direction) => {
    const items = cvData?.[sectionKey] || [];
    const currentIndex = items.findIndex((item, idx) => item.id === itemId || `${sectionKey}-${idx}` === itemId);
    if (currentIndex < 0) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    await mutateAndSync(
      (prev) => ({
        ...prev,
        [sectionKey]: reorderList(prev[sectionKey] || [], currentIndex, targetIndex),
      }),
      'Item reordered and synced successfully'
    );
  };

  const handleItemChange = (field, value) => {
    setCurrentItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleLinkChange = (index, field, value) => {
    setCurrentItem((prev) => {
      const links = [...(prev.links || [])];
      links[index] = { ...links[index], [field]: value };
      return { ...prev, links };
    });
  };

  const addLink = () => {
    setCurrentItem((prev) => ({ ...prev, links: [...(prev.links || []), { text: '', url: '' }] }));
  };

  const removeLink = (index) => {
    setCurrentItem((prev) => {
      const links = [...(prev.links || [])];
      links.splice(index, 1);
      return { ...prev, links };
    });
  };

  const applyRawDataChanges = () => {
    try {
      const trimmed = rawDataText.trim();
      if (!trimmed) {
        showToast({ type: 'error', message: 'JSON data cannot be empty' });
        return;
      }

      const parsed = JSON.parse(trimmed);
      setNormalizedData(parsed);
      showToast({ type: 'success', message: 'Raw data applied successfully' });
    } catch (err) {
      let errorMessage = 'Invalid JSON format';
      if (err.message.includes('Unexpected token')) {
        errorMessage = `JSON Syntax Error: ${err.message}`;
      } else if (err.message.includes('Unexpected end')) {
        errorMessage = 'JSON Error: Unexpected end of data - missing closing bracket or quote';
      }
      showToast({ type: 'error', message: errorMessage, duration: 6000 });
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
    showToast({ type: 'success', message: 'CV data downloaded successfully' });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="h-12 w-12" />
      </div>
    );
  }

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

  const renderExperienceItem = (item) => (
    <>
      <div className="flex justify-between">
        <h4 className="cv-title">{item.role || 'Untitled Role'}</h4>
        <span className="cv-subtitle">{item.period || 'No Date'}</span>
      </div>
      <div className="text-primary">{item.company || 'Untitled Company'}</div>
      <div className="cv-text mt-2">{item.details || 'No details'}</div>
    </>
  );

  const renderEducationItem = (item) => (
    <>
      <div className="flex justify-between">
        <div className="flex items-center">
          {item.logo && (
            <img
              src={item.logo}
              alt={`${item.institution} logo`}
              className="w-8 h-8 object-contain mr-3 rounded"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <h4 className="cv-title">{item.degree || 'Untitled Degree'}</h4>
        </div>
        <span className="cv-subtitle">{item.period || 'No Date'}</span>
      </div>
      <div className="text-primary">{item.institution || 'Untitled Institution'}</div>
      {item.details && <div className="cv-text mt-2">{item.details}</div>}
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
          <h4 className="cv-title">{item.name || 'Untitled Project'}</h4>
        </div>
        <span className="cv-subtitle">{item.period || 'No Date'}</span>
      </div>
      <div className="cv-text mt-2">{item.description || 'No description'}</div>
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
              <Link size={12} className="mr-1" /> {link.text || 'Link'}
            </a>
          ))}
        </div>
      )}
    </>
  );

  const renderAwardItem = (item) => (
    <>
      <div className="flex justify-between">
        <div className="flex items-center">
          {item.logo && (
            <img
              src={item.logo}
              alt={`${item.awardingBody} logo`}
              className="w-8 h-8 object-contain mr-3 rounded"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <h4 className="cv-title">{item.name || 'Untitled Award'}</h4>
        </div>
        <span className="cv-subtitle">{item.date || 'No Date'}</span>
      </div>
      <div className="text-primary">{item.awardingBody || 'Untitled Organization'}</div>
      {item.details && <div className="cv-text mt-2">{item.details}</div>}
      {item.links && item.links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {item.links.map((link, idx) => (
            <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="cv-tag">
              <Link size={12} className="mr-1" /> {link.text || 'Link'}
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
          <h4 className="text-lg font-medium text-white">{item.role || 'Untitled Role'}</h4>
        </div>
        <span className="text-sm text-gray-400">{item.period || 'No Date'}</span>
      </div>
      <div className="text-primary">{item.organization || 'Untitled Organization'}</div>
      <div className="mt-2 text-sm text-gray-300 whitespace-pre-line">{item.details || 'No details'}</div>
    </>
  );

  const renderLanguageItem = (item) => (
    <>
      <div className="flex justify-between items-center">
        <h4 className="cv-title">{item.name || 'Untitled Language'}</h4>
        <span className="cv-subtitle">{item.level || 'No Level'}</span>
      </div>
    </>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'personalInfo':
        return (
          <PersonalInfoSection
            personalInfo={cvData.personalInfo}
            onChange={updatePersonalInfo}
            onAddSocialLink={addSocialLink}
            onSocialLinkChange={updateSocialLink}
            onRemoveSocialLink={removeSocialLink}
            theme={theme}
          />
        );
      case 'summary':
        return <SummarySection summary={cvData.summary} onChange={updateSummary} />;
      case 'experience':
        return (
          <ListSection
            sectionKey="experience"
            title="Experience"
            items={cvData.experience}
            renderItem={renderExperienceItem}
            onAdd={addItem}
            onMoveUp={(key, id) => moveItem(key, id, 'up')}
            onMoveDown={(key, id) => moveItem(key, id, 'down')}
            onEdit={editItem}
            onRemove={removeItem}
            theme={theme}
          />
        );
      case 'education':
        return (
          <ListSection
            sectionKey="education"
            title="Education"
            items={cvData.education}
            renderItem={renderEducationItem}
            onAdd={addItem}
            onMoveUp={(key, id) => moveItem(key, id, 'up')}
            onMoveDown={(key, id) => moveItem(key, id, 'down')}
            onEdit={editItem}
            onRemove={removeItem}
            theme={theme}
          />
        );
      case 'projectsHighlight':
        return (
          <ListSection
            sectionKey="projectsHighlight"
            title="Projects"
            items={cvData.projectsHighlight}
            renderItem={renderProjectItem}
            onAdd={addItem}
            onMoveUp={(key, id) => moveItem(key, id, 'up')}
            onMoveDown={(key, id) => moveItem(key, id, 'down')}
            onEdit={editItem}
            onRemove={removeItem}
            theme={theme}
          />
        );
      case 'awards':
        return (
          <ListSection
            sectionKey="awards"
            title="Awards & Achievements"
            items={cvData.awards}
            renderItem={renderAwardItem}
            onAdd={addItem}
            onMoveUp={(key, id) => moveItem(key, id, 'up')}
            onMoveDown={(key, id) => moveItem(key, id, 'down')}
            onEdit={editItem}
            onRemove={removeItem}
            theme={theme}
          />
        );
      case 'skills':
        return (
          <SkillsSection
            skills={cvData.skills}
            theme={theme}
            onAdd={() => addItem('skills')}
            onEdit={(item) => editItem('skills', item)}
            onRemove={(id) => removeItem('skills', id)}
          />
        );
      case 'volunteering':
        return (
          <ListSection
            sectionKey="volunteering"
            title="Volunteering"
            items={cvData.volunteering}
            renderItem={renderVolunteeringItem}
            onAdd={addItem}
            onMoveUp={(key, id) => moveItem(key, id, 'up')}
            onMoveDown={(key, id) => moveItem(key, id, 'down')}
            onEdit={editItem}
            onRemove={removeItem}
            theme={theme}
          />
        );
      case 'languages':
        return (
          <ListSection
            sectionKey="languages"
            title="Languages"
            items={cvData.languages}
            renderItem={renderLanguageItem}
            onAdd={addItem}
            onMoveUp={(key, id) => moveItem(key, id, 'up')}
            onMoveDown={(key, id) => moveItem(key, id, 'down')}
            onEdit={editItem}
            onRemove={removeItem}
            theme={theme}
          />
        );
      case 'rawData':
        return (
          <RawDataSection
            rawDataText={rawDataText}
            onChange={setRawDataText}
            onApply={applyRawDataChanges}
            onDownload={downloadRawData}
          />
        );
      default:
        return <p>Select a section to edit</p>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-mode-primary">CV Editor</h2>
        <button onClick={saveCV} className="btn btn-primary flex items-center" disabled={saving}>
          {saving ? (
            <Spinner size="h-5 w-5" />
          ) : (
            <>
              <Save size={18} className="mr-2" /> Save All Changes
            </>
          )}
        </button>
      </div>

      <CVSectionNav activeSection={activeSection} onChange={setActiveSection} navItems={navItems} />
      {renderActiveSection()}

      <EditItemModal
        show={modalState.open && !!currentItem}
        title={`${currentItem?.id ? 'Edit' : 'Add'} ${
          modalState.sectionKey
            ? modalState.sectionKey.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
            : ''
        }`}
        onClose={closeModal}
        onSave={handleItemSave}
      >
        <ItemForms
          sectionKey={modalState.sectionKey}
          item={currentItem}
          onChange={handleItemChange}
          onLinkChange={handleLinkChange}
          onAddLink={addLink}
          onRemoveLink={removeLink}
        />
      </EditItemModal>
    </div>
  );
};

export default CVEditor;
