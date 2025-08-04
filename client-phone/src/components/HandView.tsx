import React from 'react';
import { motion } from 'framer-motion';

interface Card { suit: string; value: string; }
interface Props {
  hand: Card[];
  onHit: () => void;
  onStand: () => void;
  isTurn: boolean;
  phase: 'play' | 'settle';
}

export default function HandView({ hand, onHit, onStand, isTurn, phase }: Props) {
  const total = hand.reduce((sum, c) => sum + (['J','Q','K'].includes(c.value) ? 10 : c.value === 'A' ? 11 : +c.value), 0);
  return (
    <div className="flex flex-col items-center">
      <div className="flex space-x-2 mb-4">
        {hand.map((c, i) => (
          <motion.div
            key={i}
            className="w-16 h-24 bg-white rounded-lg shadow flex items-center justify-center text-xl font-bold"
            layout
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {c.value}{c.suit}
          </motion.div>
        ))}
      </div>
      <div className="mb-4">Total: {total}</div>
      {phase === 'play' && (
        <div className="flex space-x-4">
          <button
            className="bg-yellow-500 px-4 py-2 rounded disabled:opacity-50"
            onClick={onHit}
            disabled={!isTurn}
          >Hit</button>
          <button
            className="bg-red-500 px-4 py-2 rounded disabled:opacity-50"
            onClick={onStand}
            disabled={!isTurn}
          >Stand</button>
        </div>
      )}
      {phase === 'settle' && (
        <div className="text-lg font-semibold">Round Over</div>
      )}
    </div>
  );
}
