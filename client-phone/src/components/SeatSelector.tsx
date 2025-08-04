import React, { useState } from 'react';

interface Props { onJoin: (name: string) => void; }

export default function SeatSelector({ onJoin }: Props) {
  const [name, setName] = useState('');
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <input
        className="border p-2 mb-2 w-64"
        placeholder="Enter your name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={!name.trim()}
        onClick={() => onJoin(name.trim())}
      >Join Table</button>
    </div>
  );
}
