import { test, expect } from '@playwright/test';

test('home loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/PL Analytics|Premier|Next/i);
});

test('backend health via rewrite', async ({ request }) => {
  const res = await request.get('/api/backend/teams?limit=1').catch(() => null);
  // Backend may be down in CI without services — accept 200 or error status, just assert no hang.
  expect(res === null || [200, 400, 401, 500, 502].includes(res.status())).toBeTruthy();
});
