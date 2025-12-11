import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const LinksField = ({ links = [], onChange, onAdd, onRemove, label = 'Links' }) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <label className="form-label mb-0">{label}</label>
      <button type="button" onClick={onAdd} className="cv-btn-secondary">
        <Plus size={14} className="mr-1" /> Add Link
      </button>
    </div>
    <div className="space-y-3">
      {links.map((link, index) => (
        <div key={index} className="flex space-x-2">
          <input
            type="text"
            className="input-field w-1/3"
            placeholder="Text"
            value={link.text || ''}
            onChange={(e) => onChange(index, 'text', e.target.value)}
          />
          <input
            type="text"
            className="input-field flex-1"
            placeholder="URL"
            value={link.url || ''}
            onChange={(e) => onChange(index, 'url', e.target.value)}
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="btn btn-sm bg-red-900/50 text-red-300 hover:bg-red-900/70"
            title="Remove Link"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

const ExperienceForm = ({ item, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="form-label">Role/Position</label>
      <input
        type="text"
        className="input-field"
        value={item.role || ''}
        onChange={(e) => onChange('role', e.target.value)}
        placeholder="e.g. Software Engineer"
        required
      />
    </div>
    <div>
      <label className="form-label">Company/Organization</label>
      <input
        type="text"
        className="input-field"
        value={item.company || ''}
        onChange={(e) => onChange('company', e.target.value)}
        placeholder="e.g. Google"
        required
      />
    </div>
    <div>
      <label className="form-label">Time Period</label>
      <input
        type="text"
        className="input-field"
        value={item.period || ''}
        onChange={(e) => onChange('period', e.target.value)}
        placeholder="e.g. Jan 2020 - Present"
      />
    </div>
    <div>
      <label className="form-label">Details</label>
      <textarea
        className="input-field h-32"
        value={item.details || ''}
        onChange={(e) => onChange('details', e.target.value)}
        placeholder="Describe your responsibilities and achievements..."
      />
      <p className="text-xs text-gray-400 mt-1">Use lines starting with "- " for bullet points</p>
    </div>
    <div>
      <label className="form-label">Company Logo URL (Optional)</label>
      <input
        type="text"
        className="input-field"
        value={item.logo || ''}
        onChange={(e) => onChange('logo', e.target.value)}
        placeholder="e.g. https://example.com/company-logo.png"
      />
    </div>
  </div>
);

const EducationForm = ({ item, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="form-label">Degree/Certificate</label>
      <input
        type="text"
        className="input-field"
        value={item.degree || ''}
        onChange={(e) => onChange('degree', e.target.value)}
        placeholder="e.g. B.Sc. Computer Science"
        required
      />
    </div>
    <div>
      <label className="form-label">Institution</label>
      <input
        type="text"
        className="input-field"
        value={item.institution || ''}
        onChange={(e) => onChange('institution', e.target.value)}
        placeholder="e.g. Stanford University"
        required
      />
    </div>
    <div>
      <label className="form-label">Time Period</label>
      <input
        type="text"
        className="input-field"
        value={item.period || ''}
        onChange={(e) => onChange('period', e.target.value)}
        placeholder="e.g. 2018 - 2022"
      />
    </div>
    <div>
      <label className="form-label">Details (Optional)</label>
      <textarea
        className="input-field h-24"
        value={item.details || ''}
        onChange={(e) => onChange('details', e.target.value)}
        placeholder="Additional information about your education..."
      />
    </div>
    <div>
      <label className="form-label">Logo URL (Optional)</label>
      <input
        type="text"
        className="input-field"
        value={item.logo || ''}
        onChange={(e) => onChange('logo', e.target.value)}
        placeholder="e.g. https://example.com/logo.png"
      />
      <p className="text-xs text-gray-400 mt-1">Enter a URL for the institution's logo if available</p>
    </div>
  </div>
);

const ProjectForm = ({ item, onChange, onLinkChange, onAddLink, onRemoveLink }) => (
  <div className="space-y-4">
    <div>
      <label className="form-label">Project Name</label>
      <input
        type="text"
        className="input-field"
        value={item.name || ''}
        onChange={(e) => onChange('name', e.target.value)}
        placeholder="e.g. Portfolio Website"
        required
      />
    </div>
    <div>
      <label className="form-label">Time Period</label>
      <input
        type="text"
        className="input-field"
        value={item.period || ''}
        onChange={(e) => onChange('period', e.target.value)}
        placeholder="e.g. Mar 2023 - Present"
      />
    </div>
    <div>
      <label className="form-label">Description</label>
      <textarea
        className="input-field h-32"
        value={item.description || ''}
        onChange={(e) => onChange('description', e.target.value)}
        placeholder="Describe your project..."
      />
    </div>
    <div>
      <label className="form-label">Project Logo/Icon URL (Optional)</label>
      <input
        type="text"
        className="input-field"
        value={item.logo || ''}
        onChange={(e) => onChange('logo', e.target.value)}
        placeholder="e.g. https://example.com/project-icon.png"
      />
      <p className="text-xs text-gray-400 mt-1">Enter a URL for the project's logo or icon if available</p>
    </div>
    <LinksField links={item.links || []} onChange={onLinkChange} onAdd={onAddLink} onRemove={onRemoveLink} />
  </div>
);

const AwardForm = ({ item, onChange, onLinkChange, onAddLink, onRemoveLink }) => (
  <div className="space-y-4">
    <div>
      <label className="form-label">Award Name</label>
      <input
        type="text"
        className="input-field"
        value={item.name || ''}
        onChange={(e) => onChange('name', e.target.value)}
        placeholder="e.g. Best Paper Award"
        required
      />
    </div>
    <div>
      <label className="form-label">Awarding Organization</label>
      <input
        type="text"
        className="input-field"
        value={item.awardingBody || ''}
        onChange={(e) => onChange('awardingBody', e.target.value)}
        placeholder="e.g. ACM SIGCHI"
      />
    </div>
    <div>
      <label className="form-label">Date</label>
      <input
        type="text"
        className="input-field"
        value={item.date || ''}
        onChange={(e) => onChange('date', e.target.value)}
        placeholder="e.g. May 2023"
      />
    </div>
    <div>
      <label className="form-label">Details (Optional)</label>
      <textarea
        className="input-field h-24"
        value={item.details || ''}
        onChange={(e) => onChange('details', e.target.value)}
        placeholder="Additional information about the award..."
      />
    </div>
    <div>
      <label className="form-label">Logo URL (Optional)</label>
      <input
        type="text"
        className="input-field"
        value={item.logo || ''}
        onChange={(e) => onChange('logo', e.target.value)}
        placeholder="e.g. https://example.com/logo.png"
      />
      <p className="text-xs text-gray-400 mt-1">Enter a URL for the awarding organization's logo if available</p>
    </div>
    <LinksField
      links={item.links || []}
      onChange={onLinkChange}
      onAdd={onAddLink}
      onRemove={onRemoveLink}
      label="Links (Optional)"
    />
  </div>
);

const SkillForm = ({ item, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="form-label">Skill Name</label>
      <input
        type="text"
        className="input-field"
        value={item.name || ''}
        onChange={(e) => onChange('name', e.target.value)}
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
        value={item.level ?? 50}
        onChange={(e) => onChange('level', parseInt(e.target.value, 10))}
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>Beginner</span>
        <span>{item.level ?? 50}%</span>
        <span>Expert</span>
      </div>
    </div>
  </div>
);

const VolunteeringForm = ({ item, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="form-label">Role/Position</label>
      <input
        type="text"
        className="input-field"
        value={item.role || ''}
        onChange={(e) => onChange('role', e.target.value)}
        placeholder="e.g. Volunteer Coordinator"
        required
      />
    </div>
    <div>
      <label className="form-label">Organization</label>
      <input
        type="text"
        className="input-field"
        value={item.organization || ''}
        onChange={(e) => onChange('organization', e.target.value)}
        placeholder="e.g. Red Cross"
        required
      />
    </div>
    <div>
      <label className="form-label">Time Period</label>
      <input
        type="text"
        className="input-field"
        value={item.period || ''}
        onChange={(e) => onChange('period', e.target.value)}
        placeholder="e.g. Jun 2021 - Present"
      />
    </div>
    <div>
      <label className="form-label">Details</label>
      <textarea
        className="input-field h-32"
        value={item.details || ''}
        onChange={(e) => onChange('details', e.target.value)}
        placeholder="Describe your responsibilities and achievements..."
      />
      <p className="text-xs text-gray-400 mt-1">Use lines starting with "- " for bullet points</p>
    </div>
    <div>
      <label className="form-label">Organization Logo URL (Optional)</label>
      <input
        type="text"
        className="input-field"
        value={item.logo || ''}
        onChange={(e) => onChange('logo', e.target.value)}
        placeholder="e.g. https://example.com/org-logo.png"
      />
    </div>
  </div>
);

const LanguageForm = ({ item, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="form-label">Language</label>
      <input
        type="text"
        className="input-field"
        value={item.name || ''}
        onChange={(e) => onChange('name', e.target.value)}
        placeholder="e.g. English"
        required
      />
    </div>
    <div>
      <label className="form-label">Proficiency</label>
      <select
        className="input-field"
        value={item.level || ''}
        onChange={(e) => onChange('level', e.target.value)}
      >
        <option value="">Select level</option>
        <option value="Native / Bilingual">Native / Bilingual</option>
        <option value="Fluent">Fluent</option>
        <option value="Professional">Professional</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Basic">Basic</option>
      </select>
    </div>
  </div>
);

const ItemForms = ({ sectionKey, item, onChange, onLinkChange, onAddLink, onRemoveLink }) => {
  if (!sectionKey || !item) return null;

  switch (sectionKey) {
    case 'experience':
      return <ExperienceForm item={item} onChange={onChange} />;
    case 'education':
      return <EducationForm item={item} onChange={onChange} />;
    case 'projectsHighlight':
      return (
        <ProjectForm
          item={item}
          onChange={onChange}
          onLinkChange={onLinkChange}
          onAddLink={onAddLink}
          onRemoveLink={onRemoveLink}
        />
      );
    case 'awards':
      return (
        <AwardForm
          item={item}
          onChange={onChange}
          onLinkChange={onLinkChange}
          onAddLink={onAddLink}
          onRemoveLink={onRemoveLink}
        />
      );
    case 'skills':
      return <SkillForm item={item} onChange={onChange} />;
    case 'volunteering':
      return <VolunteeringForm item={item} onChange={onChange} />;
    case 'languages':
      return <LanguageForm item={item} onChange={onChange} />;
    default:
      return <p>Unknown section type</p>;
  }
};

export default ItemForms;
