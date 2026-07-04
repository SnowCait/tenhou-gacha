import { toMpsz } from '$lib/mahjong/tiles';

/** X (Twitter) post intent URL with prefilled text and link. */
export function xIntentUrl(text: string, url: string): string {
	const params = new URLSearchParams({ text, url });
	return `https://x.com/intent/post?${params}`;
}

/** Share URL that reproduces the hand. Keeps the locale via the current pathname. */
export function handShareUrl(current: URL, tiles: readonly number[]): string {
	return `${current.origin}${current.pathname}?hand=${toMpsz(tiles)}`;
}

/** Plain link to the app for shares without a hand to reproduce. */
export function pageShareUrl(current: URL): string {
	return `${current.origin}${current.pathname}`;
}
