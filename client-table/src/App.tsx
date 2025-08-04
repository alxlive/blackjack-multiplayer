import React, { useState, useEffect } from 'react';
import { socket } from './socket';
import TableView from './components/TableView';

interface Card { suit: string; value: string; }
interface Seat {
  name: string;
  bets: number[];
  balance: number;
  hands: Card[][];
  activeHand: number;
  done: boolean;
  connected: boolean;
}
interface GameState {
  seats: (Seat | null)[];
  dealer: Card[];
  currentSeat: number | null;
  phase: 'bet' | 'play' | 'settle';
}

export default function App() {
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    socket.on('state', (s: GameState) => setState(s));
    return () => { socket.off('state'); };
  }, []);

  if (!state) return <div className="flex items-center justify-center h-full text-white">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6 text-center">Blackjack Table</h1>
      <TableView state={state} />
    </div>
  );
}
