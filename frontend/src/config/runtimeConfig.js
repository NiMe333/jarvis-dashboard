const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const apiBaseUrl = (configuredApiBaseUrl || "/api").replace(/\/+$/, "");

/**
 * Build-time frontend configuration. Vite replaces these values during the
 * production build, so changing them requires rebuilding the frontend.
 */
export const runtimeConfig = Object.freeze({
  apiBaseUrl,
});
