import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import {
  Room,
  Player,
  PublicGameState,
  RevealedCard,
  ChainPiece,
  SubmittedCard,
} from './types';
import { standardCards, explicitCards } from './cards';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// Serve built client in production
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ─── In-memory state ─────────────────────────────────────────────────────────
const rooms = new Map<string, Room>();
const playerRoom = new Map<string, string>(); // socketId → roomCode

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function uniqueCode(): string {
  let code = generateCode();
  while (rooms.has(code)) code = generateCode();
  return code;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPublicState(room: Room): PublicGameState {
  const judge = room.players[room.judgeIndex];

  const revealedCards: RevealedCard[] = room.shuffledCards
    .slice(0, room.currentRevealIndex)
    .map((card) => {
      const base: RevealedCard = { cardText: card.cardText };
      if (room.phase === 'roundEnd' || room.phase === 'gameOver') {
        const p = room.players.find((pl) => pl.id === card.playerId);
        base.playerId = card.playerId;
        base.playerName = p?.name;
        base.isWinner = card.playerId === room.roundWinnerId;
      }
      return base;
    });

  const roundWinner = room.players.find((p) => p.id === room.roundWinnerId);
  const gameWinner =
    room.phase === 'gameOver'
      ? room.players.reduce((a, b) => (a.score > b.score ? a : b), room.players[0])
      : null;

  const currentChainPlayerId =
    room.phase === 'chain' && room.currentChainTurn < room.chainOrder.length
      ? room.chainOrder[room.currentChainTurn]
      : null;

  const nonJudgeConnected = room.players.filter(
    (p) => p.isConnected && p.id !== judge?.id,
  ).length;

  return {
    code: room.code,
    phase: room.phase,
    hostId: room.hostId,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isConnected: p.isConnected,
      handCount: p.hand.length,
    })),
    judgeId: judge?.id ?? '',
    chainPieces: room.chainPieces,
    chainOrder: room.chainOrder,
    currentChainPlayerId,
    submittedCardsCount: room.submittedCards.length,
    totalCardsNeeded: nonJudgeConnected,
    revealedCards,
    currentRevealIndex: room.currentRevealIndex,
    allCardsCount: room.shuffledCards.length,
    explicitMode: room.explicitMode,
    roundWinnerId: room.roundWinnerId,
    roundWinnerName: roundWinner?.name ?? null,
    pointsToWin: room.pointsToWin,
    winnerPlayerId: gameWinner?.id ?? null,
    winnerPlayerName: gameWinner?.name ?? null,
  };
}

function broadcast(room: Room) {
  const state = buildPublicState(room);
  io.to(room.code).emit('gameStateUpdate', state);
  for (const player of room.players) {
    if (player.isConnected) {
      io.to(player.id).emit('handUpdate', { hand: player.hand });
    }
  }
}

function startChainPhase(room: Room) {
  room.phase = 'chain';
  room.chainPieces = [];
  room.submittedCards = [];
  room.shuffledCards = [];
  room.currentRevealIndex = 0;
  room.roundWinnerId = null;

  const connected = room.players.filter((p) => p.isConnected);
  const judge = room.players[room.judgeIndex];
  const judgeIdx = connected.findIndex((p) => p.id === judge.id);

  // Order: left-of-judge → clockwise → judge last
  const order: string[] = [];
  for (let i = 1; i <= connected.length; i++) {
    order.push(connected[(judgeIdx + i) % connected.length].id);
  }
  room.chainOrder = order;
  room.currentChainTurn = 0;
}

