import { describe, expect, it } from 'vitest';
import { handShareUrl, pageShareUrl, xIntentUrl } from './share';

describe('xIntentUrl', () => {
	it('encodes text and url as intent parameters', () => {
		const url = xIntentUrl('天和！！ #天和ガチャ', 'https://example.com/?hand=123m');
		const parsed = new URL(url);
		expect(parsed.origin + parsed.pathname).toBe('https://x.com/intent/post');
		expect(parsed.searchParams.get('text')).toBe('天和！！ #天和ガチャ');
		expect(parsed.searchParams.get('url')).toBe('https://example.com/?hand=123m');
	});
});

describe('handShareUrl', () => {
	it('builds a ?hand= link from origin and pathname', () => {
		const url = new URL('https://example.com/?tenhou');
		expect(handShareUrl(url, [0, 1, 2])).toBe('https://example.com/?hand=123m');
	});

	it('keeps the locale path', () => {
		const url = new URL('https://example.com/en?hand=999m');
		expect(handShareUrl(url, [27, 27])).toBe('https://example.com/en?hand=11z');
	});
});

describe('pageShareUrl', () => {
	it('drops the query', () => {
		expect(pageShareUrl(new URL('https://example.com/en?tenhou'))).toBe('https://example.com/en');
	});
});
