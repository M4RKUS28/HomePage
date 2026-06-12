import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Languages, Save, Check, AlertTriangle, Palette, RotateCcw } from 'lucide-react';
import {
  getTranslationModelApi,
  updateTranslationModelApi,
  getPublicSettingsApi,
  updateAccentColorApi,
  revalidateThemeApi,
} from '../../api/settings';
import { buildAccentCss, isValidHex, DEFAULT_ACCENT } from '../../lib/accent';
import Spinner from '../UI/Spinner';

/** Apply the accent live in the current document (same CSS as SSR injects). */
const applyAccentToDocument = (color) => {
  const css = buildAccentCss(color) || '';
  let el = document.getElementById('accent-theme');
  if (!el) {
    el = document.createElement('style');
    el.id = 'accent-theme';
    document.body.appendChild(el);
  }
  el.textContent = css;
};

const PRESET_COLORS = ['#FFB224', '#10B981', '#38BDF8', '#8B5CF6', '#F43F5E', '#F97316'];

const Feedback = ({ feedback }) =>
  feedback ? (
    <span
      className={`inline-flex items-center gap-1.5 text-sm ${
        feedback.type === 'success' ? 'text-green-400' : 'text-red-400'
      }`}
    >
      {feedback.type === 'success' ? <Check size={15} /> : <AlertTriangle size={15} />}
      {feedback.text}
    </span>
  ) : null;

/* ------------------------------------------------------------------ */
/*  Translation model card                                             */
/* ------------------------------------------------------------------ */
const TranslationModelCard = () => {
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
          <Feedback feedback={feedback} />
        </div>
      </form>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Accent color card                                                  */
/* ------------------------------------------------------------------ */
const AccentColorCard = () => {
  const t = useTranslations('admin.settings');

  const [color, setColor] = useState(DEFAULT_ACCENT);
  const [defaultColor, setDefaultColor] = useState(DEFAULT_ACCENT);
  const [storedColor, setStoredColor] = useState(null); // null = default active
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPublicSettingsApi();
      const fallback = data.default_accent_color || DEFAULT_ACCENT;
      setDefaultColor(fallback);
      setStoredColor(data.accent_color || null);
      setColor(data.accent_color || fallback);
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

  const persist = async (value) => {
    // value: hex string to store, or null to reset to default
    setIsSaving(true);
    setFeedback(null);
    try {
      const data = await updateAccentColorApi(value);
      setStoredColor(data.accent_color || null);
      setColor(data.accent_color || data.default_accent_color);
      applyAccentToDocument(data.accent_color);
      revalidateThemeApi().catch(() => {}); // cache bust is best-effort
      setFeedback({ type: 'success', text: t('accentSaved') });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setFeedback({ type: 'error', text: detail || t('accentSaveError') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isValidHex(color)) return;
    persist(color.toUpperCase() === defaultColor.toUpperCase() ? null : color.toUpperCase());
  };

  const isDirty = color.toUpperCase() !== (storedColor || defaultColor).toUpperCase();

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div className="bg-gray-800/60 rounded-lg p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Palette size={22} className="text-primary shrink-0" />
        <h2 className="text-lg font-semibold text-white">{t('accentTitle')}</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={isValidHex(color) ? color : defaultColor}
            onChange={(e) => setColor(e.target.value.toUpperCase())}
            aria-label={t('accentTitle')}
            className="h-10 w-14 cursor-pointer rounded-md border border-gray-700 bg-gray-900 p-1"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value.trim())}
            maxLength={7}
            placeholder={defaultColor}
            autoComplete="off"
            spellCheck={false}
            className="w-32 bg-gray-900 text-gray-100 text-sm rounded-md px-3 py-2 border border-gray-700 focus:border-primary outline-none font-mono uppercase"
          />
          {/* Live sample chip */}
          {isValidHex(color) && (
            <span
              className="inline-flex items-center rounded-md px-3 py-2 text-xs font-semibold"
              style={{ backgroundColor: color, color: '#1A1206' }}
            >
              Aa
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setColor(preset)}
              aria-label={preset}
              title={preset}
              className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                color.toUpperCase() === preset ? 'border-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>

        <p className="text-xs text-gray-400">{t('accentHelp')}</p>
        <p className="text-xs text-gray-500">{t('accentDefaultBadge', { color: defaultColor })}</p>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isSaving || !isValidHex(color) || !isDirty}
            className="btn btn-primary btn-sm inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save size={15} />
            {isSaving ? t('saving') : t('save')}
          </button>

          {storedColor && (
            <button
              type="button"
              onClick={() => persist(null)}
              disabled={isSaving}
              className="btn btn-sm inline-flex items-center gap-1.5 bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-50"
            >
              <RotateCcw size={15} />
              {t('accentReset')}
            </button>
          )}

          <Feedback feedback={feedback} />
        </div>
      </form>
    </div>
  );
};

const AdminSettings = () => (
  <div className="max-w-xl mx-auto space-y-6">
    <AccentColorCard />
    <TranslationModelCard />
  </div>
);

export default AdminSettings;
