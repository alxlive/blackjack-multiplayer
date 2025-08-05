import { describe, it, expect } from 'vitest';
import { Game } from '../game';

describe('placeBet', () => {
  it('replaces existing bet without additional balance loss when increasing', () => {
    const game = new Game();
    const { seatIdx } = game.joinSeat('s1', 'Alice', 100);

    game.placeBet(seatIdx, 10);
    const seat = game.state.seats[seatIdx]!;
    expect(seat.balance).toBe(90);
    expect(seat.bets[0]).toBe(10);

    game.placeBet(seatIdx, 20);
    expect(seat.balance).toBe(80);
    expect(seat.bets[0]).toBe(20);
  });

  it('replaces existing bet without additional balance loss when decreasing', () => {
    const game = new Game();
    const { seatIdx } = game.joinSeat('s1', 'Alice', 100);

    game.placeBet(seatIdx, 30);
    const seat = game.state.seats[seatIdx]!;
    expect(seat.balance).toBe(70);
    expect(seat.bets[0]).toBe(30);

    game.placeBet(seatIdx, 10);
    expect(seat.balance).toBe(90);
    expect(seat.bets[0]).toBe(10);
  });
});
