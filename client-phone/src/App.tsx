import React, { useState, useEffect } from 'react';
import { socket } from './socket';
import SeatSelector from './components/SeatSelector';
import BetControls from './components/BetControls';
import HandView from './components/HandView';

// shared types
interface Card { suit: string; value: string; }
interface Seat {
  bets: number[];
  hands: Card[][];
  activeHand: number;
  done: boolean;
  balance: number;
}
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
    const handleState = (s: GameState) => {
      setState(s);
      if (seatIdx !== null && !s.seats[seatIdx]) setSeatIdx(null);
    };
    socket.on('state', handleState);
    return () => {
      socket.off('joined');
      socket.off('state', handleState);
    };
  }, [seatIdx]);

  const handleJoin = (playerName: string, balance: number) => {
    setName(playerName);
    socket.emit('join', { name: playerName, balance });
  };

  const handleBet = (amount: number) => {
    if (seatIdx !== null) socket.emit('bet', { seatIdx, amount });
  };

  const handleSkip = () => {
    if (seatIdx !== null) socket.emit('bet', { seatIdx, amount: 0 });
  };

  const handleQuit = () => {
    socket.emit('quit');
    setSeatIdx(null);
  };

  const handleHit = () => {
    if (seatIdx !== null) socket.emit('hit', { seatIdx });
  };

  const handleStand = () => {
    if (seatIdx !== null) socket.emit('stand', { seatIdx });
  };

  const handleDouble = () => {
    if (seatIdx !== null) socket.emit('double', { seatIdx });
  };

  const handleSplit = () => {
    if (seatIdx !== null) socket.emit('split', { seatIdx });
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
      <h1 className="text-2xl font-bold mb-2">Blackjack — Seat {seatIdx + 1}</h1>
      <p className="mb-4">Bankroll: ${seat?.balance ?? 0}</p>
      {state.phase === 'bet' && (
        <BetControls
          balance={seat?.balance ?? 0}
          onBet={handleBet}
          onSkip={handleSkip}
          onQuit={handleQuit}
          disabled={!!seat?.bets.length}
        />
      )}
      {['play', 'settle'].includes(state.phase) && seat && (
        <HandView
          hands={seat.hands}
          bets={seat.bets}
          activeHand={seat.activeHand}
          balance={seat.balance}
          onHit={handleHit}
          onStand={handleStand}
          onDouble={handleDouble}
          onSplit={handleSplit}
          isTurn={state.currentSeat === seatIdx}
          phase={state.phase}
        />
      )}
    </div>
  );
}
