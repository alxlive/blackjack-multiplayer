import React, { useState, useEffect } from 'react';
import { socket } from './socket';
import SeatSelector from './components/SeatSelector';
import BetControls from './components/BetControls';
import HandView from './components/HandView';

// shared types
interface Card { suit: string; value: string; }
interface Seat { bet: number; hand: Card[]; done: boolean; }
interface GameState {
  seats: (Seat | null)[];
  dealer: Card[];
  currentSeat: number | null;
  phase: 'bet' | 'play' | 'settle';
}

export default function App() {
  const [name, setName] = useState('');
  const [seatIdx, setSeatIdx] = useState<number | null>(null);
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    socket.on('joined', ({ seatIdx }) => setSeatIdx(seatIdx));
    socket.on('state', (s: GameState) => setState(s));
    return () => {
      socket.off('joined');
      socket.off('state');
    };
  }, []);

  const handleJoin = (playerName: string) => {
    setName(playerName);
    socket.emit('join', { name: playerName });
  };

  const handleBet = (amount: number) => {
    if (seatIdx !== null) socket.emit('bet', { seatIdx, amount });
  };

  const handleHit = () => {
    if (seatIdx !== null) socket.emit('hit', { seatIdx });
  };

  const handleStand = () => {
    if (seatIdx !== null) socket.emit('stand', { seatIdx });
  };

  if (seatIdx === null) {
    return <SeatSelector onJoin={handleJoin} />;
  }
  if (!state) {
    return <div className="flex items-center justify-center h-full">Connecting...</div>;
  }

  const seat = state.seats[seatIdx];

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Blackjack — Seat {seatIdx + 1}</h1>
      {state.phase === 'bet' && (
        <BetControls onBet={handleBet} disabled={seat?.bet! > 0} />
      )}
      {['play', 'settle'].includes(state.phase) && seat && (
        <HandView
          hand={seat.hand}
          onHit={handleHit}
          onStand={handleStand}
          isTurn={state.currentSeat === seatIdx}
          phase={state.phase}
        />
      )}
    </div>
  );
}
