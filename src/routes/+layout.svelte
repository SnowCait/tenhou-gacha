<script lang="ts">
	import { page } from '$app/state';
	import { baseLocale, getLocale, locales, localizeHref } from '$lib/paraglide/runtime';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const localeNames: Record<string, string> = { jp: '日本語', en: 'English' };

	// Paraglide is configured with the GitHub Pages base path, so localizeHref
	// returns an absolute, base-aware href (e.g. /tenhou-gacha/en). No base is
	// hard-coded here; it comes from the compiled URL patterns.
	//
	// Paraglide mirrors the current path's trailing slash onto the result, which
	// doesn't match the prerendered layout (trailingSlash 'never'): the base
	// locale is the directory index and keeps its trailing slash (`/` locally,
	// `/tenhou-gacha/` on Pages), while the localized page is a plain file and
	// must not have one (`/en`, `/tenhou-gacha/en`). The app has a single route,
	// so normalizing by locale is sufficient.
	function localeHref(locale: (typeof locales)[number]): string {
		const href = localizeHref(page.url.pathname, { locale });
		if (locale === baseLocale) return href.endsWith('/') ? href : `${href}/`;
		return href.replace(/\/$/, '');
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}

<footer
	class="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 px-4 pb-10 text-sm text-emerald-50/50"
>
	<nav class="flex gap-4">
		<!-- eslint-disable svelte/no-navigation-without-resolve -- localizeHref already returns a base-aware URL; wrapping it in resolve() would add the base path a second time. -->
		{#each locales as locale (locale)}
			<a
				href={localeHref(locale)}
				class="hover:text-emerald-50/80"
				class:underline={locale === getLocale()}
				data-sveltekit-reload
			>
				{localeNames[locale] ?? locale}
			</a>
		{/each}
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</nav>
	<p>
		<a
			href="https://github.com/SnowCait/tenhou-gacha"
			class="hover:text-emerald-50/80"
			rel="external noopener"
		>
			GitHub
		</a>
	</p>
</footer>
