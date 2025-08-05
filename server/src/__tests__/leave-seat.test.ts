import { describe, it, expect } from 'vitest';
import { Game } from '../game';

describe('leaveSeat', () => {
  it('refunds active bet when leaving during betting phase', () => {
    const game = new Game();
    const { seatIdx } = game.joinSeat('s1', 'Alice', 100);
    game.placeBet(seatIdx, 25);
    const seat = game.state.seats[seatIdx]!;

    game.leaveSeat('s1');

    expect(seat.balance).toBe(100);
    expect(game.state.seats[seatIdx]).toBeNull();
  });

  it('refunds queued next bet when leaving before next round', () => {
    const game = new Game();
    const { seatIdx } = game.joinSeat('s1', 'Alice', 100);
    game.state.phase = 'settle';
    game.placeBet(seatIdx, 30);
    const seat = game.state.seats[seatIdx]!;

    game.leaveSeat('s1');

    expect(seat.balance).toBe(100);
    expect(game.state.seats[seatIdx]).toBeNull();
  });
});
