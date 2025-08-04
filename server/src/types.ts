export type Card = { suit: '♠' | '♥' | '♦' | '♣'; value: string; weight: number };
export type Seat = {
  id: string;
  name: string;
  bets: number[];
  hands: Card[][];
  activeHand: number;
  done: boolean;
  balance: number;
};
export type GameState = {
  deck: Card[];
  seats: (Seat | null)[]; // 7 seats
  dealer: Card[];
  currentSeat: number | null;
  phase: 'bet' | 'play' | 'settle';
};
