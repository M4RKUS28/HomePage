import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Languages, Save, Check, AlertTriangle } from 'lucide-react';
import { getTranslationModelApi, updateTranslationModelApi } from '../../api/settings';
import Spinner from '../UI/Spinner';

const AdminSettings = () => {
  const t = useTranslations('admin.settings');

  const [model, setModel] = useState('');
  const [defaultModel, setDefaultModel] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text }

  const load = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const data = await getTranslationModelApi();
      setModel(data.model || '');
      setDefaultModel(data.default_model || '');
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: t('loadError') });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    const trimmed = model.trim();
    if (!trimmed) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const data = await updateTranslationModelApi(trimmed);
      setModel(data.model);
      setFeedback({ type: 'success', text: t('saved') });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setFeedback({ type: 'error', text: detail || t('saveError') });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-gray-800/60 rounded-lg p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Languages size={22} className="text-primary shrink-0" />
          <h2 className="text-lg font-semibold text-white">{t('title')}</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <label htmlFor="translation-model" className="block text-sm font-medium text-gray-200">
            {t('modelLabel')}
          </label>

          <input
            id="translation-model"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            list="translation-model-suggestions"
            placeholder={defaultModel}
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-gray-900 text-gray-100 text-sm rounded-md px-3 py-2 border border-gray-700 focus:border-primary outline-none font-mono"
          />
          <datalist id="translation-model-suggestions">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>

          <p className="text-xs text-gray-400">{t('modelHelp')}</p>
          {defaultModel && (
            <p className="text-xs text-gray-500">{t('defaultBadge', { model: defaultModel })}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isSaving || !model.trim()}
              className="btn btn-primary btn-sm inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save size={15} />
              {isSaving ? t('saving') : t('save')}
            </button>

            {feedback && (
              <span
                className={`inline-flex items-center gap-1.5 text-sm ${
                  feedback.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {feedback.type === 'success' ? <Check size={15} /> : <AlertTriangle size={15} />}
                {feedback.text}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
