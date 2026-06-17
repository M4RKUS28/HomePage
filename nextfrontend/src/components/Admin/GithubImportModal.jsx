import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Github, Sparkles, ExternalLink, Image, Globe } from 'lucide-react';
import Spinner from '../UI/Spinner';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { importProjectFromGithubApi } from '../../api/projects';

/**
 * Modal for AI-assisted GitHub README import.
 *
 * Props:
 *  onImported(projectData) – called with the extracted project data so the
 *    parent can open the ProjectForm pre-filled for review.
 *  onClose() – close handler
 */
const GithubImportModal = ({ onImported, onClose }) => {
  const t = useTranslations('admin.projects.githubImport');
  const { showToast } = useToast();
  const { locale } = useLanguage();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleGenerate = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      showToast({ type: 'error', message: t('urlRequired') });
      return;
    }
    if (!trimmed.includes('github.com') && !trimmed.includes('raw.githubusercontent.com')) {
      showToast({ type: 'error', message: t('urlInvalid') });
      return;
    }

    setLoading(true);
    setPreview(null);
    try {
      const result = await importProjectFromGithubApi(trimmed, locale);
      setPreview(result);
    } catch (err) {
      const detail = err.response?.data?.detail;
      showToast({ type: 'error', message: detail || t('error') });
    } finally {
      setLoading(false);
    }
  };

  const handleUseProject = () => {
    if (!preview) return;
    onImported({
      title: preview.title,
      description: preview.description,
      link: preview.website_url || preview.github_link,
      github_link: preview.github_link,
      image_url: preview.image_url,
    });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-2">{t('description')}</p>

      {/* URL input */}
      <div>
        <label className="block text-sm font-medium mb-1.5">{t('urlLabel')}</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleGenerate()}
            placeholder="https://github.com/user/repo"
            className="input-field flex-1"
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !url.trim()}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            {loading ? (
              <Spinner size="h-4 w-4" />
            ) : (
              <Sparkles size={16} />
            )}
            {t('generate')}
          </button>
        </div>
        {loading && (
          <p className="text-xs text-ink-3 mt-2">{t('generating')}</p>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="rounded-xl border border-line bg-raised p-4 space-y-3">
          <h4 className="font-display font-semibold text-ink">{preview.title || t('noTitle')}</h4>

          {preview.description && (
            <p className="text-sm text-ink-2 leading-relaxed">{preview.description}</p>
          )}

          <div className="space-y-1.5 text-xs font-data text-ink-3">
            {preview.github_link && (
              <div className="flex items-center gap-2">
                <Github size={13} className="shrink-0" />
                <a
                  href={preview.github_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:text-ink transition-colors"
                >
                  {preview.github_link}
                </a>
              </div>
            )}
            {preview.website_url && (
              <div className="flex items-center gap-2">
                <Globe size={13} className="shrink-0" />
                <a
                  href={preview.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:text-ink transition-colors"
                >
                  {preview.website_url}
                </a>
              </div>
            )}
            {preview.image_url && (
              <div className="flex items-center gap-2">
                <Image size={13} className="shrink-0" />
                <a
                  href={preview.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:text-ink transition-colors"
                >
                  {preview.image_url}
                </a>
              </div>
            )}
          </div>

          <p className="text-xs text-ink-3 italic">{t('reviewHint')}</p>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm bg-raised border border-line text-ink-2 hover:text-ink"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleUseProject}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
            >
              <ExternalLink size={14} />
              {t('useProject')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GithubImportModal;
