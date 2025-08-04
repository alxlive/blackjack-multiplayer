import { Card, GameState, Seat } from './types';
import { randomFillSync } from 'crypto';

export class Game {
  state: GameState;

  constructor() {
    this.state = this.resetState();
  }

  resetState(): GameState {
    return {
      deck: this.makeShuffledDeck(),
      seats: Array(7).fill(null),
      dealer: [],
      currentSeat: null,
      phase: 'bet',
    };
  }

  makeShuffledDeck(): Card[] {
    const suits = ['♠', '♥', '♦', '♣'] as const;
    const values = [
      { value: 'A', weight: 11 },
      { value: '2', weight: 2 },
      { value: '3', weight: 3 },
      { value: '4', weight: 4 },
      { value: '5', weight: 5 },
      { value: '6', weight: 6 },
      { value: '7', weight: 7 },
      { value: '8', weight: 8 },
      { value: '9', weight: 9 },
      { value: '10', weight: 10 },
      { value: 'J', weight: 10 },
      { value: 'Q', weight: 10 },
      { value: 'K', weight: 10 }
    ];
    const deck: Card[] = [];
    for (const suit of suits) {
      for (const v of values) {
        deck.push({ suit, value: v.value, weight: v.weight });
      }
    }
    // Fisher-Yates
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  dealCard(): Card { return this.state.deck.shift()!; }

  joinSeat(playerId: string, name: string): number {
    const idx = this.state.seats.findIndex(s => s === null);
    if (idx === -1) throw new Error('Table full');
    this.state.seats[idx] = { id: playerId, name, bet: 0, hand: [], done: false };
    return idx;
  }

  placeBet(seatIdx: number, amount: number) {
    const seat = this.state.seats[seatIdx];
    if (!seat || this.state.phase !== 'bet') throw new Error();
    seat.bet = amount;
  }

  startPlay() {
    if (this.state.phase !== 'bet') return;
    // require all bets >0
    for (const s of this.state.seats) if (s && s.bet === 0) return;
    // deal two cards each
    this.state.seats.forEach(s => {
      if (s) {
        s.hand.push(this.dealCard(), this.dealCard());
      }
    });
    this.state.dealer.push(this.dealCard(), this.dealCard());
    this.state.phase = 'play';
    this.state.currentSeat = this.state.seats.findIndex(s => s !== null);
  }

  hit(seatIdx: number) {
    const seat = this.state.seats[seatIdx];
    if (!seat || this.state.currentSeat !== seatIdx) throw new Error();
    seat.hand.push(this.dealCard());
    if (this.handValue(seat.hand) >= 21) {
      seat.done = true;
      this.nextTurn();
    }
  }

  stand(seatIdx: number) {
    const seat = this.state.seats[seatIdx];
    if (!seat || this.state.currentSeat !== seatIdx) throw new Error();
    seat.done = true;
    this.nextTurn();
  }

  nextTurn() {
    const next = this.state.seats.findIndex((s, i) => s !== null && !s.done && i > (this.state.currentSeat ?? -1));
    if (next !== -1) {
      this.state.currentSeat = next;
    } else {
      this.playDealer();
      this.settleBets();
      this.resetRound();
    }
  }

  handValue(cards: Card[]): number {
    let total = cards.reduce((sum, c) => sum + c.weight, 0);
    // adjust for aces
    let aces = cards.filter(c => c.value === 'A').length;
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
  }

  playDealer() {
    while (this.handValue(this.state.dealer) < 17) {
      this.state.dealer.push(this.dealCard());
    }
  }

  settleBets() {
    const dealerVal = this.handValue(this.state.dealer);
    this.state.seats.forEach(s => {
      if (!s) return;
      const hv = this.handValue(s.hand);
      if (hv <= 21 && (hv > dealerVal || dealerVal > 21)) {
        // win: pay 1:1
        s.bet *= 2;
      } // else lose: bet lost
    });
    this.state.phase = 'settle';
  }

  resetRound() {
    setTimeout(() => { this.state = this.resetState(); }, 5000);
  }
}
