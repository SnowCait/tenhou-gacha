<script lang="ts">
	let { onclose }: { onclose: () => void } = $props();

	const CONFETTI_COLORS = ['#f2d67e', '#e8c052', '#d3a83c', '#ffffff', '#d43a3a'];

	$effect(() => {
		let stopped = false;
		let interval: ReturnType<typeof setInterval> | undefined;

		(async () => {
			const confetti = (await import('canvas-confetti')).default;
			if (stopped) return;
			const fire = (particleCount: number, origin: { x: number; y: number }) =>
				confetti({
					particleCount,
					spread: 90,
					startVelocity: 40,
					origin,
					colors: CONFETTI_COLORS,
					disableForReducedMotion: true
				});
			fire(180, { x: 0.5, y: 0.65 });
			interval = setInterval(() => {
				fire(70, { x: Math.random(), y: Math.random() * 0.4 + 0.1 });
			}, 400);
			setTimeout(() => clearInterval(interval), 3000);
		})();

		return () => {
			stopped = true;
			if (interval) clearInterval(interval);
		};
	});
</script>

<button
	type="button"
	class="fixed inset-0 z-40 flex cursor-pointer flex-col items-center justify-center gap-6 bg-felt-950/80 backdrop-blur-sm"
	onclick={onclose}
	data-testid="tenhou-overlay"
>
	<span
		class="tenhou-text font-display text-8xl font-bold tracking-widest text-gold-200 sm:text-9xl"
	>
		天和
	</span>
</button>

<style>
	.tenhou-text {
		text-shadow:
			0 0 20px rgb(232 192 82 / 0.8),
			0 0 60px rgb(232 192 82 / 0.5),
			0 0 120px rgb(232 192 82 / 0.3);
		animation: tenhou-pop 700ms cubic-bezier(0.16, 1.4, 0.4, 1) both;
	}

	@keyframes tenhou-pop {
		from {
			transform: scale(0.2) rotate(-6deg);
			opacity: 0;
		}
		to {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tenhou-text {
			animation: none;
		}
	}
</style>
