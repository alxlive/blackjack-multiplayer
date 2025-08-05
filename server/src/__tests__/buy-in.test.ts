import { describe, it, expect } from 'vitest';
import { Game } from '../game';

describe('buyIn', () => {
  it('increases seat balance by the given amount', () => {
    const game = new Game();
    const { seatIdx } = game.joinSeat('s1', 'Alice', 100);
    game.buyIn(seatIdx, 50);
    expect(game.state.seats[seatIdx]!.balance).toBe(150);
  });

  it('rejects non-positive amounts', () => {
    const game = new Game();
    const { seatIdx } = game.joinSeat('s1', 'Alice', 100);
    expect(() => game.buyIn(seatIdx, 0)).toThrow();
    expect(() => game.buyIn(seatIdx, -20)).toThrow();
  });

  it('throws for invalid seat', () => {
    const game = new Game();
    expect(() => game.buyIn(0, 10)).toThrow();
  });
});

