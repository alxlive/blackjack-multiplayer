import { describe, it, expect } from 'vitest';
import { Game } from '../game';
import type { Card } from '../types';

function card(value: string, weight: number): Card {
  return { suit: '♠', value, weight };
}

describe('disconnection scenarios', () => {
  it('handles single player disconnect during betting with zero bet', () => {
    const game = new Game();
    const { seatIdx } = game.joinSeat('s1', 'Alice', 100);

    game.markDisconnected('s1');
    expect(game.state.seats[seatIdx]?.bets[0]).toBe(0);
    expect(game.state.seats[seatIdx]?.done).toBe(true);

    game.startPlay();
    expect(game.state.phase).toBe('settle');
    expect(game.state.seats[seatIdx]?.balance).toBe(100);
  });

  it('allows reconnect before play, new bet, then disconnect again', () => {
    const game = new Game();
    const { seatIdx, playerId } = game.joinSeat('s1', 'Alice', 100);

    game.markDisconnected('s1');
    game.joinSeat('s2', undefined, undefined, playerId);
    game.placeBet(seatIdx, 25);
    expect(game.state.seats[seatIdx]?.balance).toBe(75);

    game.markDisconnected('s2');
    expect(game.state.seats[seatIdx]?.bets[0]).toBe(0);
    expect(game.state.seats[seatIdx]?.balance).toBe(100);

    game.startPlay();
    expect(game.state.phase).toBe('settle');
  });

  it('advances turn when current player disconnects mid-game', () => {
    const game = new Game();
    const p1 = game.joinSeat('s1', 'Alice', 100);
    const p2 = game.joinSeat('s2', 'Bob', 100);

    game.state.deck = [
      card('2', 2), card('3', 3), // p1
      card('4', 4), card('5', 5), // p2
      card('6', 6),               // dealer
      ...game.state.deck,
    ];

    game.placeBet(p1.seatIdx, 10);
    game.placeBet(p2.seatIdx, 10);
    game.startPlay();
    expect(game.state.currentSeat).toBe(p1.seatIdx);

    game.markDisconnected('s1');
    expect(game.state.currentSeat).toBe(p2.seatIdx);
  });

  it('continues rounds with multiple disconnections', () => {
    const game = new Game();
    const p1 = game.joinSeat('s1', 'Alice', 100);
    const p2 = game.joinSeat('s2', 'Bob', 100);
    const p3 = game.joinSeat('s3', 'Cara', 100);

    game.state.deck = [
      card('2', 2), card('3', 3), // p1
      card('4', 4), card('5', 5), // p2
      card('6', 6), card('7', 7), // p3
      card('8', 8),               // dealer
      ...game.state.deck,
    ];

    game.placeBet(p1.seatIdx, 10);
    game.placeBet(p2.seatIdx, 10);
    game.placeBet(p3.seatIdx, 10);
    game.startPlay();

    game.markDisconnected('s3'); // player 3 disconnects before turn
    game.markDisconnected('s1'); // current player disconnects

    game.stand(p2.seatIdx); // remaining player completes turn
    expect(game.state.phase).toBe('settle');
  });

  it('keeps players offline across rounds', () => {
    const game = new Game();
    const { seatIdx } = game.joinSeat('s1', 'Alice', 100);

    game.state.deck = [
      card('2', 2), card('3', 3), // player
      card('4', 4),               // dealer
      ...game.state.deck,
    ];

    game.placeBet(seatIdx, 10);
    game.startPlay();
    game.markDisconnected('s1');
    expect(game.state.phase).toBe('settle');

    game.prepareNextRound();
    expect(game.state.seats[seatIdx]?.connected).toBe(false);
    expect(game.state.seats[seatIdx]?.bets[0]).toBe(0);

    game.startPlay();
    expect(game.state.phase).toBe('settle');
  });

  it('supports repeated disconnect and reconnect for same seat', () => {
    const game = new Game();
    const { seatIdx, playerId } = game.joinSeat('s1', 'Alice', 100);

    game.markDisconnected('s1');
    let r = game.joinSeat('s2', undefined, undefined, playerId);
    expect(r.seatIdx).toBe(seatIdx);

    game.markDisconnected('s2');
    r = game.joinSeat('s3', undefined, undefined, playerId);
    expect(r.seatIdx).toBe(seatIdx);

    game.markDisconnected('s3');
    expect(game.state.seats[seatIdx]?.connected).toBe(false);
  });
});

