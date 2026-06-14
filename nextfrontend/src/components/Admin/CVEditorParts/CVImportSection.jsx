import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, Upload, FileText } from 'lucide-react';
import Spinner from '../../UI/Spinner';
import { useToast } from '../../../contexts/ToastContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { importCVApi } from '../../../api/cv';

const ACCEPTED_TYPES = '.pdf,.txt,image/png,image/jpeg,image/webp';

const CVImportSection = ({ onGenerated }) => {
  const t = useTranslations('admin.cv.import');
  const { showToast } = useToast();
  const { locale } = useLanguage();

  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('merge');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleGenerate = async () => {
    if (!file) {
      showToast({ type: 'error', message: t('selectFileError') });
      return;
    }

    setLoading(true);
    try {
      const generated = await importCVApi(file, mode, locale);
      onGenerated(generated);
      showToast({ type: 'success', message: t('success') });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Error importing CV:', err);
      const detail = err.response?.data?.detail;
      showToast({ type: 'error', message: detail || t('error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-card">
      <h3 className="section-title">{t('title')}</h3>
      <p className="text-sm text-gray-400 mb-4">{t('description')}</p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">{t('fileLabel')}</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-sm bg-gray-700 text-gray-200 hover:bg-gray-600 flex items-center"
              disabled={loading}
            >
              <Upload size={14} className="mr-1.5" /> {t('chooseFile')}
            </button>
            <span className="text-sm text-gray-400 flex items-center gap-1.5 truncate">
              <FileText size={14} className="shrink-0" />
              {file ? file.name : t('noFileSelected')}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={handleFileChange}
              className="hidden"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t('modeLabel')}</label>
          <div className="space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="cv-import-mode"
                value="merge"
                checked={mode === 'merge'}
                onChange={() => setMode('merge')}
                disabled={loading}
                className="mt-1"
              />
              <span>
                <span className="block text-sm">{t('modeMerge')}</span>
                <span className="block text-xs text-gray-500">{t('modeMergeHint')}</span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="cv-import-mode"
                value="replace"
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
                disabled={loading}
                className="mt-1"
              />
              <span>
                <span className="block text-sm">{t('modeReplace')}</span>
                <span className="block text-xs text-gray-500">{t('modeReplaceHint')}</span>
              </span>
            </label>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !file}
            className="btn btn-primary flex items-center disabled:opacity-50"
          >
            {loading ? (
              <Spinner size="h-5 w-5" />
            ) : (
              <>
                <Sparkles size={18} className="mr-2" /> {t('generate')}
              </>
            )}
          </button>
          {loading && <p className="text-sm text-gray-400 mt-2">{t('generating')}</p>}
        </div>
      </div>
    </div>
  );
};

export default CVImportSection;
