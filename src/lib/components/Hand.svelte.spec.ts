import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Hand from './Hand.svelte';

const WINNING_HAND = [0, 1, 2, 12, 13, 14, 24, 25, 26, 27, 27, 28, 28, 28];

describe('Hand.svelte', () => {
	it('renders one tile image per dealt tile', async () => {
		render(Hand, { tiles: WINNING_HAND });

		await expect.element(page.getByRole('img', { name: '一萬' })).toBeInTheDocument();
		expect(page.getByRole('img').elements()).toHaveLength(WINNING_HAND.length);
	});

	it('labels honor tiles with their reading', async () => {
		render(Hand, { tiles: [31, 32, 33] });

		await expect.element(page.getByRole('img', { name: '白' })).toBeInTheDocument();
		await expect.element(page.getByRole('img', { name: '發' })).toBeInTheDocument();
		await expect.element(page.getByRole('img', { name: '中' })).toBeInTheDocument();
	});
});
