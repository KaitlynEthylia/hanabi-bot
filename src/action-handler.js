import { CLUE } from'./constants.js';
import { Card } from'./basics/Card.js';
import logger from'./logger.js';
import * as Basics from'./basics.js';
import * as Utils from'./util.js';

/**
 * @typedef {import('./types.js').Action} Action
 * @typedef {import('./types.js').ClueAction} ClueAction
 * @typedef {import('./types.js').DiscardAction} DiscardAction
 * @typedef {import('./types.js').CardAction} CardAction
 * @typedef {import('./types.js').PlayAction} PlayAction
 * @typedef {import('./basics/State.js').State} State
 */

/**
 * @this State
 * @param {Action} 	action
 * @param {boolean} [catchup]	Whether the bot should take an action or not as a result of this action.
 * */
export function handle_action(action, catchup = false) {
	this.actionList.push(action);

	switch(action.type) {
		case 'clue': {
			// {type: 'clue', clue: { type: 1, value: 1 }, giver: 0, list: [ 8, 9 ], target: 1, turn: 0}
			const { giver, target, list, clue } = action;
			const [playerName, targetName] = [giver, target].map(index => this.playerNames[index]);
			let clue_value;

			if (clue.type === CLUE.COLOUR) {
				clue_value = this.suits[clue.value].toLowerCase();
			}
			else {
				clue_value = clue.value;
			}
			logger.warn(`${playerName} clues ${clue_value} to ${targetName}`);

			this.interpret_clue(this, action);
			this.last_actions[giver] = action;

			// Remove the newly_clued flag
			for (const order of list) {
				const card = this.hands[target].findOrder(order);
				card.newly_clued = false;
			}
			break;
		}
		case 'discard': {
			// {type: 'discard', playerIndex: 2, order: 12, suitIndex: 0, rank: 3, failed: true}
			const { order, playerIndex, rank, suitIndex, failed } = action;
			const card = this.hands[playerIndex].findOrder(order);
			const playerName = this.playerNames[playerIndex];

			// Assign the card's identity if it isn't already known
			Object.assign(card, {suitIndex, rank});
			logger.warn(`${playerName} ${failed ? 'bombs' : 'discards'} ${Utils.logCard(card)}`);

			Basics.onDiscard(this, action);
			this.interpret_discard(this, action, card);
			this.last_actions[playerIndex] = action;
			break;
		}
		case 'draw': {
			// { type: 'draw', playerIndex: 0, order: 2, suitIndex: 1, rank: 2 },
			Basics.onDraw(this, action);
			break;
		}
		case 'gameOver':
			logger.info('gameOver', action);
			break;
		case 'turn': {
			//  { type: 'turn', num: 1, currentPlayerIndex: 1 }
			const { currentPlayerIndex } = action;
			if (currentPlayerIndex === this.ourPlayerIndex && !catchup) {
				setTimeout(() => Utils.sendCmd('action', this.take_action(this)), 2000);

				// Update notes on cards
				for (const card of this.hands[this.ourPlayerIndex]) {
					if (card.clued || card.finessed || card.chop_moved) {
						Utils.writeNote(this.turn_count + 1, card, this.tableID);
					}
				}
			}

			this.update_turn(this, action);
			this.turn_count++;
			break;
		}
		case 'play': {
			const { order, playerIndex, rank, suitIndex } = action;
			const card = this.hands[playerIndex].findOrder(order);
			const playerName = this.playerNames[playerIndex];

			// Assign the card's identity if it isn't already known
			Object.assign(card, {suitIndex, rank});
			logger.warn(`${playerName} plays ${Utils.logCard(card)}`);

			this.interpret_play(this, action);
			this.last_actions[playerIndex] = action;
			break;
		}
		case 'rewind': {
			const { order, playerIndex, suitIndex, rank } = action;

			const card = this.hands[playerIndex].findOrder(order);
			if (card === undefined) {
				throw new Error('Could not find card to rewrite!');
			}
			card.possible = [new Card(suitIndex, rank)];
			card.inferred = [new Card(suitIndex, rank)];
			card.finessed = true;
			card.rewinded = true;
			break;
		}
		default:
			break;
	}
}
