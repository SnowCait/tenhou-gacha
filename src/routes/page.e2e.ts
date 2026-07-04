import { expect, test } from '@playwright/test';

test('deals 14 tiles and shows the shanten number', async ({ page }) => {
	await page.goto('/');
	const dealButton = page.getByRole('button', { name: '配牌' });
	await expect(dealButton).toBeEnabled({ timeout: 15_000 });

	await dealButton.click();
	await expect(page.getByTestId('main-hand').getByRole('img')).toHaveCount(14);
	await expect(page.getByTestId('shanten-result')).not.toBeEmpty({ timeout: 5_000 });
});

test('celebrates a tenhou hand', async ({ page }) => {
	await page.goto('/?tenhou');
	const dealButton = page.getByRole('button', { name: '配牌' });
	await expect(dealButton).toBeEnabled({ timeout: 15_000 });

	await dealButton.click();
	await expect(page.getByTestId('tenhou-overlay')).toBeVisible({ timeout: 5_000 });
	await expect(page.getByTestId('tenhou-overlay')).toContainText('天和');
	await expect(page.getByTestId('shanten-result')).toHaveText('天和!!');
});

test('runs a fixed-count simulation and reports stats', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: '配牌' })).toBeEnabled({ timeout: 15_000 });

	await page.getByRole('radio', { name: '指定回数まで' }).check();
	await page.getByLabel('回数', { exact: true }).fill('1000');
	await page.getByRole('button', { name: '実行' }).click();

	const result = page.getByTestId('sim-result');
	await expect(result).toBeVisible({ timeout: 15_000 });
	await expect(page.getByTestId('sim-deals')).toHaveText('1,000');
	await expect(page.getByTestId('shanten-chart')).toContainText('向聴');
});

test('serves the English locale under /en', async ({ page }) => {
	await page.goto('/en');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tenhou Gacha');
	await expect(page.getByRole('button', { name: 'Deal' })).toBeVisible();
});

test('switches the locale from the footer link', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('天和ガチャ');

	await page.getByRole('link', { name: 'English' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tenhou Gacha');

	await page.getByRole('link', { name: '日本語' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('天和ガチャ');
});
