export type Card = { suit: '♠' | '♥' | '♦' | '♣'; value: string; weight: number };
export type Seat = { id: string; name: string; bet: number | null; hand: Card[]; done: boolean };
export type GameState = {
  deck: Card[];
  seats: (Seat | null)[]; // 7 seats
  dealer: Card[];
  currentSeat: number | null;
  phase: 'bet' | 'play' | 'settle';
};
