import { useState, useEffect } from 'react';
import { socket } from './socket';
import { PublicGameState } from './types';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'room'>('home');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [gameState, setGameState] = useState<PublicGameState | null>(null);
  const [hand, setHand] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socket.on('roomCreated', ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setScreen('room');
    });

    socket.on('joinedRoom', ({ playerId }: { playerId: string }) => {
      setPlayerId(playerId);
      setScreen('room');
    });

    socket.on('gameStateUpdate', (state: PublicGameState) => {
      setGameState(state);
    });

    socket.on('handUpdate', ({ hand }: { hand: string[] }) => {
      setHand(hand);
    });

    socket.on('error', ({ message }: { message: string }) => {
      setError(message);
      setTimeout(() => setError(null), 3500);
    });

    socket.connect();

    return () => {
      socket.off('roomCreated');
      socket.off('joinedRoom');
      socket.off('gameStateUpdate');
      socket.off('handUpdate');
      socket.off('error');
    };
  }, []);

  function handleLeave() {
    socket.disconnect();
    setScreen('home');
    setGameState(null);
    setHand([]);
    setPlayerId(null);
    setRoomCode(null);
    setTimeout(() => socket.connect(), 100);
  }

  if (screen === 'room' && gameState && playerId && roomCode) {
    return (
      <GameRoom
        gameState={gameState}
        playerId={playerId}
        roomCode={roomCode}
        hand={hand}
        error={error}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <Lobby
      onCreateRoom={(playerName, explicitMode) =>
        socket.emit('createRoom', { playerName, explicitMode })
      }
      onJoinRoom={(code, playerName) =>
        socket.emit('joinRoom', { roomCode: code, playerName })
      }
      error={error}
    />
  );
}
