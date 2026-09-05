// Optional Sentry wiring. No-op when SENTRY_DSN is unset or @sentry/node
// is not installed, so local dev works without extra setup.
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/node') as any;
    Sentry.init({ dsn, environment: process.env.NODE_ENV || 'development', tracesSampleRate: 0.1 });
  } catch {
    // sentry not installed — ignore
  }
}

export function captureError(err: unknown) {
  if (!process.env.SENTRY_DSN) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/node') as any;
    Sentry.captureException(err);
  } catch {
    // ignore
  }
}
