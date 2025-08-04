import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Game } from './game';
import { GameState } from './types';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const game = new Game();

io.on('connection', socket => {
  socket.on('join', ({ name }) => {
    const seatIdx = game.joinSeat(socket.id, name);
    socket.emit('joined', { seatIdx });
    io.emit('state', game.state as GameState);
  });

  socket.on('bet', ({ seatIdx, amount }) => {
    game.placeBet(seatIdx, amount);
    io.emit('state', game.state);
    game.startPlay();
    io.emit('state', game.state);
  });

  socket.on('hit', ({ seatIdx }) => {
    game.hit(seatIdx);
    io.emit('state', game.state);
  });

  socket.on('stand', ({ seatIdx }) => {
    game.stand(seatIdx);
    io.emit('state', game.state);
  });
});

app.use('/', express.static('public'));

server.listen(3000, () => console.log('Server listening on 3000'));

