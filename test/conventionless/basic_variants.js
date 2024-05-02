import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { PLAYER, VARIANTS, expandShortCard, setup, takeTurn } from '../test-utils.js';
import HGroup from '../../src/conventions/h-group.js';
import { isCluable } from '../../src/variants.js';

import logger from '../../src/tools/logger.js';
import { CLUE } from '../../src/constants.js';

logger.setLevel(logger.LEVELS.ERROR);

// TODO: Make this actually conventionless and not dependant on the HGroup conventions?

describe('rainbow', () => {
	it('has rainbow possibilities from colour clues', () => {
		const game = setup(HGroup, [
			['xx', 'xx', 'xx', 'xx', 'xx'],
			['g2', 'b1', 'r2', 'r3', 'g5'],
		], {
			starting: PLAYER.BOB,
			variant: VARIANTS.RAINBOW
		});

		takeTurn(game, 'Bob clues red to Alice (slot 1)');

		assert.ok(game.common.thoughts[4].possible.has({ suitIndex: 4, rank: 1 }));
	});

	it('excludes rainbow possibilities from colour clues', () => {
		const game = setup(HGroup, [
			['xx', 'xx', 'xx', 'xx', 'xx'],
			['g3', 'p1', 'b3', 'b2', 'b5']
		], {
			starting: PLAYER.BOB,
			variant: VARIANTS.RAINBOW
		});

		takeTurn(game, 'Bob clues red to Alice (slot 5)');

		assert.ok(!game.common.thoughts[4].possible.has({ suitIndex: 4, rank: 1 }));
	});

	it('cannot clue rainbow', () => {
		assert.ok(!isCluable(VARIANTS.RAINBOW, { type: CLUE.COLOUR, value: 4 }));
	});
});

describe('pink', () => {
	it('has pink possibilities from number clues', () => {
		const game = setup(HGroup, [
			['xx', 'xx', 'xx', 'xx', 'xx'],
			['g2', 'b1', 'r2', 'r3', 'g5'],
		], {
			starting: PLAYER.BOB,
			variant: VARIANTS.PINK
		});

		takeTurn(game, 'Bob clues 1 to Alice (slot 1)');

		assert.ok(game.common.thoughts[4].possible.has({ suitIndex: 4, rank: 5 }));
	});

	it('excludes pink possibilities from number clues', () => {
		const game = setup(HGroup, [
			['xx', 'xx', 'xx', 'xx', 'xx'],
			['g2', 'b1', 'r2', 'r3', 'g5'],
		], {
			starting: PLAYER.BOB,
			variant: VARIANTS.PINK
		});

		takeTurn(game, 'Bob clues 1 to Alice (slot 5)');

		assert.ok(!game.common.thoughts[4].possible.has({ suitIndex: 4, rank: 5 }));
	});

	it('can clue pink', () => {
		assert.ok(isCluable(VARIANTS.PINK, { type: CLUE.COLOUR, value: 4 } ));
	});
});

describe('white', () => {
	it('eliminates white possibilities from colour clues', () => {
		const game = setup(HGroup, [
			['xx', 'xx', 'xx', 'xx', 'xx'],
			['g2', 'b1', 'r2', 'r3', 'g5'],
		], {
			starting: PLAYER.BOB,
			variant: VARIANTS.WHITE
		});

		takeTurn(game, 'Bob clues red to Alice (slot 1)');

		assert.ok(!game.common.thoughts[4].possible.has({ suitIndex: 4, rank: 1 }));
	});

	it('cannot clue white', () => {
		assert.ok(!isCluable(VARIANTS.WHITE, { type: CLUE.COLOUR, value: 4 }));
	});
});

describe('black', () => {
	it('sees only black as critical', () => {
		const game = setup(HGroup, [
			['xx', 'xx', 'xx', 'xx', 'xx'],
			['g2', 'b1', 'r2', 'r3', 'g5'],
		], {
			starting: PLAYER.BOB,
			variant: VARIANTS.BLACK
		});

		assert.ok(game.state.isCritical(expandShortCard('k1')));
		assert.ok(!game.state.isCritical(expandShortCard('r1')));
	});

	it('can clue black', () => {
		assert.ok(isCluable(VARIANTS.BLACK, { type: CLUE.COLOUR, value: 4 }));
	});
});
