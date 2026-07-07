<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Pathname } from '$app/types';
	import { m } from '$lib/paraglide/messages.js';
	import Hand from '$lib/components/Hand.svelte';
	import ShantenChart from '$lib/components/ShantenChart.svelte';
	import ShareButtons from '$lib/components/ShareButtons.svelte';
	import TenhouOverlay from '$lib/components/TenhouOverlay.svelte';
	import { HAND_SIZE, parseHandMpsz, toEmoji } from '$lib/mahjong/tiles';
	import { handShareUrl, pageShareUrl } from '$lib/share';
	import {
		MAX_DEALS,
		type SimRequest,
		type SimResponse,
		type SimStats,
		type SimulationMode
	} from '$lib/mahjong/protocol';

	// Matches the flip animation in Hand.svelte (55ms stagger + 480ms flip).
	const REVEAL_MS = 14 * 55 + 480;
	const MAX_WINNERS_SHOWN = 30;
	// 123m456p789s11222z, used by the ?tenhou debug hook to force the effect
	const DEBUG_TENHOU_HAND = [0, 1, 2, 12, 13, 14, 24, 25, 26, 27, 27, 28, 28, 28];

	let worker: Worker | null = null;
	let engineReady = $state(false);
	let errorMessage: string | null = $state(null);

	let hand: number[] | null = $state(null);
	let handShanten = $state(0);
	let dealId = $state(0);
	let dealing = $state(false);
	let resultVisible = $state(false);
	let celebrate = $state(false);

	type FinishedRun = SimStats & { winners: number[][]; stopped: boolean; mode: SimulationMode };

	let mode: SimulationMode = $state('untilWin');
	let fixedCount = $state(1_000_000);
	let running = $state(false);
	let runTarget: number | null = $state(null);
	// Mode captured at run start, so toggling the radio afterwards cannot relabel the result.
	let runMode: SimulationMode = 'untilWin';
	let progress: SimStats | null = $state(null);
	let simResult: FinishedRun | null = $state(null);

	onMount(() => {
		let disposed = false;
		(async () => {
			const SimulatorWorker = (await import('$lib/mahjong/simulator.worker?worker')).default;
			if (disposed) return;
			worker = new SimulatorWorker();
			worker.onmessage = (event: MessageEvent<SimResponse>) => handleMessage(event.data);
		})();
		return () => {
			disposed = true;
			worker?.terminate();
		};
	});

	function send(request: SimRequest): void {
		worker?.postMessage(request);
	}

	function handleMessage(message: SimResponse): void {
		switch (message.type) {
			case 'ready':
				engineReady = true;
				loadHandFromUrl();
				break;
			case 'dealt':
				hand = message.tiles;
				handShanten = message.shanten;
				dealId += 1;
				setTimeout(() => {
					dealing = false;
					resultVisible = true;
					if (handShanten === -1) celebrate = true;
				}, REVEAL_MS);
				break;
			case 'progress':
				progress = message;
				break;
			case 'done':
				running = false;
				progress = message;
				simResult = {
					deals: message.deals,
					elapsedMs: message.elapsedMs,
					shantenCounts: message.shantenCounts,
					tenhouCount: message.tenhouCount,
					winners: message.winners,
					stopped: message.stopped,
					mode: runMode
				};
				break;
			case 'error':
				errorMessage = message.message;
				running = false;
				dealing = false;
				break;
		}
	}

	/** Replays a hand from a share URL (?hand=123m456p789s11222z) through the normal deal flow. */
	function loadHandFromUrl(): void {
		const tiles = parseHandMpsz(page.url.searchParams.get('hand') ?? '');
		if (!tiles) return;
		dealing = true;
		send({ type: 'evaluate', tiles });
	}

	function dealHand(): void {
		if (dealing || running) return;
		dealing = true;
		resultVisible = false;
		celebrate = false;
		if (page.url.searchParams.has('hand')) {
			const url = new URL(page.url);
			url.searchParams.delete('hand');
			replaceState(resolve((url.pathname + url.search) as Pathname), {});
		}
		if (page.url.searchParams.has('tenhou')) {
			handleMessage({ type: 'dealt', tiles: DEBUG_TENHOU_HAND, shanten: -1 });
			return;
		}
		send({ type: 'deal' });
	}

	function startSimulation(): void {
		if (running || dealing) return;
		running = true;
		runMode = mode;
		simResult = null;
		progress = null;
		const maxDeals = Math.min(Math.max(Math.trunc(fixedCount) || 1, 1), MAX_DEALS);
		runTarget = mode === 'fixed' ? maxDeals : null;
		send({ type: 'start', mode, maxDeals });
	}

	function stopSimulation(): void {
		send({ type: 'stop' });
	}

	function shantenText(shanten: number): string {
		if (shanten === -1) return m.shanten_win();
		if (shanten === 0) return m.shanten_tenpai();
		return m.shanten_n({ n: shanten });
	}

	function dealShareText(tiles: readonly number[], shanten: number): string {
		const hand = toEmoji(tiles);
		if (shanten === -1) return m.share_deal_tenhou_text({ hand });
		return m.share_deal_text({ hand, result: shantenText(shanten) });
	}

	function simShareText(result: FinishedRun): string {
		const deals = result.deals.toLocaleString();
		if (result.tenhouCount === 0) return m.share_sim_text({ deals });
		const hand = toEmoji(result.winners[0]);
		if (result.mode === 'untilWin') return m.share_sim_until_tenhou_text({ deals, hand });
		return m.share_sim_tenhou_text({ deals, tenhou: result.tenhouCount.toLocaleString(), hand });
	}

	function simShareUrl(result: FinishedRun): string {
		return result.tenhouCount > 0
			? handShareUrl(page.url, result.winners[0])
			: pageShareUrl(page.url);
	}

	function formatSpeed(stats: SimStats): string {
		if (stats.elapsedMs <= 0) return '-';
		return Math.round((stats.deals / stats.elapsedMs) * 1000).toLocaleString();
	}

	function formatElapsed(elapsedMs: number): string {
		return (elapsedMs / 1000).toFixed(1);
	}