// ─── Socket.IO ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  // ── createRoom ──────────────────────────────────────────────────────────
  socket.on('createRoom', (data: { playerName: string; explicitMode: boolean }) => {
    const name = (data.playerName ?? '').trim();
    if (!name) { socket.emit('error', { message: 'Nome non valido' }); return; }

    const code = uniqueCode();
    const deck = shuffle([...standardCards, ...(data.explicitMode ? explicitCards : [])]);

    const player: Player = { id: socket.id, name, score: 0, hand: [], isConnected: true };
    const room: Room = {
      code,
      hostId: socket.id,
      players: [player],
      phase: 'lobby',
      judgeIndex: 0,
      chainPieces: [],
      chainOrder: [],
      currentChainTurn: 0,
      submittedCards: [],
      shuffledCards: [],
      currentRevealIndex: 0,
      explicitMode: data.explicitMode,
      deck,
      roundWinnerId: null,
      pointsToWin: 5,
    };

    rooms.set(code, room);
    playerRoom.set(socket.id, code);
    socket.join(code);
    socket.emit('roomCreated', { roomCode: code, playerId: socket.id });
    broadcast(room);
  });

  // ── joinRoom ─────────────────────────────────────────────────────────────
  socket.on('joinRoom', (data: { roomCode: string; playerName: string }) => {
    const code = (data.roomCode ?? '').toUpperCase().trim();
    const name = (data.playerName ?? '').trim();
    const room = rooms.get(code);

    if (!room) { socket.emit('error', { message: 'Stanza non trovata' }); return; }
    if (room.phase !== 'lobby') { socket.emit('error', { message: 'Partita già iniziata' }); return; }
    if (room.players.length >= 10) { socket.emit('error', { message: 'Stanza piena (max 10 giocatori)' }); return; }
    if (!name) { socket.emit('error', { message: 'Nome non valido' }); return; }
    const existing = room.players.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!existing.isConnected) {
        // Reconnecting player — replace their socket ID
        const oldId = existing.id;
        existing.id = socket.id;
        existing.isConnected = true;
        playerRoom.delete(oldId);
        playerRoom.set(socket.id, code);
        socket.join(code);
        socket.emit('joinedRoom', { playerId: socket.id });
        broadcast(room);
        return;
      }
      socket.emit('error', { message: 'Nome già in uso in questa stanza' }); return;
    }

    const player: Player = { id: socket.id, name, score: 0, hand: [], isConnected: true };
    room.players.push(player);
    playerRoom.set(socket.id, code);
    socket.join(code);
    socket.emit('joinedRoom', { playerId: socket.id });
    broadcast(room);
  });

  // ── startGame ────────────────────────────────────────────────────────────
  socket.on('startGame', (data: { roomCode: string }) => {
    const room = rooms.get(data.roomCode);
    if (!room || room.phase !== 'lobby') return;
    if (room.hostId !== socket.id) { socket.emit('error', { message: "Solo l'host può iniziare" }); return; }
    if (room.players.length < 3) { socket.emit('error', { message: 'Servono almeno 3 giocatori' }); return; }

    for (const player of room.players) {
      player.hand = room.deck.splice(0, 7);
    }
    room.judgeIndex = Math.floor(Math.random() * room.players.length);
    startChainPhase(room);
    broadcast(room);
  });

  // ── submitChainPiece ──────────────────────────────────────────────────────
  socket.on('submitChainPiece', (data: { roomCode: string; text: string }) => {
    const room = rooms.get(data.roomCode);
    if (!room || room.phase !== 'chain') return;

    const expectedId = room.chainOrder[room.currentChainTurn];
    if (expectedId !== socket.id) { socket.emit('error', { message: 'Non è il tuo turno' }); return; }

    const text = (data.text ?? '').trim();
    if (!text) { socket.emit('error', { message: 'Testo non valido' }); return; }

    const player = room.players.find((p) => p.id === socket.id)!;
    room.chainPieces.push({ playerId: socket.id, playerName: player.name, text });
    room.currentChainTurn++;

    if (room.currentChainTurn >= room.chainOrder.length) {
      room.phase = 'cards';
    }
    broadcast(room);
  });

  // ── submitCard ────────────────────────────────────────────────────────────
  socket.on('submitCard', (data: { roomCode: string; cardText: string }) => {
    const room = rooms.get(data.roomCode);
    if (!room || room.phase !== 'cards') return;

    const judge = room.players[room.judgeIndex];
    if (socket.id === judge.id) { socket.emit('error', { message: 'Il giudice non gioca carte' }); return; }
    if (room.submittedCards.some((c) => c.playerId === socket.id)) {
      socket.emit('error', { message: 'Hai già giocato una carta' }); return;
    }

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;
    const idx = player.hand.indexOf(data.cardText);
    if (idx === -1) { socket.emit('error', { message: 'Carta non trovata' }); return; }

    player.hand.splice(idx, 1);
    room.submittedCards.push({ playerId: socket.id, cardText: data.cardText });

    const nonJudgeConnected = room.players.filter((p) => p.isConnected && p.id !== judge.id);
    if (room.submittedCards.length >= nonJudgeConnected.length) {
      room.phase = 'judging';
      room.shuffledCards = shuffle(room.submittedCards);
      room.currentRevealIndex = 0;
    }
    broadcast(room);
  });

  // ── revealNextCard ────────────────────────────────────────────────────────
  socket.on('revealNextCard', (data: { roomCode: string }) => {
    const room = rooms.get(data.roomCode);
    if (!room || room.phase !== 'judging') return;

    const judge = room.players[room.judgeIndex];
    if (socket.id !== judge.id) { socket.emit('error', { message: 'Solo il giudice rivela le carte' }); return; }
    if (room.currentRevealIndex < room.shuffledCards.length) {
      room.currentRevealIndex++;
      broadcast(room);
    }
  });

  // ── pickWinner ────────────────────────────────────────────────────────────
  socket.on('pickWinner', (data: { roomCode: string; cardIndex: number }) => {
    const room = rooms.get(data.roomCode);
    if (!room || room.phase !== 'judging') return;

    const judge = room.players[room.judgeIndex];
    if (socket.id !== judge.id) { socket.emit('error', { message: 'Solo il giudice sceglie' }); return; }
    if (room.currentRevealIndex < room.shuffledCards.length) {
      socket.emit('error', { message: 'Rivela tutte le carte prima' }); return;
    }
    if (data.cardIndex < 0 || data.cardIndex >= room.shuffledCards.length) return;

    const winning = room.shuffledCards[data.cardIndex];
    room.roundWinnerId = winning.playerId;

    const winner = room.players.find((p) => p.id === winning.playerId);
    if (winner) winner.score++;

    room.phase = winner && winner.score >= room.pointsToWin ? 'gameOver' : 'roundEnd';
    broadcast(room);
  });

  // ── startNextRound ────────────────────────────────────────────────────────
  socket.on('startNextRound', (data: { roomCode: string }) => {
    const room = rooms.get(data.roomCode);
    if (!room || room.phase !== 'roundEnd') return;
    if (room.hostId !== socket.id) return;

    // Rotate judge among connected players
    const connected = room.players.filter((p) => p.isConnected);
    const curJudge = room.players[room.judgeIndex];
    const curIdx = connected.findIndex((p) => p.id === curJudge.id);
    const nextJudge = connected[(curIdx + 1) % connected.length];
    room.judgeIndex = room.players.findIndex((p) => p.id === nextJudge.id);

    // Refill hands
    for (const player of room.players) {
      if (player.isConnected) {
        const needed = 7 - player.hand.length;
        if (needed > 0) player.hand.push(...room.deck.splice(0, Math.min(needed, room.deck.length)));
      }
    }

    startChainPhase(room);
    broadcast(room);
  });

  // ── playAgain ─────────────────────────────────────────────────────────────
  socket.on('playAgain', (data: { roomCode: string }) => {
    const room = rooms.get(data.roomCode);
    if (!room || room.phase !== 'gameOver') return;
    if (room.hostId !== socket.id) return;

    room.deck = shuffle([...standardCards, ...(room.explicitMode ? explicitCards : [])]);
    room.phase = 'lobby';
    for (const p of room.players) { p.score = 0; p.hand = []; }
    room.judgeIndex = 0;
    room.chainPieces = [];
    room.chainOrder = [];
    room.currentChainTurn = 0;
    room.submittedCards = [];
    room.shuffledCards = [];
    room.currentRevealIndex = 0;
    room.roundWinnerId = null;
    broadcast(room);
  });

  // ── disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const code = playerRoom.get(socket.id);
    if (!code) return;
    playerRoom.delete(socket.id);

    const room = rooms.get(code);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);

    if (room.phase === 'lobby') {
      room.players = room.players.filter((p) => p.id !== socket.id);
      if (room.hostId === socket.id && room.players.length > 0) {
        room.hostId = room.players[0].id;
      }
      if (room.players.length === 0) { rooms.delete(code); return; }
    } else if (player) {
      player.isConnected = false;

      // Skip turn in chain if it was theirs
      if (room.phase === 'chain') {
        const curId = room.chainOrder[room.currentChainTurn];
        if (curId === socket.id) {
          room.currentChainTurn++;
          if (room.currentChainTurn >= room.chainOrder.length) room.phase = 'cards';
        }
      }

      // Auto-advance cards phase if all connected non-judges have submitted
      if (room.phase === 'cards') {
        const judge = room.players[room.judgeIndex];
        const nonJudgeConnected = room.players.filter((p) => p.isConnected && p.id !== judge.id);
        if (room.submittedCards.length >= nonJudgeConnected.length && nonJudgeConnected.length > 0) {
          room.phase = 'judging';
          room.shuffledCards = shuffle(room.submittedCards);
          room.currentRevealIndex = 0;
        }
      }
    }

    broadcast(room);
  });
});

// Health check endpoint
app.get('/health', (_req, res) => res.send('ok'));

// Keep alive on Render free tier (ping every 14 min to prevent spin-down)
const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`🃏  Se Fossi... server → http://localhost:${PORT}`);

  const url = process.env.RENDER_EXTERNAL_URL;
  if (url) {
    setInterval(() => {
      fetch(`${url}/health`).catch(() => {});
    }, 14 * 60 * 1000);
  }
});
