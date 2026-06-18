/**
 * Accent color derivation.
 *
 * The design system is driven by one base hex color (default: signal amber
 * #FFB224, see globals.css). When an admin configures a custom color, this
 * module derives all dependent tokens (fill, readable text variants per
 * theme, soft/glow alphas, legacy --color-primary triples) and emits a CSS
 * string that is injected as an inline <style> during SSR — so the custom
 * color is in the very first HTML byte, with no flash of the default.
 *
 * Pure JS, usable on both server (layout) and client (admin live preview).
 */

export const DEFAULT_ACCENT = '#FFB224';

// Sentinel stored instead of a hex when the admin wants a fresh random color on
// every full page load. Resolved to a concrete hex per request during SSR.
export const RANDOM_ACCENT = 'random';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isValidHex(color) {
  return typeof color === 'string' && HEX_RE.test(color);
}

export function isRandomAccent(value) {
  return typeof value === 'string' && value.toLowerCase() === RANDOM_ACCENT;
}

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

/** Mix `rgb` toward `target` (0 = unchanged, 1 = fully target). */
function mix(rgb, target, weight) {
  return {
    r: Math.round(rgb.r + (target.r - rgb.r) * weight),
    g: Math.round(rgb.g + (target.g - rgb.g) * weight),
    b: Math.round(rgb.b + (target.b - rgb.b) * weight),
  };
}

const BLACK = { r: 0, g: 0, b: 0 };
const WHITE = { r: 255, g: 255, b: 255 };

/** WCAG relative luminance, 0 (black) … 1 (white). */
function luminance({ r, g, b }) {
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const rgba = ({ r, g, b }, a) => `rgba(${r}, ${g}, ${b}, ${a})`;
const triple = ({ r, g, b }) => `${r} ${g} ${b}`;
const hex = ({ r, g, b }) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

/**
 * Derive the full token set from a base hex color.
 * Returns null for invalid input.
 */
export function deriveAccentPalette(baseHex) {
  if (!isValidHex(baseHex)) return null;
  const base = hexToRgb(baseHex);
  const lum = luminance(base);

  // Solid fill is the base color itself; pick black-ish or white text on it
  // by luminance. The dark text is tinted with the base for warmth (like the
  // original #1A1206 on amber).
  const onFill = lum > 0.4 ? mix(base, BLACK, 0.88) : WHITE;

  // Text accent on dark backgrounds: lighten very dark colors a bit.
  const accentDark = lum < 0.22 ? mix(base, WHITE, 0.3) : base;

  // Text accent on light backgrounds: darken until it reads like ink
  // (amber #FFB224 → ~#8C6214, comparable to the handcrafted bronze).
  const accentLight = lum > 0.18 ? mix(base, BLACK, 0.45) : base;

  return {
    fill: hex(base),
    onFill: hex(onFill),
    dark: {
      accent: hex(accentDark),
      soft: rgba(base, 0.12),
      glow: rgba(base, 0.07),
      primary: triple(accentDark),
      primaryDark: triple(mix(base, BLACK, 0.13)),
      primaryLight: triple(mix(base, WHITE, 0.33)),
    },
    light: {
      accent: hex(accentLight),
      soft: rgba(base, 0.14),
      glow: rgba(base, 0.1),
      primary: triple(accentLight),
      primaryDark: triple(mix(accentLight, BLACK, 0.23)),
      primaryLight: triple(mix(base, BLACK, 0.13)),
    },
  };
}

/**
 * Build the CSS override block for a custom accent color.
 * Returns null when the color is missing, invalid, or equal to the default
 * (no override needed — globals.css already carries the defaults).
 */
export function buildAccentCss(accentColor) {
  if (!accentColor || !isValidHex(accentColor)) return null;
  if (accentColor.toUpperCase() === DEFAULT_ACCENT) return null;

  const p = deriveAccentPalette(accentColor);
  if (!p) return null;

  const shared = (t) => [
    `--app-accent:${t.accent}`,
    `--app-accent-soft:${t.soft}`,
    `--app-accent-fill:${p.fill}`,
    `--app-on-accent-fill:${p.onFill}`,
    `--app-glow-a:${t.glow}`,
    `--color-primary:${t.primary}`,
    `--color-primary-dark:${t.primaryDark}`,
    `--color-primary-light:${t.primaryLight}`,
  ].join(';');

  // Plain `body` block covers the pre-hydration state (no theme class yet,
  // matching the :root dark defaults); the themed blocks win once
  // ThemeContext applies body.dark / body.light.
  return `body{${shared(p.dark)}}body.dark{${shared(p.dark)}}body.light{${shared(p.light)}}`;
}

/** HSL → uppercase hex. h in [0,360), s/l in [0,100]. */
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const c = l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return Math.round(255 * c);
  };
  return hex({ r: f(0), g: f(8), b: f(4) });
}

/**
 * A vibrant random accent: any hue, but high saturation and mid lightness so
 * the result always reads as a confident brand color (never muddy or washed
 * out) and keeps enough contrast for the derived text tokens.
 */
export function randomAccentHex() {
  const h = Math.floor(Math.random() * 360);
  const s = 65 + Math.random() * 20; // 65–85 %
  const l = 52 + Math.random() * 12; // 52–64 %
  return hslToHex(h, s, l);
}

/**
 * Resolve a stored accent setting to a concrete hex (or null for the default):
 * the `random` sentinel becomes a fresh vibrant color, a valid hex passes
 * through, anything else (unset/invalid) yields null.
 */
export function resolveAccentColor(value) {
  if (isRandomAccent(value)) return randomAccentHex();
  if (isValidHex(value)) return value;
  return null;
}
