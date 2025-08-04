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
  nextBet: number | null;
}
interface GameState {
  seats: (Seat | null)[];
  dealer: Card[];
  currentSeat: number | null;
  phase: 'bet' | 'play' | 'settle';
}

export default function App() {
  const [name, setName] = useState(() => localStorage.getItem('name') || '');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [shouldRejoin, setShouldRejoin] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [seatIdx, setSeatIdx] = useState<number | null>(null);
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('playerId');
    if (storedId) {
      if (window.confirm('Rejoin your previous game?')) {
        setPlayerId(storedId);
        setShouldRejoin(true);
      } else {
        localStorage.removeItem('playerId');
        localStorage.removeItem('name');
      }
    }
    setCheckedStorage(true);
  }, []);

  useEffect(() => {
    const handleConnect = () => {
      if (playerId && shouldRejoin) {
        socket.emit('join', { playerId });
      }
    };

    handleConnect();
    socket.on('connect', handleConnect);

    socket.on('joined', ({ seatIdx, playerId: pid }) => {
      setSeatIdx(seatIdx);
      setPlayerId(pid);
      setShouldRejoin(true);
      localStorage.setItem('playerId', pid);
      if (name) localStorage.setItem('name', name);
    });

    const handleState = (s: GameState) => {
      setState(s);
      if (seatIdx !== null && !s.seats[seatIdx]) setSeatIdx(null);
    };
    socket.on('state', handleState);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('joined');
      socket.off('state', handleState);
    };
  }, [playerId, shouldRejoin, seatIdx, name]);

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
    setPlayerId(null);
    setShouldRejoin(false);
    localStorage.removeItem('playerId');
    localStorage.removeItem('name');
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

  if (!checkedStorage) return null;
  if (seatIdx === null) {
    if (!playerId) return <SeatSelector onJoin={handleJoin} />;
    return <div className="flex items-center justify-center h-full">Connecting...</div>;
  }
  if (!state) {
    return <div className="flex items-center justify-center h-full">Connecting...</div>;
  }

  const seat = state.seats[seatIdx];

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">Blackjack — Seat {seatIdx + 1}</h1>
      <p className="mb-4">Bankroll: ${seat?.balance ?? 0}</p>
      {['bet', 'settle'].includes(state.phase) && (
        <BetControls
          balance={seat?.balance ?? 0}
          onBet={handleBet}
          onSkip={handleSkip}
          onQuit={handleQuit}
          disabled={state.phase === 'bet' ? !!seat?.bets.length : seat?.nextBet != null}
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
          dealer={state.dealer}
        />
      )}
    </div>
  );
}
