export type Card = { suit: '♠' | '♥' | '♦' | '♣'; value: string; weight: number };
export type Seat = {
  playerId: string;
  socketId: string;
  connected: boolean; // whether player's socket is currently connected
  name: string;
  bets: number[];
  hands: Card[][];
  activeHand: number;
  done: boolean;
  balance: number;
  // wager queued for upcoming round; null until player responds
  nextBet: number | null;
};
export type GameState = {
  deck: Card[];
  seats: (Seat | null)[]; // 7 seats
  dealer: Card[];
  currentSeat: number | null;
  phase: 'bet' | 'play' | 'settle';
};
