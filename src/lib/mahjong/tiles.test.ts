import { describe, expect, it } from 'vitest';
import { NUM_TILE_KINDS, tileFileName, tileLabel, toMpsz } from './tiles';

describe('tileFileName', () => {
	it('maps suit boundaries to the right images', () => {
		expect(tileFileName(0)).toBe('Man1');
		expect(tileFileName(8)).toBe('Man9');
		expect(tileFileName(9)).toBe('Pin1');
		expect(tileFileName(18)).toBe('Sou1');
		expect(tileFileName(26)).toBe('Sou9');
		expect(tileFileName(27)).toBe('Ton');
		expect(tileFileName(33)).toBe('Chun');
	});

	it('rejects out-of-range kinds', () => {
		expect(() => tileFileName(-1)).toThrow(RangeError);
		expect(() => tileFileName(NUM_TILE_KINDS)).toThrow(RangeError);
		expect(() => tileFileName(1.5)).toThrow(RangeError);
	});
});

describe('tileLabel', () => {
	it('returns Japanese readings', () => {
		expect(tileLabel(0)).toBe('一萬');
		expect(tileLabel(17)).toBe('九筒');
		expect(tileLabel(31)).toBe('白');
	});
});

describe('toMpsz', () => {
	it('formats a standard winning hand', () => {
		expect(toMpsz([0, 1, 2, 12, 13, 14, 24, 25, 26, 27, 27, 28, 28, 28])).toBe(
			'123m456p789s11222z'
		);
	});

	it('sorts tiles before formatting', () => {
		expect(toMpsz([28, 0, 27, 2, 1])).toBe('123m12z');
	});

	it('omits empty suits', () => {
		expect(toMpsz([9, 10, 11])).toBe('123p');
		expect(toMpsz([])).toBe('');
	});
});
