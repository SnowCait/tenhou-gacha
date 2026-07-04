<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { xIntentUrl } from '$lib/share';

	let { text, url }: { text: string; url: string } = $props();

	const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	const buttonClass =
		'flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-emerald-50/80 transition hover:bg-white/15 hover:text-emerald-50';

	async function nativeShare(): Promise<void> {
		try {
			await navigator.share({ text, url });
		} catch {
			// canceled or unavailable; the copy button remains as fallback
		}
	}

	async function copy(): Promise<void> {
		try {
			await navigator.clipboard.writeText(`${text}\n${url}`);
		} catch {
			return;
		}
		copied = true;
		clearTimeout(copyTimer);
		copyTimer = setTimeout(() => (copied = false), 2000);
	}

	$effect(() => () => clearTimeout(copyTimer));
</script>

<div class="flex items-center gap-2" data-testid="share-buttons">
	<a
		href={xIntentUrl(text, url)}
		target="_blank"
		rel="external noopener noreferrer"
		class={buttonClass}
		aria-label={m.share_on_x()}
		title={m.share_on_x()}
	>
		<svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path
				d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z"
			/>
		</svg>
	</a>

	{#if canNativeShare}
		<button
			type="button"
			class={buttonClass}
			onclick={nativeShare}
			aria-label={m.share_native()}
			title={m.share_native()}
		>
			<svg
				class="h-5 w-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<circle cx="18" cy="5" r="3" />
				<circle cx="6" cy="12" r="3" />
				<circle cx="18" cy="19" r="3" />
				<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
				<line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
			</svg>
		</button>
	{/if}

	<button
		type="button"
		class={buttonClass}
		onclick={copy}
		aria-label={m.share_copy()}
		title={m.share_copy()}
		data-testid="share-copy"
	>
		<svg
			class="h-5 w-5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			{#if copied}
				<polyline points="20 6 9 17 4 12" />
			{:else}
				<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
				<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
			{/if}
		</svg>
	</button>

	{#if copied}
		<span class="text-sm text-emerald-50/70" role="status">{m.share_copied()}</span>
	{/if}
</div>
