import React from 'react';
import { motion } from 'framer-motion';

interface Props { card: { suit: string; value: string }; }
export default function Card({ card }: Props) {
  return (
    <motion.div
      className="w-14 h-20 bg-white rounded-lg shadow flex items-center justify-center text-lg font-bold"
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {card.value}{card.suit}
    </motion.div>
  );
}
