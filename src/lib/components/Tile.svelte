<script lang="ts">
	import { base } from '$app/paths';
	import { tileFileName, tileLabel } from '$lib/mahjong/tiles';

	let { kind }: { kind: number } = $props();
</script>

<span class="tile" role="img" aria-label={tileLabel(kind)}>
	<img src="{base}/tiles/Front.svg" alt="" draggable="false" />
	<img src="{base}/tiles/{tileFileName(kind)}.svg" alt="" draggable="false" />
</span>

<style>
	.tile {
		position: relative;
		display: block;
		width: var(--tile-w, 2.5rem);
		aspect-ratio: 3 / 4;
		filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.35));
	}

	img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		user-select: none;
		-webkit-user-select: none;
	}
</style>
