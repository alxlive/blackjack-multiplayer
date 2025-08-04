import React from 'react';
import { motion } from 'framer-motion';

interface Card { suit: string; value: string; }
interface Props {
  hands: Card[][];
  bets: number[];
  activeHand: number;
  balance: number;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  isTurn: boolean;
  phase: 'play' | 'settle';
  dealer: Card[];
}

export default function HandView({
  hands,
  bets,
  activeHand,
  balance,
  onHit,
  onStand,
  onDouble,
  onSplit,
  isTurn,
  phase,
  dealer,
}: Props) {
  const calcTotal = (hand: Card[]) =>
    hand.reduce(
      (sum, c) =>
        sum + (['J', 'Q', 'K'].includes(c.value) ? 10 : c.value === 'A' ? 11 : +c.value),
      0
    );
  const currentHand = hands[activeHand] || [];
  const canSplit =
    isTurn &&
    currentHand.length === 2 &&
    currentHand[0].value === currentHand[1].value &&
    balance >= (bets[activeHand] || 0);

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center mb-4">
        <div className="text-sm mb-2">Dealer</div>
        <div className="flex space-x-1">
          {dealer.map((c, i) => (
            <motion.div
              key={i}
              className="w-12 h-20 bg-white rounded-lg shadow flex items-center justify-center text-lg font-bold"
              layout
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              {c.value}
              {c.suit}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="flex space-x-4 mb-4">
        {hands.map((hand, idx) => (
          <div
            key={idx}
            className={`flex flex-col items-center ${
              idx === activeHand ? 'border-2 border-yellow-400 p-2' : 'opacity-50'
            }`}
          >
            <div className="flex space-x-1 mb-2">
              {hand.map((c, i) => (
                <motion.div
                  key={i}
                  className="w-12 h-20 bg-white rounded-lg shadow flex items-center justify-center text-lg font-bold"
                  layout
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  {c.value}
                  {c.suit}
                </motion.div>
              ))}
            </div>
            <div className="text-sm">Bet: {bets[idx] ?? 0}</div>
            <div className="text-sm">Total: {calcTotal(hand)}</div>
          </div>
        ))}
      </div>
      {phase === 'play' && (
        <div className="flex space-x-4">
          <button
            className="bg-yellow-500 px-4 py-2 rounded disabled:opacity-50"
            onClick={onHit}
            disabled={!isTurn}
          >
            Hit
          </button>
          <button
            className="bg-green-500 px-4 py-2 rounded disabled:opacity-50"
            onClick={onSplit}
            disabled={!canSplit}
          >
            Split
          </button>
          <button
            className="bg-blue-500 px-4 py-2 rounded disabled:opacity-50"
            onClick={onDouble}
            disabled={!isTurn}
          >
            Double
          </button>
          <button
            className="bg-red-500 px-4 py-2 rounded disabled:opacity-50"
            onClick={onStand}
            disabled={!isTurn}
          >
            Stand
          </button>
        </div>
      )}
      {phase === 'settle' && <div className="text-lg font-semibold">Round Over</div>}
    </div>
  );
}

