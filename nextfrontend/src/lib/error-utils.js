/**
 * Shared error parsing utilities.
 *
 * Extracts human-readable messages from Axios error responses so that
 * callers (AuthContext, forms, etc.) do not duplicate parsing logic.
 */

/**
 * Parse an API error into a user-friendly message string.
 *
 * Handles three shapes:
 *   - { detail: "string" }
 *   - { detail: [{ loc: [...], msg: "..." }, ...] }  (FastAPI validation)
 *   - Network / unknown errors
 *
 * @param {Error} err            - Axios error (or any Error object)
 * @param {string} fallback      - Default message if nothing specific is found
 * @returns {string}
 */
export function parseApiError(err, fallback = 'An unexpected error occurred.') {
  if (!err) return fallback;

  // Axios response error
  if (err.response) {
    const { status, data } = err.response;
    const detail = data?.detail;

    if (typeof detail === 'string') return detail;

    if (Array.isArray(detail)) {
      return detail
        .map((e) => {
          const field = e.loc?.length > 1 ? e.loc[e.loc.length - 1] : '';
          return field ? `${field}: ${e.msg}` : e.msg;
        })
        .join('\n');
    }

    // HTTP-status based defaults
    if (status === 401) return 'Invalid credentials. Please try again.';
    if (status === 403) return 'You do not have permission for this action.';
    if (status === 404) return 'The requested resource was not found.';
    if (status === 409) return 'A conflict occurred. The resource may already exist.';
    if (status === 422) return 'Validation error. Please check your inputs.';

    return fallback;
  }

  // No response (network error)
  if (err.request) {
    return 'No response from server. Please check your internet connection.';
  }

  // Generic JS error
  return err.message || fallback;
}

/**
 * Check if a URL is a full absolute URL (starts with http(s)://).
 *
 * @param {*} val
 * @returns {boolean}
 */
export function isAbsoluteUrl(val) {
  return typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'));
}
