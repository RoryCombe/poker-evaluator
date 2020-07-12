import * as fs from 'fs';
import * as path from 'path';

import { DECK, HAND_TYPES } from './constants';
import { EvaluatedHand } from './types';
import ThreeCardConverter from './three-card-converter';

// This is outside the class so evalHand is static, to keep same api as @chenosaurus/poker-evaluator
const RANKS_DATA = fs.readFileSync(path.join(__dirname, '../data/HandRanks.dat'));

export class PokerEvaluator {
  public static evalHand(cards: string[]): EvaluatedHand {
    if (!RANKS_DATA) {
      throw new Error('HandRanks.dat not loaded.');
    }

    if (cards.length !== 7 && cards.length !== 6 && cards.length !== 5 && cards.length !== 3) {
      throw new Error(`Hand must be 3, 5, 6, or 7 cards, but got ${cards.length}`);
    }

    cards = this.convertInputToLowerCase(cards);
    if (!this.deckContainsInput(cards)) {
      throw new Error(`Please supply input as a valid string[] of "cards".
        See the keys of src/constants/deck.const.ts for the deck's card values`
      );
    }

    // If a 3 card hand, fill in to make 5 card
    if (cards.length === 3) {
      cards = ThreeCardConverter.fillHand(cards);
    }

    return this.evaluate(cards);
  }

  private static convertInputToLowerCase(cards: string[]): string[] {
    return cards.map(card => card && card.toLowerCase());
  }

  private static deckContainsInput(cards: string[]): boolean {
    return cards.every(card => Object.keys(DECK).includes(card));
  }

  private static evaluate(cards: string[]): EvaluatedHand {
    const cardValues = cards.map(card => DECK[card]);

    let p = 53;
    cardValues.forEach(cardValue => p = this.evalCard(p + cardValue));

    if (cardValues.length === 5 || cardValues.length === 6) {
      p = this.evalCard(p);
    }

    return {
      handType: p >> 12,
      handRank: p & 0x00000fff,
      value: p,
      handName: HAND_TYPES[p >> 12]
    }
  }

  private static evalCard(card: number): number {
    return RANKS_DATA.readUInt32LE(card * 4);
  }
}
