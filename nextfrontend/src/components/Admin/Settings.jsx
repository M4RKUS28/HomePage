import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Languages, Save, Check, AlertTriangle, Palette, RotateCcw, RefreshCw } from 'lucide-react';
import {
  getTranslationModelApi,
  updateTranslationModelApi,
  getAutoTranslationApi,
  updateAutoTranslationApi,
  getPublicSettingsApi,
  updateAccentColorApi,
  revalidateThemeApi,
} from '../../api/settings';
import {
  buildAccentCss,
  isValidHex,
  isRandomAccent,
  randomAccentHex,
  DEFAULT_ACCENT,
  RANDOM_ACCENT,
} from '../../lib/accent';
import Spinner from '../UI/Spinner';

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
        feedback.type === 'success' ? 'text-[var(--app-green)]' : 'text-[var(--app-red)]'
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
  const [feedback, setFeedback] = useState(null);

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

  useEffect(() => { load(); }, [load]);

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
    <div className="panel p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Languages size={22} className="text-accent shrink-0" />
        <h2 className="text-lg font-semibold text-ink">{t('title')}</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <label htmlFor="translation-model" className="block text-sm font-medium text-ink-2">
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
          className="input-field font-mono"
        />
        <datalist id="translation-model-suggestions">
          {suggestions.map((s) => <option key={s} value={s} />)}
        </datalist>

        <p className="text-xs text-ink-2">{t('modelHelp')}</p>
        {defaultModel && (
          <p className="text-xs text-ink-3">{t('defaultBadge', { model: defaultModel })}</p>
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
/*  Automatic translation toggle card                                  */
/* ------------------------------------------------------------------ */
const AutoTranslationCard = () => {
  const t = useTranslations('admin.settings');

  const [enabled, setEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAutoTranslationApi();
      setEnabled(Boolean(data.enabled));
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: t('loadError') });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async () => {
    const next = !enabled;
    setIsSaving(true);
    setFeedback(null);
    // Optimistic flip so the switch feels instant; reverted on error.
    setEnabled(next);
    try {
      const data = await updateAutoTranslationApi(next);
      setEnabled(Boolean(data.enabled));
      setFeedback({ type: 'success', text: t('autoTranslationSaved') });
    } catch (err) {
      setEnabled(!next);
      const detail = err?.response?.data?.detail;
      setFeedback({ type: 'error', text: detail || t('autoTranslationSaveError') });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div className="panel p-6 space-y-5">
      <div className="flex items-center gap-3">
        <RefreshCw size={22} className="text-accent shrink-0" />
        <h2 className="text-lg font-semibold text-ink">{t('autoTranslationTitle')}</h2>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-ink-2">
            {enabled ? t('autoTranslationEnabled') : t('autoTranslationDisabled')}
          </p>
          <p className="text-xs text-ink-2">{t('autoTranslationHelp')}</p>
          <p className="text-xs text-ink-3">{t('autoTranslationNote')}</p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={t('autoTranslationTitle')}
          onClick={handleToggle}
          disabled={isSaving}
          style={{ backgroundColor: enabled ? 'var(--app-accent)' : 'var(--app-line-strong)' }}
          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50"
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <Feedback feedback={feedback} />
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
  const [storedColor, setStoredColor] = useState(null);
  const [isRandom, setIsRandom] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPublicSettingsApi();
      const fallback = data.default_accent_color || DEFAULT_ACCENT;
      const stored = data.accent_color || null;
      setDefaultColor(fallback);
      setStoredColor(stored);
      setIsRandom(isRandomAccent(stored));
      setColor(isRandomAccent(stored) ? fallback : stored || fallback);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: t('loadError') });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const persist = async (value) => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const data = await updateAccentColorApi(value);
      const saved = data.accent_color || null;
      setStoredColor(saved);
      setIsRandom(isRandomAccent(saved));
      if (isRandomAccent(saved)) {
        // Show one of the random colors right away as a live preview.
        applyAccentToDocument(randomAccentHex());
      } else {
        setColor(saved || data.default_accent_color);
        applyAccentToDocument(saved);
      }
      revalidateThemeApi().catch(() => {});
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
    if (isRandom) {
      persist(RANDOM_ACCENT);
      return;
    }
    if (!isValidHex(color)) return;
    persist(color.toUpperCase() === defaultColor.toUpperCase() ? null : color.toUpperCase());
  };

  // Normalize current selection and saved selection to one comparable token.
  const selection = isRandom ? RANDOM_ACCENT : color.toUpperCase();
  const savedSelection = storedColor
    ? (isRandomAccent(storedColor) ? RANDOM_ACCENT : storedColor.toUpperCase())
    : defaultColor.toUpperCase();
  const isDirty = selection !== savedSelection;

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div className="panel p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Palette size={22} className="text-accent shrink-0" />
        <h2 className="text-lg font-semibold text-ink">{t('accentTitle')}</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={isValidHex(color) ? color : defaultColor}
            onChange={(e) => { setColor(e.target.value.toUpperCase()); setIsRandom(false); }}
            aria-label={t('accentTitle')}
            className="h-10 w-14 cursor-pointer rounded-md border border-line-strong bg-raised p-1"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => { setColor(e.target.value.trim()); setIsRandom(false); }}
            maxLength={7}
            placeholder={defaultColor}
            autoComplete="off"
            spellCheck={false}
            className="input-field w-32 font-mono uppercase"
          />
          {!isRandom && isValidHex(color) && (
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
              onClick={() => { setColor(preset); setIsRandom(false); }}
              aria-label={preset}
              title={preset}
              className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                !isRandom && color.toUpperCase() === preset ? 'border-[var(--app-ink)]' : 'border-transparent'
              }`}
              style={{ backgroundColor: preset }}
            />
          ))}
          <button
            type="button"
            onClick={() => setIsRandom(true)}
            aria-label={t('accentRandom')}
            title={t('accentRandom')}
            className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
              isRandom ? 'border-[var(--app-ink)]' : 'border-transparent'
            }`}
            style={{
              background:
                'conic-gradient(from 0deg, #F43F5E, #F97316, #FFB224, #10B981, #38BDF8, #8B5CF6, #F43F5E)',
            }}
          />
        </div>

        <p className="text-xs text-ink-2">{isRandom ? t('accentRandomHelp') : t('accentHelp')}</p>
        <p className="text-xs text-ink-3">{t('accentDefaultBadge', { color: defaultColor })}</p>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isSaving || (!isRandom && !isValidHex(color)) || !isDirty}
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
              className="btn btn-outline btn-sm inline-flex items-center gap-1.5 disabled:opacity-50"
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
    <AutoTranslationCard />
    <TranslationModelCard />
  </div>
);

export default AdminSettings;
