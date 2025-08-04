import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Game } from './game';
import { GameState } from './types';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const game = new Game();

function maybeStartNextRound() {
  if (game.state.phase === 'settle' && game.allBetsQueued()) {
    game.prepareNextRound();
    io.emit('state', game.state);
    game.startPlay();
    io.emit('state', game.state);
  }
}

io.on('connection', socket => {
  socket.on('join', ({ name, balance, playerId }) => {
    const joinResult = game.joinSeat(socket.id, name, balance, playerId);
    socket.emit('joined', joinResult);
    io.emit('state', game.state as GameState);
  });

  socket.on('bet', ({ seatIdx, amount }) => {
    game.placeBet(seatIdx, amount);
    io.emit('state', game.state);
    if (game.state.phase === 'bet') {
      game.startPlay();
      io.emit('state', game.state);
    }
    maybeStartNextRound();
  });

  socket.on('hit', ({ seatIdx }) => {
    game.hit(seatIdx);
    io.emit('state', game.state);
    maybeStartNextRound();
  });

  socket.on('stand', ({ seatIdx }) => {
    game.stand(seatIdx);
    io.emit('state', game.state);
    maybeStartNextRound();
  });

  socket.on('double', ({ seatIdx }) => {
    game.double(seatIdx);
    io.emit('state', game.state);
    maybeStartNextRound();
  });

  socket.on('split', ({ seatIdx }) => {
    game.split(seatIdx);
    io.emit('state', game.state);
    maybeStartNextRound();
  });

  socket.on('quit', () => {
    game.leaveSeat(socket.id);
    io.emit('state', game.state);
    maybeStartNextRound();
  });

  socket.on('disconnect', () => {
    game.markDisconnected(socket.id);
    maybeStartNextRound();
    io.emit('state', game.state);
  });
});

app.use('/', express.static('public'));

server.listen(3000, '0.0.0.0', () => console.log('bound to', server.address()));

