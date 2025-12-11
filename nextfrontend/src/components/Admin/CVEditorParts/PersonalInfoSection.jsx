import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const PersonalInfoSection = ({
  personalInfo,
  onChange,
  onAddSocialLink,
  onSocialLinkChange,
  onRemoveSocialLink,
  theme
}) => {
  return (
    <div className="section-card">
      <h3 className="section-title">Personal Information</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="form-label">Name</label>
            <input
              type="text"
              className="input-field"
              value={personalInfo?.name || ''}
              onChange={(e) => onChange('name', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Title/Headline</label>
            <input
              type="text"
              className="input-field"
              value={personalInfo?.title || ''}
              onChange={(e) => onChange('title', e.target.value)}
            />
            <p className="cv-hint-text">This appears under your name in the hero section</p>
          </div>
        </div>

        <div>
          <label className="form-label">Profile Image URL</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <input
                type="url"
                className="input-field"
                value={personalInfo?.profileImage || ''}
                onChange={(e) => onChange('profileImage', e.target.value)}
                placeholder="https://example.com/your-profile-image.jpg"
              />
              {personalInfo?.profileImage && (
                <div className="w-full max-w-[250px]">
                  <img
                    src={personalInfo.profileImage}
                    alt="Profile preview"
                    className="w-full h-auto aspect-square object-cover rounded-lg border border-gray-300"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <p className="cv-text">
                This image will appear in the hero section of your portfolio.
                <br />
                <br />
                • Enter a direct URL to your profile image
                <br />
                • Works best with imgur, GitHub, or direct CDN links
                <br />
                • Base64 data URLs also supported
                <br />
                • Recommended: Square image, at least 300x300 pixels
                <br />
                • Supported formats: JPG, PNG, GIF, WebP
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="form-label">Header Text</label>
          <input
            type="text"
            className="input-field"
            value={personalInfo?.headerText || ''}
            onChange={(e) => onChange('headerText', e.target.value)}
          />
          <p className="cv-hint-text">This appears in the top-left corner of the site (currently "M4RKUS28")</p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="form-label mb-0">Social Links</label>
            <button type="button" onClick={onAddSocialLink} className="cv-btn-secondary">
              <Plus size={14} className="mr-1" /> Add Link
            </button>
          </div>

          <div className="space-y-3">
            {personalInfo?.socialLinks?.map((link, index) => (
              <div key={index} className="flex space-x-2">
                <select
                  className="input-field w-1/3"
                  value={link.platform || ''}
                  onChange={(e) => onSocialLinkChange(index, 'platform', e.target.value)}
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
                  onChange={(e) => onSocialLinkChange(index, 'url', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => onRemoveSocialLink(index)}
                  className={`btn btn-sm ${
                    theme === 'dark'
                      ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
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
};

export default PersonalInfoSection;
