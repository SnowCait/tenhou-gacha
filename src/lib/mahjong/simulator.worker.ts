import init, { deal, simulate } from '$lib/wasm/pkg/tenhou_sim';
import wasmUrl from '$lib/wasm/pkg/tenhou_sim_bg.wasm?url';
import { MAX_DEALS, type SimRequest, type SimResponse, type SimulationMode } from './protocol';

const SHANTEN_BUCKETS = 8;
const CHUNK_SIZE = 1 << 17;

const ready = init({ module_or_path: wasmUrl });
ready.then(
	() => post({ type: 'ready' }),
	(error) => post({ type: 'error', message: String(error) })
);

let running = false;
let stopRequested = false;

function post(message: SimResponse): void {
	self.postMessage(message);
}

function randomSeed(): bigint {
	const buffer = new BigUint64Array(1);
	crypto.getRandomValues(buffer);
	return buffer[0];
}

/** Lets queued messages (e.g. a stop request) run before the next chunk. */
function yieldToEvents(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve));
}

async function run(mode: SimulationMode, maxDeals: number): Promise<void> {
	const untilWin = mode === 'untilWin';
	const target = untilWin ? MAX_DEALS : Math.min(Math.max(Math.trunc(maxDeals), 1), MAX_DEALS);
	const shantenCounts = new Array<number>(SHANTEN_BUCKETS).fill(0);
	const winners: number[][] = [];
	let deals = 0;
	const startedAt = performance.now();

	while (deals < target && !stopRequested) {
		const chunk = simulate(randomSeed(), Math.min(CHUNK_SIZE, target - deals), untilWin);
		deals += chunk.deals;
		chunk.shanten_counts.forEach((count, i) => (shantenCounts[i] += count));
		const flat = chunk.winners;
		for (let i = 0; i < flat.length; i += 14) {
			winners.push(Array.from(flat.subarray(i, i + 14)));
		}
		chunk.free();

		post({
			type: 'progress',
			deals,
			elapsedMs: performance.now() - startedAt,
			shantenCounts: [...shantenCounts],
			tenhouCount: winners.length
		});

		if (untilWin && winners.length > 0) break;
		await yieldToEvents();
	}

	post({
		type: 'done',
		deals,
		elapsedMs: performance.now() - startedAt,
		shantenCounts,
		tenhouCount: winners.length,
		winners,
		stopped: stopRequested
	});
}

self.onmessage = async (event: MessageEvent<SimRequest>) => {
	const message = event.data;
	try {
		switch (message.type) {
			case 'deal': {
				await ready;
				const result = deal(randomSeed());
				post({ type: 'dealt', tiles: Array.from(result.tiles), shanten: result.shanten });
				result.free();
				break;
			}
			case 'start': {
				if (running) break;
				running = true;
				stopRequested = false;
				try {
					await ready;
					await run(message.mode, message.maxDeals);
				} finally {
					running = false;
				}
				break;
			}
			case 'stop': {
				stopRequested = true;
				break;
			}
		}
	} catch (error) {
		running = false;
		post({ type: 'error', message: String(error) });
	}
};
