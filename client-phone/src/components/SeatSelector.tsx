import React, { useState } from 'react';

interface Props {
  onJoin: (name: string, balance: number) => void;
}

export default function SeatSelector({ onJoin }: Props) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState(100);
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-2">
      <input
        className="border p-2 w-64"
        placeholder="Enter your name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        type="number"
        className="border p-2 w-64"
        placeholder="Buy-in amount"
        min={1}
        value={balance}
        onChange={e => setBalance(+e.target.value)}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={!name.trim() || balance <= 0}
        onClick={() => onJoin(name.trim(), balance)}
      >Join Table</button>
    </div>
  );
}
