<script lang="ts">
	import { base } from '$app/paths';
	import Tile from './Tile.svelte';

	let {
		tiles,
		animate = false,
		small = false,
		faceDown = false
	}: {
		tiles: readonly number[];
		animate?: boolean;
		small?: boolean;
		faceDown?: boolean;
	} = $props();
</script>

<div class="hand" class:small>
	{#each tiles as kind, i (i)}
		{#if faceDown}
			<span class="flip static">
				<span class="side back">
					<img src="{base}/tiles/Back.svg" alt="" draggable="false" />
				</span>
			</span>
		{:else if animate}
			<span class="flip" style="--delay: {i * 55}ms">
				<span class="side back">
					<img src="{base}/tiles/Back.svg" alt="" draggable="false" />
				</span>
				<span class="side front"><Tile {kind} /></span>
			</span>
		{:else}
			<Tile {kind} />
		{/if}
	{/each}
</div>

<style>
	.hand {
		--tile-w: clamp(1.15rem, 6vw, 2.75rem);
		display: flex;
		gap: clamp(1px, 0.4vw, 5px);
	}

	.hand.small {
		--tile-w: clamp(0.9rem, 3.5vw, 1.6rem);
	}

	.flip {
		position: relative;
		display: block;
		width: var(--tile-w);
		min-width: 0;
		aspect-ratio: 3 / 4;
	}

	/* Dealt hand: back/front cross-fade in place, no rotation. */
	.flip:not(.static) .side.back {
		animation: reveal-fade-out 480ms ease-out var(--delay, 0ms) both;
	}

	.flip:not(.static) .side.front {
		animation: reveal-fade-in 480ms ease-out var(--delay, 0ms) both;
	}

	.side {
		position: absolute;
		inset: 0;
	}

	.side.back {
		opacity: 1;
	}

	.side.front {
		opacity: 0;
	}

	.side.back img {
		width: 100%;
		height: 100%;
		filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.35));
	}

	@keyframes reveal-fade-out {
		0%,
		40% {
			opacity: 1;
		}
		60%,
		100% {
			opacity: 0;
		}
	}

	@keyframes reveal-fade-in {
		0%,
		40% {
			opacity: 0;
		}
		60%,
		100% {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.flip:not(.static) .side.back {
			animation: none;
			opacity: 0;
		}

		.flip:not(.static) .side.front {
			animation: none;
			opacity: 1;
		}
	}
</style>
