import { Card, GameState, Seat } from './types';

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

  joinSeat(
    socketId: string,
    name?: string,
    balance?: number,
    playerId?: string,
  ): { seatIdx: number; playerId: string } {
    if (playerId) {
      const existing = this.state.seats.findIndex(
        s => s && s.playerId === playerId,
      );
      if (existing !== -1) {
        const seat = this.state.seats[existing]!;
        seat.socketId = socketId;
        seat.connected = true;
        return { seatIdx: existing, playerId };
      }
    }

    if (name === undefined || balance === undefined)
      throw new Error('Name and balance required');

    const idx = this.state.seats.findIndex(s => s === null);
    if (idx === -1) throw new Error('Table full');

    const newId = playerId ?? Math.random().toString(36).slice(2);
    this.state.seats[idx] = {
      playerId: newId,
      socketId,
      connected: true,
      name,
      bets: [],
      hands: [],
      activeHand: 0,
      done: false,
      balance,
      nextBet: null,
    };
    return { seatIdx: idx, playerId: newId };
  }

  markDisconnected(socketId: string) {
    const idx = this.state.seats.findIndex(
      s => s && s.socketId === socketId,
    );
    if (idx === -1) return;
    const seat = this.state.seats[idx]!;
    seat.connected = false;
    if (this.state.phase === 'bet') {
      // auto place a zero bet so the round can proceed
      if (seat.bets.length > 0 && seat.bets[0] > 0) {
        // refund any existing bet
        seat.balance += seat.bets[0];
      }
      seat.bets = [0];
      seat.hands = [[]];
      seat.activeHand = 0;
      seat.done = true;
    } else if (this.state.phase === 'play') {
      if (!seat.done) {
        // stand on all remaining hands
        seat.activeHand = seat.hands.length;
        seat.done = true;
        if (this.state.currentSeat === idx) this.nextTurn();
      }
    } else if (this.state.phase === 'settle') {
      // queue a skip bet for the upcoming round
      if (seat.nextBet === null) seat.nextBet = 0;
    }
  }

  placeBet(seatIdx: number, amount: number) {
    const seat = this.state.seats[seatIdx];
    if (!seat) throw new Error();
    if (amount > seat.balance) throw new Error('Insufficient balance');
    if (this.state.phase === 'bet') {
      seat.bets = [amount];
      seat.hands = [[]];
      seat.activeHand = 0;
      seat.balance -= amount;
    } else if (this.state.phase === 'settle') {
      if (seat.nextBet !== null) throw new Error('Bet already queued');
      seat.nextBet = amount;
      seat.balance -= amount;
    } else {
      throw new Error();
    }
  }

  allBetsQueued(): boolean {
    return this.state.seats.every(s => s === null || s.nextBet !== null);
  }

  startPlay() {
    if (this.state.phase !== 'bet') return;
    // ensure all players have responded (bet or skip)
    for (const s of this.state.seats) if (s && s.bets.length === 0) return;
    const active = this.state.seats.filter(s => s && s.bets[0]! > 0);
    if (active.length === 0) {
      // everyone skipped
      this.state.phase = 'settle';
      return;
    }
    // deal two cards to each active player
    this.state.seats.forEach(s => {
      if (s) {
        if (s.bets[0]! > 0) {
          s.hands[0].push(this.dealCard(), this.dealCard());
          s.activeHand = 0;
          const hand = s.hands[0];
          const hv = this.handValue(hand);
          if (hv === 21 && hand.length === 2) {
            s.done = true;
            s.activeHand = s.hands.length;
          } else {
            s.done = false;
          }
        } else {
          s.done = true; // skipped this round
        }
      }
    });
    // deal only one card to the dealer; remaining cards are drawn later
    this.state.dealer.push(this.dealCard());
    this.state.phase = 'play';
    this.state.currentSeat = this.state.seats.findIndex(s => s !== null && !s.done);
    if (this.state.currentSeat === -1) {
      this.playDealer();
      this.settleBets();
    }
  }

  hit(seatIdx: number) {
    const seat = this.state.seats[seatIdx];
    if (!seat || this.state.currentSeat !== seatIdx) throw new Error();
    const hand = seat.hands[seat.activeHand];
    hand.push(this.dealCard());
    if (this.handValue(hand) >= 21) {
      seat.activeHand++;
      if (seat.activeHand >= seat.hands.length) {
        seat.done = true;
        this.nextTurn();
      }
    }
  }

  double(seatIdx: number) {
    const seat = this.state.seats[seatIdx];
    if (!seat || this.state.currentSeat !== seatIdx) throw new Error();
    const hand = seat.hands[seat.activeHand];
    if (hand.length !== 2) throw new Error('Cannot double after hitting');
    const bet = seat.bets[seat.activeHand];
    if (seat.balance < bet) throw new Error('Insufficient balance');
    seat.balance -= bet;
    seat.bets[seat.activeHand] += bet;
    hand.push(this.dealCard());
    seat.activeHand++;
    if (seat.activeHand >= seat.hands.length) {
      seat.done = true;
      this.nextTurn();
    }
  }

  split(seatIdx: number) {
    const seat = this.state.seats[seatIdx];
    if (!seat || this.state.currentSeat !== seatIdx) throw new Error();
    const hand = seat.hands[seat.activeHand];
    if (hand.length !== 2 || hand[0].value !== hand[1].value)
      throw new Error('Cannot split');
    const bet = seat.bets[seat.activeHand];
    if (seat.balance < bet) throw new Error('Insufficient balance');
    seat.balance -= bet;
    const card2 = hand.pop()!;
    seat.hands.splice(seat.activeHand + 1, 0, [card2]);
    seat.bets.splice(seat.activeHand + 1, 0, bet);
    // deal one card to each hand
    seat.hands[seat.activeHand].push(this.dealCard());
    seat.hands[seat.activeHand + 1].push(this.dealCard());
  }

  stand(seatIdx: number) {
    const seat = this.state.seats[seatIdx];
    if (!seat || this.state.currentSeat !== seatIdx) throw new Error();
    seat.activeHand++;
    if (seat.activeHand >= seat.hands.length) {
      seat.done = true;
      this.nextTurn();
    }
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
      if (!s) return;
      s.hands.forEach((hand, idx) => {
        const bet = s.bets[idx];
        if (!bet) return;
        const hv = this.handValue(hand);
        const blackjack = hv === 21 && hand.length === 2;
        if (hv > 21) return; // player bust
        if (dealerVal > 21 || hv > dealerVal) {
          const payout = blackjack ? bet * 2.5 : bet * 2;
          s.balance += payout;
        } else if (hv === dealerVal) {
          s.balance += bet; // push
        }
      });
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
        const bet = s.nextBet ?? 0;
        s.bets = [bet];
        s.hands = [[]];
        s.activeHand = 0;
        s.done = false;
        s.nextBet = null;
      }
    });
  }

  leaveSeat(socketId: string) {
    const idx = this.state.seats.findIndex(
      s => s && s.socketId === socketId,
    );
    if (idx !== -1) {
      const seat = this.state.seats[idx]!;
      if (this.state.phase === 'bet' && seat.bets[0] > 0) {
        seat.balance += seat.bets[0];
      }
      if (seat.nextBet !== null) seat.balance += seat.nextBet;
      this.state.seats[idx] = null;
    }
  }
}
