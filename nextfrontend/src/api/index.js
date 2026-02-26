/**
 * API barrel — re-exports the shared Axios client as default,
 * so legacy imports of `from '../api'` or `from '../api/index'` still work.
 */
export { default } from './client';
