import React from 'react';
import Card from './Card';

interface CardType { suit: string; value: string; }
interface SeatType {
  name: string;
  bets: number[];
  balance: number;
  hands: CardType[][];
  activeHand: number;
  done: boolean;
  connected: boolean;
}
interface Props { state: { seats: (SeatType|null)[]; dealer: CardType[]; currentSeat: number|null; phase: string; }; }

export default function TableView({ state }: Props) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {state.seats.map((s, i) => (
        <div
          key={i}
          className={`bg-white bg-opacity-20 rounded-lg p-4 flex flex-col items-center ${
            s && !s.connected ? 'opacity-50' : ''
          }`}
        >
          {s ? (
            <>
              <div className="font-semibold mb-2">
                {s.name} (${s.balance})
                {!s.connected && (
                  <span className="ml-2 text-xs text-red-500">Disconnected</span>
                )}
              </div>
              {s.hands.map((hand, hIdx) => (
                <div
                  key={hIdx}
                  className={`mb-2 flex flex-col items-center ${
                    state.currentSeat === i && s.activeHand === hIdx
                      ? 'border-2 border-yellow-300 p-1'
                      : ''
                  }`}
                >
                  <div>Bet: {s.bets[hIdx] ?? 0}</div>
                  <div className="flex mt-2 space-x-1">
                    {hand.map((c, j) => (
                      <Card key={j} card={c} />
                    ))}
                  </div>
                </div>
              ))}
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
