import { expect, test } from '@playwright/test';

// These tests run against a production build served from the GitHub Pages base
// path (see playwright.base.config.ts, which sets BASE_PATH=/tenhou-gacha and a
// matching baseURL). Relative `goto` paths resolve against that base.

// A public origin to resolve hrefs against, so we compare pathnames rather than
// doing brittle substring matching.
const ORIGIN = 'https://snowcait.github.io';

test('serves the Japanese page under the base path', async ({ page }) => {
	const response = await page.goto('./');
	expect(response?.status()).toBe(200);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('天和ガチャ');
});

test('the English link resolves to /tenhou-gacha/en', async ({ page }) => {
	await page.goto('./');
	const href = await page.getByRole('link', { name: 'English' }).getAttribute('href');
	expect(new URL(href!, ORIGIN).pathname).toBe('/tenhou-gacha/en');
});

test('the Japanese link on the English page resolves to /tenhou-gacha/', async ({ page }) => {
	await page.goto('./en');
	const href = await page.getByRole('link', { name: '日本語' }).getAttribute('href');
	expect(new URL(href!, ORIGIN).pathname).toBe('/tenhou-gacha/');
});

test('loads the English page directly and survives a reload', async ({ page }) => {
	let response = await page.goto('./en');
	expect(response?.status()).toBe(200);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tenhou Gacha');
	await expect(page.getByRole('button', { name: 'Deal' })).toBeVisible();

	response = await page.reload();
	expect(response?.status()).toBe(200);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tenhou Gacha');
});

test('switches locale from the footer and deals with base-path assets', async ({ page }) => {
	await page.goto('./');
	await expect(page.getByRole('button', { name: '配牌' })).toBeEnabled({ timeout: 15_000 });

	await page.getByRole('link', { name: 'English' }).click();
	await expect(page).toHaveURL(/\/tenhou-gacha\/en$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tenhou Gacha');

	const deal = page.getByRole('button', { name: 'Deal' });
	await expect(deal).toBeEnabled({ timeout: 15_000 });
	await deal.click();
	await expect(page.getByTestId('main-hand').getByRole('img')).toHaveCount(14, { timeout: 15_000 });
});
