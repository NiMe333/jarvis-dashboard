const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

/**
 * Build-time frontend configuration. Vite replaces these values during the
 * production build, so changing them requires rebuilding the frontend.
 */
export const runtimeConfig = Object.freeze({
  apiBaseUrl,
});
