import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

const SkillsSection = ({ skills, theme, onAdd, onEdit, onRemove }) => {
  return (
    <div className="section-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="section-title mb-0">Skills</h3>
        <button type="button" onClick={onAdd} className="btn btn-sm btn-primary flex items-center">
          <Plus size={14} className="mr-1" /> Add Skill
        </button>
      </div>

      {skills?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((skill) => (
            <div
              key={skill.id || skill.name}
              className={`cv-item-card border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-md p-4`}
            >
              <div className="flex justify-between items-center">
                <span className="cv-title">{skill.name || 'Untitled Skill'}</span>
                <span className="text-primary text-sm">{skill.level}%</span>
              </div>
              <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                <div className="bg-primary h-full rounded-full" style={{ width: `${skill.level}%` }}></div>
              </div>
              <div className="flex justify-end space-x-2 mt-3">
                <button
                  type="button"
                  onClick={() => onEdit(skill)}
                  className={`btn btn-sm flex items-center ${
                    theme === 'dark'
                      ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  <Edit size={14} className="mr-1" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(skill.id)}
                  className={`btn btn-sm flex items-center ${
                    theme === 'dark'
                      ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
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
};

export default SkillsSection;