</script>

<svelte:head>
	<title>{m.app_title()}</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
	<header class="text-center">
		<h1 class="font-display text-5xl font-bold tracking-wide text-gold-200 sm:text-6xl">
			{m.app_title()}
		</h1>
	</header>

	{#if errorMessage}
		<p class="rounded-lg bg-red-950/60 p-3 text-red-200" role="alert">
			{m.error_prefix()}{errorMessage}
		</p>
	{/if}

	<!-- 主機能: 配牌ガチャ -->
	<section
		class="rounded-2xl border border-white/10 bg-felt-800 p-5 shadow-xl shadow-black/30 sm:p-8"
	>
		<div class="-mx-3 flex min-h-24 items-center justify-center">
			{#if hand}
				{#key dealId}
					<div class="min-w-0" data-testid="main-hand">
						<Hand tiles={hand} animate />
					</div>
				{/key}
			{:else}
				<div class="min-w-0">
					<Hand tiles={Array(HAND_SIZE).fill(0)} faceDown />
				</div>
			{/if}
		</div>

		<p
			class="mt-6 min-h-12 text-center text-4xl font-bold"
			class:text-gold-200={resultVisible && handShanten === -1}
			data-testid="shanten-result"
		>
			{#if resultVisible && hand}
				{shantenText(handShanten)}
			{/if}
		</p>

		<div class="mt-2 flex min-h-10 justify-center">
			{#if resultVisible && hand}
				<ShareButtons text={dealShareText(hand, handShanten)} url={handShareUrl(page.url, hand)} />
			{/if}
		</div>

		<div class="mt-4 flex justify-center">
			<button
				type="button"
				class="rounded-xl bg-gold-400 px-12 py-4 text-2xl font-bold text-felt-950 shadow-lg shadow-black/40 transition hover:bg-gold-300 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
				onclick={dealHand}
				disabled={!engineReady || dealing || running}
			>
				{engineReady ? m.deal_button() : m.engine_loading()}
			</button>
		</div>
	</section>

	<!-- 副機能: 配牌を繰り返す -->
	<section
		class="rounded-2xl border border-white/10 bg-felt-800 p-5 shadow-xl shadow-black/30 sm:p-8"
	>
		<h2 class="text-xl font-bold text-emerald-50/90">{m.sim_title()}</h2>

		<div class="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
			<label class="flex items-center gap-2">
				<input type="radio" name="sim-mode" value="untilWin" bind:group={mode} disabled={running} />
				{m.mode_until_win()}
			</label>
			<label class="flex items-center gap-2">
				<input type="radio" name="sim-mode" value="fixed" bind:group={mode} disabled={running} />
				{m.mode_fixed()}
			</label>
			{#if mode === 'fixed'}
				<label class="flex items-center gap-2">
					<span class="text-emerald-50/70">{m.fixed_count_label()}</span>
					<input
						type="number"
						min="1"
						max={MAX_DEALS}
						step="1"
						bind:value={fixedCount}
						disabled={running}
						class="w-36 rounded-lg border border-white/15 bg-felt-900 px-3 py-1.5 tabular-nums"
					/>
				</label>
			{/if}
			{#if running}
				<button
					type="button"
					class="rounded-lg bg-red-800 px-6 py-2 font-bold text-red-50 transition hover:bg-red-700"
					onclick={stopSimulation}
				>
					{m.stop_button()}
				</button>
			{:else}
				<button
					type="button"
					class="rounded-lg bg-gold-400 px-6 py-2 font-bold text-felt-950 transition hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-40"
					onclick={startSimulation}
					disabled={!engineReady || dealing}
				>
					{m.run_button()}
				</button>
			{/if}
		</div>

		{#if running && progress}
			<div class="mt-5">
				<div class="h-2 overflow-hidden rounded-full bg-white/10">
					{#if runTarget}
						<div
							class="h-full rounded-full bg-gold-400 transition-[width] duration-200"
							style="width: {Math.min((progress.deals / runTarget) * 100, 100)}%"
						></div>
					{:else}
						<div class="indeterminate h-full w-1/3 rounded-full bg-gold-400"></div>
					{/if}
				</div>
				<p class="mt-2 text-sm text-emerald-50/70 tabular-nums">
					{progress.deals.toLocaleString()}
					({formatSpeed(progress)}
					{m.per_second()})
				</p>
			</div>
		{/if}

		{#if simResult}
			<div class="mt-6 space-y-6" data-testid="sim-result">
				<p class="font-bold" class:text-gold-200={simResult.tenhouCount > 0}>
					{#if simResult.stopped}
						{m.sim_stopped()}
					{:else if simResult.tenhouCount > 0}
						{m.sim_tenhou_found()}
					{:else}
						{m.sim_no_tenhou()}
					{/if}
				</p>

				<dl class="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<div class="rounded-xl bg-white/5 p-3">
						<dt class="text-xs text-emerald-50/60">{m.stat_deals()}</dt>
						<dd class="mt-1 text-xl font-bold tabular-nums" data-testid="sim-deals">
							{simResult.deals.toLocaleString()}
						</dd>
					</div>
					<div class="rounded-xl bg-white/5 p-3">
						<dt class="text-xs text-emerald-50/60">{m.stat_tenhou()}</dt>
						<dd class="mt-1 text-xl font-bold tabular-nums text-gold-200">
							{simResult.tenhouCount.toLocaleString()}
						</dd>
					</div>
					<div class="rounded-xl bg-white/5 p-3">
						<dt class="text-xs text-emerald-50/60">{m.stat_speed()}</dt>
						<dd class="mt-1 text-xl font-bold tabular-nums">
							{formatSpeed(simResult)}
							<span class="text-xs font-normal text-emerald-50/60">{m.per_second()}</span>
						</dd>
					</div>
					<div class="rounded-xl bg-white/5 p-3">
						<dt class="text-xs text-emerald-50/60">{m.stat_elapsed()}</dt>
						<dd class="mt-1 text-xl font-bold tabular-nums">
							{formatElapsed(simResult.elapsedMs)}
							<span class="text-xs font-normal text-emerald-50/60">{m.seconds_short()}</span>
						</dd>
					</div>
				</dl>

				<ShareButtons text={simShareText(simResult)} url={simShareUrl(simResult)} />

				{#if simResult.winners.length > 0}
					<div>
						<h3 class="mb-2 font-bold text-emerald-50/90">{m.winning_hands_title()}</h3>
						<ul class="space-y-2">
							{#each simResult.winners.slice(0, MAX_WINNERS_SHOWN) as winner, i (i)}
								<li><Hand tiles={winner} small /></li>
							{/each}
						</ul>
						{#if simResult.winners.length > MAX_WINNERS_SHOWN}
							<p class="mt-2 text-sm text-emerald-50/60">
								{m.more_hands({ n: simResult.winners.length - MAX_WINNERS_SHOWN })}
							</p>
						{/if}
					</div>
				{/if}

				<div>
					<h3 class="mb-2 font-bold text-emerald-50/90">{m.shanten_dist_title()}</h3>
					<ShantenChart counts={simResult.shantenCounts} total={simResult.deals} />
				</div>
			</div>
		{/if}
	</section>
</main>

{#if celebrate}
	<TenhouOverlay onclose={() => (celebrate = false)} />
{/if}

<style>
	.indeterminate {
		animation: slide 1.2s ease-in-out infinite;
	}

	@keyframes slide {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(300%);
		}
	}
</style>
