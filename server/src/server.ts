import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Game } from './game';
import { GameState } from './types';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const game = new Game();

function scheduleNextRound() {
  setTimeout(() => {
    game.prepareNextRound();
    io.emit('state', game.state);
  }, 5000);
}

io.on('connection', socket => {
  socket.on('join', ({ name, balance }) => {
    const seatIdx = game.joinSeat(socket.id, name, balance);
    socket.emit('joined', { seatIdx });
    io.emit('state', game.state as GameState);
  });

  socket.on('bet', ({ seatIdx, amount }) => {
    game.placeBet(seatIdx, amount);
    io.emit('state', game.state);
    game.startPlay();
    io.emit('state', game.state);
    if (game.state.phase === 'settle') scheduleNextRound();
  });

  socket.on('hit', ({ seatIdx }) => {
    game.hit(seatIdx);
    io.emit('state', game.state);
    if (game.state.phase === 'settle') scheduleNextRound();
  });

  socket.on('stand', ({ seatIdx }) => {
    game.stand(seatIdx);
    io.emit('state', game.state);
    if (game.state.phase === 'settle') scheduleNextRound();
  });

  socket.on('double', ({ seatIdx }) => {
    game.double(seatIdx);
    io.emit('state', game.state);
    if (game.state.phase === 'settle') scheduleNextRound();
  });

  socket.on('split', ({ seatIdx }) => {
    game.split(seatIdx);
    io.emit('state', game.state);
    if (game.state.phase === 'settle') scheduleNextRound();
  });

  socket.on('quit', () => {
    game.leaveSeat(socket.id);
    io.emit('state', game.state);
  });

  socket.on('disconnect', () => {
    game.leaveSeat(socket.id);
    io.emit('state', game.state);
  });
});

app.use('/', express.static('public'));

server.listen(3000, () => console.log('Server listening on 3000'));

