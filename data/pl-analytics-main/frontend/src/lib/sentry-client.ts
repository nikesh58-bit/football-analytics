// Optional browser Sentry. No-op without NEXT_PUBLIC_SENTRY_DSN.
export function initBrowserSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn || typeof window === 'undefined') return;
  try {
    // Dynamically loaded so `next build` works without @sentry/nextjs installed.
    // Run `npm i @sentry/nextjs` in frontend to enable.
    const Sentry = require('@sentry/nextjs') as any;
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
  } catch {
    // ignore — sentry not installed
  }
}
