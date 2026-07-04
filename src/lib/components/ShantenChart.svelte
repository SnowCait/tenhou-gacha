<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	let { counts, total }: { counts: readonly number[]; total: number } = $props();

	const max = $derived(Math.max(...counts, 1));

	function rowLabel(index: number): string {
		if (index === 0) return m.shanten_row_win();
		if (index === 1) return m.shanten_tenpai();
		return m.shanten_n({ n: index - 1 });
	}

	function percentText(count: number): string {
		if (total === 0 || count === 0) return '0%';
		const percent = (count / total) * 100;
		const text =
			percent >= 1
				? percent.toFixed(1)
				: percent.toLocaleString(undefined, { maximumSignificantDigits: 2 });
		return `${text}%`;
	}
</script>

<div class="space-y-1" data-testid="shanten-chart">
	{#each counts as count, i (i)}
		<div class="flex items-center gap-2 text-sm">
			<span class="w-14 shrink-0 text-right text-emerald-50/70">{rowLabel(i)}</span>
			<div class="h-4 flex-1 overflow-hidden rounded-r bg-white/5">
				<div
					class="h-full rounded-r bg-gold-500"
					style="width: {(count / max) * 100}%"
					class:min-w-0.5={count > 0}
				></div>
			</div>
			<span class="w-36 shrink-0 text-right tabular-nums">
				{count.toLocaleString()}
				<span class="text-emerald-50/60">({percentText(count)})</span>
			</span>
		</div>
	{/each}
</div>
