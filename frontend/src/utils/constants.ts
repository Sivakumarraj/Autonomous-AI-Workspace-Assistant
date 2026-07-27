/**
 * Static UI configuration.
 *
 * Every MOCK_* fixture that used to live here was rendered as if it were real
 * data — invented dashboard counts, four workflows that did not exist, and a
 * chat history nobody had. All of it is gone; every screen reads from the API.
 *
 * Navigation now lives in `src/lib/nav.ts`, which carries the icon components
 * directly instead of icon names that had to be resolved through a lookup map.
 */

export const APP_NAME = 'Nexus AI';
