import React, { useState } from 'react';

interface Props { onBet: (amount: number) => void; disabled?: boolean; }

export default function BetControls({ onBet, disabled }: Props) {
  const [amount, setAmount] = useState(10);
  return (
    <div className="flex flex-col items-center">
      <label className="mb-2">Bet Amount</label>
      <input
        type="number"
        className="border p-2 w-32 mb-4"
        min={1}
        value={amount}
        onChange={e => setAmount(+e.target.value)}
        disabled={disabled}
      />
      <button
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={() => onBet(amount)}
        disabled={disabled}
      >Place Bet</button>
    </div>
  );
}
