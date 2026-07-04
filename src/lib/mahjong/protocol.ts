export type SimulationMode = 'untilWin' | 'fixed';

/** Hard cap on total deals per run, also used as the "until win" safety limit. */
export const MAX_DEALS = 100_000_000;

export type SimRequest =
	{ type: 'deal' } | { type: 'start'; mode: SimulationMode; maxDeals: number } | { type: 'stop' };

export interface SimStats {
	deals: number;
	elapsedMs: number;
	/** Occurrences per shanten number; index 0 is a win (-1), index 7 is 6 shanten. */
	shantenCounts: number[];
	tenhouCount: number;
}

export type SimResponse =
	| { type: 'ready' }
	| { type: 'dealt'; tiles: number[]; shanten: number }
	| ({ type: 'progress' } & SimStats)
	| ({ type: 'done'; winners: number[][]; stopped: boolean } & SimStats)
	| { type: 'error'; message: string };
