import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';

interface CardType { suit: string; value: string; }
interface SeatType { name: string; bet: number; hand: CardType[]; done: boolean; }
interface Props { state: { seats: (SeatType|null)[]; dealer: CardType[]; currentSeat: number|null; phase: string; }; }

export default function TableView({ state }: Props) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {state.seats.map((s, i) => (
        <div key={i} className="bg-white bg-opacity-20 rounded-lg p-4 flex flex-col items-center">
          {s ? (
            <>
              <div className="font-semibold mb-2">{s.name}</div>
              <div>Bet: {s.bet}</div>
              <div className="flex mt-2 space-x-1">
                {s.hand.map((c, j) => <Card key={j} card={c} />)}
              </div>
            </>
          ) : (
            <div className="opacity-50">Empty</div>
          )}
        </div>
      ))}
      <div className="col-span-4 bg-white bg-opacity-25 rounded-lg p-4 mt-4">
        <div className="text-center font-semibold text-white mb-2">Dealer</div>
        <div className="flex justify-center space-x-1">
          {state.dealer.map((c, i) => <Card key={i} card={c} />)}
        </div>
      </div>
    </div>
  );
}
