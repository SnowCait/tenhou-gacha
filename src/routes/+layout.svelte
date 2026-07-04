<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, locales, localizeHref } from '$lib/paraglide/runtime';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const localeNames: Record<string, string> = { jp: '日本語', en: 'English' };
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}

<footer
	class="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 px-4 pb-10 text-sm text-emerald-50/50"
>
	<nav class="flex gap-4">
		{#each locales as locale (locale)}
			<a
				href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}
				class="hover:text-emerald-50/80"
				class:underline={locale === getLocale()}
				data-sveltekit-reload
			>
				{localeNames[locale] ?? locale}
			</a>
		{/each}
	</nav>
	<p>
		<a
			href="https://github.com/FluffyStuff/riichi-mahjong-tiles"
			class="hover:text-emerald-50/80"
			rel="external noopener"
		>
			{m.credits_tiles()}
		</a>
	</p>
</footer>
