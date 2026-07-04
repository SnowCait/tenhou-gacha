export const NUM_TILE_KINDS = 34;
export const HAND_SIZE = 14;

/** Shanten of a 14-tile hand: -1 (win) to 6. Distribution arrays use index = shanten + 1. */
export const SHANTEN_MIN = -1;
export const SHANTEN_MAX = 6;

// Tile kind index: 0-8 = 1-9 man, 9-17 = 1-9 pin, 18-26 = 1-9 sou,
// 27-33 = east, south, west, north, haku, hatsu, chun.
const FILE_NAMES = [
	'Man1',
	'Man2',
	'Man3',
	'Man4',
	'Man5',
	'Man6',
	'Man7',
	'Man8',
	'Man9',
	'Pin1',
	'Pin2',
	'Pin3',
	'Pin4',
	'Pin5',
	'Pin6',
	'Pin7',
	'Pin8',
	'Pin9',
	'Sou1',
	'Sou2',
	'Sou3',
	'Sou4',
	'Sou5',
	'Sou6',
	'Sou7',
	'Sou8',
	'Sou9',
	'Ton',
	'Nan',
	'Shaa',
	'Pei',
	'Haku',
	'Hatsu',
	'Chun'
] as const;

const LABELS = [
	'一萬',
	'二萬',
	'三萬',
	'四萬',
	'五萬',
	'六萬',
	'七萬',
	'八萬',
	'九萬',
	'一筒',
	'二筒',
	'三筒',
	'四筒',
	'五筒',
	'六筒',
	'七筒',
	'八筒',
	'九筒',
	'一索',
	'二索',
	'三索',
	'四索',
	'五索',
	'六索',
	'七索',
	'八索',
	'九索',
	'東',
	'南',
	'西',
	'北',
	'白',
	'發',
	'中'
] as const;

function assertTileKind(kind: number): void {
	if (!Number.isInteger(kind) || kind < 0 || kind >= NUM_TILE_KINDS) {
		throw new RangeError(`invalid tile kind: ${kind}`);
	}
}

/** File name (without extension) of the tile face SVG in static/tiles/. */
export function tileFileName(kind: number): string {
	assertTileKind(kind);
	return FILE_NAMES[kind];
}

/** Japanese reading of the tile, used for alt text. */
export function tileLabel(kind: number): string {
	assertTileKind(kind);
	return LABELS[kind];
}

/** Compact mpsz notation, e.g. [0,1,2,12,13,14,24,25,26,27,27,28,28,28] → "123m456p789s11222z". */
export function toMpsz(tiles: readonly number[]): string {
	for (const tile of tiles) assertTileKind(tile);
	const sorted = [...tiles].sort((a, b) => a - b);
	let out = '';
	for (const [suit, letter] of ['m', 'p', 's', 'z'].entries()) {
		const digits = sorted
			.filter((tile) => Math.floor(tile / 9) === suit)
			.map((tile) => (tile % 9) + 1)
			.join('');
		if (digits) out += digits + letter;
	}
	return out;
}
