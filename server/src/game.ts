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

  joinSeat(playerId: string, name: string, balance: number): number {
    const idx = this.state.seats.findIndex(s => s === null);
    if (idx === -1) throw new Error('Table full');
    this.state.seats[idx] = {
      id: playerId,
      name,
      bet: null,
      hand: [],
      done: false,
      balance,
    };
    return idx;
  }

  placeBet(seatIdx: number, amount: number) {
    const seat = this.state.seats[seatIdx];
    if (!seat || this.state.phase !== 'bet') throw new Error();
    if (amount > seat.balance) throw new Error('Insufficient balance');
    seat.bet = amount;
    seat.balance -= amount;
  }

  startPlay() {
    if (this.state.phase !== 'bet') return;
    // ensure all players have responded (bet or skip)
    for (const s of this.state.seats) if (s && s.bet === null) return;
    const active = this.state.seats.filter(s => s && s.bet! > 0);
    if (active.length === 0) {
      // everyone skipped
      this.state.phase = 'settle';
      return;
    }
    // deal two cards to each active player
    this.state.seats.forEach(s => {
      if (s) {
        if (s.bet! > 0) {
          s.hand.push(this.dealCard(), this.dealCard());
          s.done = false;
        } else {
          s.done = true; // skipped this round
        }
      }
    });
    // deal only one card to the dealer; remaining cards are drawn later
    this.state.dealer.push(this.dealCard());
    this.state.phase = 'play';
    this.state.currentSeat = this.state.seats.findIndex(s => s !== null && !s.done);
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

  double(seatIdx: number) {
    const seat = this.state.seats[seatIdx];
    if (!seat || this.state.currentSeat !== seatIdx) throw new Error();
    if (seat.bet === null) throw new Error();
    const additional = seat.bet;
    if (seat.balance < additional) throw new Error('Insufficient balance');
    seat.balance -= additional;
    seat.bet += additional;
    seat.hand.push(this.dealCard());
    seat.done = true;
    this.nextTurn();
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
      if (!s || s.bet === null || s.bet === 0) return;
      const hv = this.handValue(s.hand);
      const blackjack = hv === 21 && s.hand.length === 2;
      if (hv > 21) {
        return; // player bust
      }
      if (dealerVal > 21 || hv > dealerVal) {
        const payout = blackjack ? s.bet * 2.5 : s.bet * 2;
        s.balance += payout;
      } else if (hv === dealerVal) {
        s.balance += s.bet; // push
      }
    });
    this.state.phase = 'settle';
  }

  prepareNextRound() {
    this.state.deck = this.makeShuffledDeck();
    this.state.dealer = [];
    this.state.currentSeat = null;
    this.state.phase = 'bet';
    this.state.seats.forEach(s => {
      if (s) {
        s.bet = null; // keep balance for next round
        s.hand = [];
        s.done = false;
      }
    });
  }

  leaveSeat(playerId: string) {
    const idx = this.state.seats.findIndex(s => s && s.id === playerId);
    if (idx !== -1) this.state.seats[idx] = null;
  }
}
