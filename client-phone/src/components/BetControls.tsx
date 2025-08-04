import React, { useState } from 'react';

interface Props {
  balance: number;
  onBet: (amount: number) => void;
  onSkip: () => void;
  onQuit: () => void;
  disabled?: boolean;
}

export default function BetControls({ balance, onBet, onSkip, onQuit, disabled }: Props) {
  const [amount, setAmount] = useState(10);
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex flex-col items-center">
        <label className="mb-2">Bet Amount</label>
        <p className="mb-1">Balance: ${balance}</p>
        <input
          type="number"
          className="border p-2 w-32 mb-2"
          min={1}
          max={balance}
          value={amount}
          onChange={e => setAmount(+e.target.value)}
          disabled={disabled}
        />
        <div className="flex space-x-2">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={() => onBet(amount)}
            disabled={disabled || amount > balance}
          >Place Bet</button>
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={onSkip}
            disabled={disabled}
          >Skip</button>
        </div>
      </div>
      <button
        className="text-red-600 underline"
        onClick={onQuit}
      >Quit Game</button>
    </div>
  );
}
