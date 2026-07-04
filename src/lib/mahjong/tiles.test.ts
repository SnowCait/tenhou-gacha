import { describe, expect, it } from 'vitest';
import {
	NUM_TILE_KINDS,
	fromMpsz,
	parseHandMpsz,
	tileFileName,
	tileLabel,
	toEmoji,
	toMpsz
} from './tiles';

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

describe('fromMpsz', () => {
	it('round-trips with toMpsz', () => {
		const hand = [0, 1, 2, 12, 13, 14, 24, 25, 26, 27, 27, 28, 28, 28];
		expect(fromMpsz('123m456p789s11222z')).toEqual(hand);
		expect(fromMpsz(toMpsz(hand))).toEqual(hand);
	});

	it('parses partial hands and sorts', () => {
		expect(fromMpsz('123p')).toEqual([9, 10, 11]);
		expect(fromMpsz('12z321m')).toEqual([0, 1, 2, 27, 28]);
	});

	it('rejects malformed text', () => {
		expect(fromMpsz('')).toBeNull();
		expect(fromMpsz('123')).toBeNull();
		expect(fromMpsz('0m')).toBeNull();
		expect(fromMpsz('8z')).toBeNull();
		expect(fromMpsz('12x3m')).toBeNull();
		expect(fromMpsz('1M')).toBeNull();
		expect(fromMpsz('1m ')).toBeNull();
	});
});

describe('parseHandMpsz', () => {
	it('accepts a full 14-tile hand', () => {
		expect(parseHandMpsz('123m456p789s11222z')).toEqual([
			0, 1, 2, 12, 13, 14, 24, 25, 26, 27, 27, 28, 28, 28
		]);
	});

	it('rejects hands that are not exactly 14 tiles', () => {
		expect(parseHandMpsz('123m456p789s1122z')).toBeNull();
		expect(parseHandMpsz('123m456p789s112222z')).toBeNull();
	});

	it('rejects more than four of a kind', () => {
		expect(parseHandMpsz('11111m222z456789p')).toBeNull();
	});
});

describe('toEmoji', () => {
	it('maps suit boundaries to the right characters', () => {
		expect(toEmoji([0])).toBe('🀇');
		expect(toEmoji([8])).toBe('🀏');
		expect(toEmoji([9])).toBe('🀙');
		expect(toEmoji([18])).toBe('🀐');
		expect(toEmoji([27])).toBe('🀀');
		expect(toEmoji([31])).toBe('🀆');
		expect(toEmoji([32])).toBe('🀅');
		expect(toEmoji([33])).toBe('🀄');
	});

	it('formats a winning hand sorted', () => {
		expect(toEmoji([28, 27, 0, 1, 2, 12, 13, 14, 24, 25, 26, 27, 28, 28])).toBe('🀇🀈🀉🀜🀝🀞🀖🀗🀘🀀🀀🀁🀁🀁');
	});

	it('rejects out-of-range kinds', () => {
		expect(() => toEmoji([-1])).toThrow(RangeError);
		expect(() => toEmoji([NUM_TILE_KINDS])).toThrow(RangeError);
	});
});
