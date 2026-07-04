<script lang="ts">
	import { base } from '$app/paths';
	import Tile from './Tile.svelte';

	let {
		tiles,
		animate = false,
		small = false
	}: { tiles: readonly number[]; animate?: boolean; small?: boolean } = $props();
</script>

<div class="hand" class:small>
	{#each tiles as kind, i (i)}
		{#if animate}
			<span class="flip" style="animation-delay: {i * 55}ms">
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
		perspective: 800px;
	}

	.hand.small {
		--tile-w: clamp(0.9rem, 3.5vw, 1.6rem);
	}

	.flip {
		position: relative;
		display: block;
		width: var(--tile-w);
		aspect-ratio: 3 / 4;
		transform-style: preserve-3d;
		animation: flip-in 480ms ease-out both;
	}

	.side {
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}

	.side.back img {
		width: 100%;
		height: 100%;
		filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.35));
	}

	.side.front {
		transform: rotateY(180deg);
	}

	@keyframes flip-in {
		from {
			transform: rotateY(0deg);
		}
		to {
			transform: rotateY(180deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.flip {
			animation: none;
			transform: rotateY(180deg);
		}
	}
</style>
